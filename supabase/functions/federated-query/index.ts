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
    const { query, category } = await req.json();

    console.log("[Federated Query] Incoming request:", { query, category });

    // Get federated connection details
    const federatedUrl = Deno.env.get("FEDERATED_SUPABASE_URL");
    const federatedKey = Deno.env.get("FEDERATED_SUPABASE_ANON_KEY");
    const syncKey = Deno.env.get("FEDERATED_SYNC_KEY");

    if (!federatedUrl || !federatedKey) {
      console.log("[Federated Query] Missing federated credentials");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Federated Core connection not configured",
          knowledge: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Federated Query] Connecting to Federated Core at:", federatedUrl);

    // Create federated Supabase client
    const federatedClient = createClient(federatedUrl, federatedKey, {
      global: {
        headers: {
          "X-Sync-Key": syncKey || "",
        },
      },
    });

    // Query the federated knowledge base
    // Try multiple potential table names for knowledge storage
    let knowledge: any[] = [];
    let source = "unknown";

    // Try querying a knowledge_base table
    const { data: kbData, error: kbError } = await federatedClient
      .from("knowledge_base")
      .select("*")
      .textSearch("content", query || "", { type: "websearch" })
      .limit(10);

    if (!kbError && kbData && kbData.length > 0) {
      knowledge = kbData;
      source = "knowledge_base";
      console.log("[Federated Query] Found knowledge in knowledge_base:", kbData.length, "records");
    }

    // If no results, try a research_data table
    if (knowledge.length === 0) {
      const { data: rdData, error: rdError } = await federatedClient
        .from("research_data")
        .select("*")
        .limit(20);

      if (!rdError && rdData && rdData.length > 0) {
        knowledge = rdData;
        source = "research_data";
        console.log("[Federated Query] Found data in research_data:", rdData.length, "records");
      }
    }

    // Try genomics_insights table
    if (knowledge.length === 0) {
      const { data: giData, error: giError } = await federatedClient
        .from("genomics_insights")
        .select("*")
        .limit(20);

      if (!giError && giData && giData.length > 0) {
        knowledge = giData;
        source = "genomics_insights";
        console.log("[Federated Query] Found data in genomics_insights:", giData.length, "records");
      }
    }

    // Try a general data or findings table
    if (knowledge.length === 0) {
      const { data: findingsData, error: findingsError } = await federatedClient
        .from("findings")
        .select("*")
        .limit(20);

      if (!findingsError && findingsData && findingsData.length > 0) {
        knowledge = findingsData;
        source = "findings";
        console.log("[Federated Query] Found data in findings:", findingsData.length, "records");
      }
    }

    // Get available tables for debugging
    const { data: tablesData, error: tablesError } = await federatedClient
      .rpc("get_tables")
      .select("*");

    let availableTables: string[] = [];
    if (!tablesError && tablesData) {
      availableTables = tablesData;
      console.log("[Federated Query] Available tables:", availableTables);
    }

    // Return results
    const response = {
      success: true,
      query,
      source,
      knowledge,
      availableTables,
      federatedNode: federatedUrl.replace(/https?:\/\//, "").split(".")[0],
      timestamp: new Date().toISOString(),
      recordCount: knowledge.length,
    };

    console.log("[Federated Query] Returning response with", knowledge.length, "records from", source);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Federated Query] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to query Federated Core";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        knowledge: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
