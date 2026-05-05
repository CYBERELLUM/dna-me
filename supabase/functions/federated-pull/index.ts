import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PullRequest {
  category?: string;        // Filter by category (e.g., "security_pattern", "discovery", "molecular_targets")
  topic?: string;           // Filter by specific topic
  keywords?: string[];      // Search by keywords
  limit?: number;           // Max records to return (default: 50)
  includeImplementation?: boolean;  // Include implementation code snippets
  minConfidence?: number;   // Minimum confidence score (0-1)
}

interface KnowledgeRecord {
  id: string;
  topic: string;
  title: string;
  content: string;
  implementation?: string;
  keywords: string[];
  category: string;
  satellite_origin?: string;
  confidence?: number;
  created_at: string;
}

interface GenomicsInsight {
  id: string;
  category: string;
  title: string;
  finding: string;
  mechanism?: string;
  implication?: string;
  confidence?: number;
  years_studied?: number;
  source?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const {
      category,
      topic,
      keywords = [],
      limit = 50,
      includeImplementation = true,
      minConfidence = 0
    }: PullRequest = requestBody;

    console.log("[Federated Pull] Starting pull operation");
    console.log("[Federated Pull] Filters:", { category, topic, keywords, limit, minConfidence });

    const federatedUrl = Deno.env.get("FEDERATED_SUPABASE_URL");
    const federatedKey = Deno.env.get("FEDERATED_SUPABASE_ANON_KEY");
    const syncKey = Deno.env.get("FEDERATED_SYNC_KEY");

    if (!federatedUrl || !federatedKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Federated Core not configured. Set FEDERATED_SUPABASE_URL and FEDERATED_SUPABASE_ANON_KEY secrets." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nodeId = federatedUrl.replace(/https?:\/\//, "").split(".")[0];
    console.log("[Federated Pull] Connected to Federated Core:", nodeId);

    const federatedClient = createClient(federatedUrl, federatedKey, {
      global: { headers: { "X-Sync-Key": syncKey || "" } }
    });

    const results: {
      knowledge: KnowledgeRecord[];
      genomics: GenomicsInsight[];
      securityPatterns: KnowledgeRecord[];
    } = {
      knowledge: [],
      genomics: [],
      securityPatterns: []
    };

    // Build knowledge_base query
    let knowledgeQuery = federatedClient
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (category) {
      knowledgeQuery = knowledgeQuery.eq("category", category);
    }
    if (topic) {
      knowledgeQuery = knowledgeQuery.eq("topic", topic);
    }
    if (minConfidence > 0) {
      knowledgeQuery = knowledgeQuery.gte("confidence", minConfidence);
    }

    const { data: knowledgeData, error: knowledgeError } = await knowledgeQuery;

    if (knowledgeError) {
      console.error("[Federated Pull] Knowledge query error:", knowledgeError.message);
    } else if (knowledgeData) {
      // Separate security patterns from general knowledge
      for (const record of knowledgeData as KnowledgeRecord[]) {
        // Filter by keywords if provided
        if (keywords.length > 0) {
          const recordKeywords = record.keywords || [];
          const hasMatch = keywords.some(kw => 
            recordKeywords.some((rk: string) => rk.toLowerCase().includes(kw.toLowerCase())) ||
            record.title.toLowerCase().includes(kw.toLowerCase()) ||
            record.content.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasMatch) continue;
        }

        // Optionally strip implementation code
        if (!includeImplementation && record.implementation) {
          delete record.implementation;
        }

        if (record.category === "security_pattern") {
          results.securityPatterns.push(record);
        } else {
          results.knowledge.push(record);
        }
      }
    }

    // Build genomics_insights query (only if not specifically filtering for security)
    if (category !== "security_pattern") {
      let genomicsQuery = federatedClient
        .from("genomics_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category && category !== "security_pattern") {
        genomicsQuery = genomicsQuery.eq("category", category);
      }
      if (minConfidence > 0) {
        genomicsQuery = genomicsQuery.gte("confidence", minConfidence);
      }

      const { data: genomicsData, error: genomicsError } = await genomicsQuery;

      if (genomicsError) {
        console.error("[Federated Pull] Genomics query error:", genomicsError.message);
      } else if (genomicsData) {
        // Filter by keywords if provided
        for (const record of genomicsData as GenomicsInsight[]) {
          if (keywords.length > 0) {
            const hasMatch = keywords.some(kw => 
              record.title.toLowerCase().includes(kw.toLowerCase()) ||
              record.finding.toLowerCase().includes(kw.toLowerCase()) ||
              (record.mechanism && record.mechanism.toLowerCase().includes(kw.toLowerCase()))
            );
            if (!hasMatch) continue;
          }
          results.genomics.push(record);
        }
      }
    }

    const totalRecords = results.knowledge.length + results.genomics.length + results.securityPatterns.length;

    console.log("[Federated Pull] Complete. Retrieved:", totalRecords, "records");
    console.log("[Federated Pull] Security patterns:", results.securityPatterns.length);

    // Generate summary of available security patterns
    const securitySummary = results.securityPatterns.map(p => ({
      topic: p.topic,
      title: p.title,
      hasImplementation: !!p.implementation,
      confidence: p.confidence,
      origin: p.satellite_origin
    }));

    return new Response(
      JSON.stringify({
        success: true,
        node: nodeId,
        results,
        summary: {
          totalRecords,
          knowledgeRecords: results.knowledge.length,
          genomicsRecords: results.genomics.length,
          securityPatterns: results.securityPatterns.length,
          availableSecurityPatterns: securitySummary
        },
        filters: { category, topic, keywords, limit, minConfidence },
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Federated Pull] Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
