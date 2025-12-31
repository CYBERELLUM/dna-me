import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to log sync operations to local database using fetch
async function logSyncOperation(
  operation: string,
  nodeId: string,
  status: string,
  recordsSynced: number,
  recordsFailed: number,
  details: Record<string, unknown>,
  errorMessage: string | null = null
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
        node_id: nodeId,
        status,
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        details,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
    });
  } catch (err) {
    console.error("[Federated Query] Failed to log:", err);
  }
}


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = "discover", table, limit = 50 } = await req.json();

    console.log("[Federated Core] Request:", { action, table, limit });

    // Get federated connection details
    const federatedUrl = Deno.env.get("FEDERATED_SUPABASE_URL");
    const federatedKey = Deno.env.get("FEDERATED_SUPABASE_ANON_KEY");
    const syncKey = Deno.env.get("FEDERATED_SYNC_KEY");

    if (!federatedUrl || !federatedKey) {
      console.log("[Federated Core] Missing credentials");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Federated Core connection not configured",
          node: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const nodeId = federatedUrl.replace(/https?:\/\//, "").split(".")[0];
    console.log("[Federated Core] Connected to node:", nodeId);

    // Create federated Supabase client
    const federatedClient = createClient(federatedUrl, federatedKey, {
      global: {
        headers: {
          "X-Sync-Key": syncKey || "",
        },
      },
    });

    // If action is "query" and table is specified, fetch data from that table
    if (action === "query" && table) {
      console.log("[Federated Core] Querying table:", table);

      const { data, error, count } = await federatedClient
        .from(table)
        .select("*", { count: "exact" })
        .limit(limit);

      if (error) {
        console.log("[Federated Core] Query error:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            node: { id: nodeId },
            table,
            message: `Error querying ${table}: ${error.message}`,
            data: null,
            count: 0,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("[Federated Core] Query result:", data?.length || 0, "records, total:", count);

      // Log the query operation
      await logSyncOperation("query", nodeId, "completed", data?.length || 0, 0, { table, limit });

      return new Response(
        JSON.stringify({
          success: true,
          node: { id: nodeId, url: federatedUrl },
          table,
          data: data || [],
          count: count || 0,
          message: data && data.length > 0 
            ? `Retrieved ${data.length} records from ${table}` 
            : `Table ${table} exists but contains no data yet`,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default: Discovery mode
    console.log("[Federated Core] Discovering available resources...");

    const commonTables = [
      "knowledge_base", "research_data", "genomics_insights", "findings",
      "articles", "publications", "data", "records", "content", "documents",
      "profiles", "users", "settings", "config"
    ];

    const availableTables: { name: string; count: number }[] = [];

    for (const tableName of commonTables) {
      const { count, error } = await federatedClient
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (!error) {
        availableTables.push({ name: tableName, count: count || 0 });
        console.log("[Federated Core] Found table:", tableName, "with", count || 0, "records");
      }
    }

    const response = {
      success: true,
      node: {
        id: nodeId,
        url: federatedUrl,
        syncKey: syncKey ? "configured" : "not configured",
      },
      discovery: {
        tablesFound: availableTables.length,
        tables: availableTables,
        totalRecords: availableTables.reduce((sum, t) => sum + t.count, 0),
      },
      message: availableTables.length > 0
        ? `Federated Core has ${availableTables.length} tables with ${availableTables.reduce((sum, t) => sum + t.count, 0)} total records`
        : "Federated Core connected but no knowledge tables found yet",
      timestamp: new Date().toISOString(),
    };

    console.log("[Federated Core] Discovery complete");

    // Log the discovery operation
    await logSyncOperation("discover", nodeId, "completed", availableTables.reduce((sum, t) => sum + t.count, 0), 0, { tablesFound: availableTables.length });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Federated Core] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to query Federated Core";

    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        node: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
