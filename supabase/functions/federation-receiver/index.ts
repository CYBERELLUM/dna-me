import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-key",
};

// Federation Core (ECHO-001)
const CORE_URL = 'https://yokxmlatktvxqymxtktn.supabase.co';
const CORE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlva3htbGF0a3R2eHF5bXh0a3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODgwNjksImV4cCI6MjA4MTE2NDA2OX0.ubCshUIfy05uo_U8LzKo4hgxbiRDcybXjo72bUi3Qag';
const MY_NODE_ID = 'cyberellum-research';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data, table, filters } = await req.json();
    console.log(`[Federation Receiver] Action: ${action}, Table: ${table || 'N/A'}`);

    const syncKey = req.headers.get("x-sync-key");
    const expectedSyncKey = Deno.env.get("FEDERATED_SYNC_KEY");

    // Allow ping and status without auth, require sync key for write operations
    const publicActions = ["ping", "status"];
    if (!publicActions.includes(action) && syncKey !== expectedSyncKey) {
      console.log("[Federation Receiver] Invalid sync key for action:", action);
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized: Invalid sync key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Local Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const localClient = createClient(supabaseUrl, supabaseKey);

    // Core client for federation operations
    const coreClient = createClient(CORE_URL, CORE_ANON_KEY, {
      global: { headers: { "X-Sync-Key": expectedSyncKey || "" } }
    });

    switch (action) {
      case "ping": {
        // Health check from core
        return new Response(
          JSON.stringify({
            success: true,
            node: MY_NODE_ID,
            status: "online",
            timestamp: new Date().toISOString(),
            capabilities: ["receive", "broadcast", "sync"]
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "receive": {
        // Receive data pushed from core or other satellites
        if (!table || !data) {
          return new Response(
            JSON.stringify({ success: false, message: "Missing table or data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[Federation Receiver] Receiving ${Array.isArray(data) ? data.length : 1} records for ${table}`);

        const records = Array.isArray(data) ? data : [data];
        let inserted = 0;
        const errors: string[] = [];

        for (const record of records) {
          const { error } = await localClient.from(table).upsert({
            ...record,
            federation_source: record.federation_source || "core",
            synced_at: new Date().toISOString()
          }, { onConflict: "id" });

          if (error) {
            errors.push(error.message);
          } else {
            inserted++;
          }
        }

        // Log to sync history
        await logSyncOperation("receive", table, inserted, errors.length, { source: "core" });

        return new Response(
          JSON.stringify({
            success: inserted > 0,
            node: MY_NODE_ID,
            received: inserted,
            errors: errors.length,
            timestamp: new Date().toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "broadcast": {
        // Push local data to core for distribution
        if (!table) {
          return new Response(
            JSON.stringify({ success: false, message: "Missing table" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let query = localClient.from(table).select("*");
        
        if (filters?.since) {
          query = query.gte("updated_at", filters.since);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data: localData, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Send to core
        const { error: coreError } = await coreClient.functions.invoke("federation-ingest", {
          body: {
            source_node: MY_NODE_ID,
            table,
            data: localData,
            timestamp: new Date().toISOString()
          }
        });

        await logSyncOperation("broadcast", table, localData?.length || 0, coreError ? 1 : 0, { destination: "core" });

        return new Response(
          JSON.stringify({
            success: !coreError,
            node: MY_NODE_ID,
            broadcasted: localData?.length || 0,
            timestamp: new Date().toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync": {
        // Full bidirectional sync with core
        console.log("[Federation Receiver] Starting full sync with core...");

        // Pull from core
        const { data: coreData, error: pullError } = await coreClient.functions.invoke("federated-pull", {
          body: { limit: 100, includeImplementation: false }
        });

        let pulled = 0;
        if (!pullError && coreData?.results) {
          // Store knowledge from core
          for (const record of coreData.results.knowledge || []) {
            const { error } = await localClient.from("federation_knowledge_cache").upsert({
              ...record,
              source_node: "core",
              synced_at: new Date().toISOString()
            }, { onConflict: "id" });
            if (!error) pulled++;
          }
        }

        // Push local insights to core
        const { data: localInsights } = await localClient
          .from("chat_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        let pushed = 0;
        if (localInsights?.length) {
          const { error: pushError } = await coreClient.functions.invoke("federation-ingest", {
            body: {
              source_node: MY_NODE_ID,
              table: "satellite_insights",
              data: localInsights.map(i => ({
                ...i,
                source_satellite: MY_NODE_ID
              }))
            }
          });
          if (!pushError) pushed = localInsights.length;
        }

        await logSyncOperation("sync", "bidirectional", pulled + pushed, 0, { pulled, pushed });

        return new Response(
          JSON.stringify({
            success: true,
            node: MY_NODE_ID,
            sync: { pulled, pushed },
            timestamp: new Date().toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        // Return node status for federation monitoring
        const { count: historyCount } = await localClient
          .from("federation_sync_history")
          .select("*", { count: "exact", head: true });

        const { data: recentSyncs } = await localClient
          .from("federation_sync_history")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(5);

        return new Response(
          JSON.stringify({
            success: true,
            node: {
              id: MY_NODE_ID,
              name: "Cyberellum Research Platform",
              status: "online",
              core: CORE_URL.replace("https://", "").split(".")[0]
            },
            stats: {
              totalSyncs: historyCount || 0,
              recentSyncs: recentSyncs || []
            },
            timestamp: new Date().toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, message: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[Federation Receiver] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "Federation receiver error",
        node: MY_NODE_ID
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper to log sync operations
async function logSyncOperation(
  operation: string,
  table: string,
  recordsSynced: number,
  recordsFailed: number,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) return;
    
    await fetch(`${supabaseUrl}/rest/v1/federation_sync_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        operation,
        node_id: MY_NODE_ID,
        status: recordsFailed === 0 ? "completed" : "partial",
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        details: { ...details, table },
        completed_at: new Date().toISOString(),
      })
    });
  } catch (err) {
    console.error("[Federation Receiver] Failed to log:", err);
  }
}
