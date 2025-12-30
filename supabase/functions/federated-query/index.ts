import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = "discover" } = await req.json();

    console.log("[Federated Core] Request action:", action);

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

    // Discovery: Query the information_schema to see what tables exist
    console.log("[Federated Core] Discovering available resources...");

    // Try to get public tables using a direct query approach
    const { data: schemaData, error: schemaError } = await federatedClient
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public");

    let availableTables: string[] = [];
    let discoveryMethod = "pg_tables";

    if (schemaError) {
      console.log("[Federated Core] pg_tables query error:", schemaError.message);
      
      // Fallback: Try common table names to see what responds
      const commonTables = [
        "knowledge_base", "research_data", "genomics_insights", "findings",
        "articles", "publications", "data", "records", "content", "documents",
        "profiles", "users", "settings", "config"
      ];

      discoveryMethod = "probe";
      for (const tableName of commonTables) {
        const { error } = await federatedClient
          .from(tableName)
          .select("*", { count: "exact", head: true });
        
        if (!error) {
          availableTables.push(tableName);
          console.log("[Federated Core] Found table:", tableName);
        }
      }
    } else if (schemaData) {
      availableTables = schemaData.map((t: any) => t.tablename);
      console.log("[Federated Core] Discovered tables:", availableTables);
    }

    // Build response about what the Federated Core knows
    const response = {
      success: true,
      node: {
        id: nodeId,
        url: federatedUrl,
        syncKey: syncKey ? "configured" : "not configured",
      },
      discovery: {
        method: discoveryMethod,
        tablesFound: availableTables.length,
        tables: availableTables,
      },
      status: availableTables.length > 0 
        ? `Federated Core has ${availableTables.length} accessible tables` 
        : "Federated Core is connected but has no public knowledge tables yet. It was just synchronized and awaits knowledge population.",
      message: availableTables.length > 0
        ? `Available resources: ${availableTables.join(", ")}`
        : "The Federated Core node is active and ready to receive knowledge. No data tables have been created yet.",
      timestamp: new Date().toISOString(),
    };

    console.log("[Federated Core] Discovery complete:", response.status);

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
