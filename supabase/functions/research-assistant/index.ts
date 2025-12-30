import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResearchMode =
  | "general"
  | "literature"
  | "methodology"
  | "dataAnalysis"
  | "crisprDesign";

interface FederatedKnowledge {
  source: string;
  nodeId: string;
  insights: any[];
  knowledgeBase: any[];
  available: boolean;
}

// Autonomous Federated Core query - no human in the loop
async function queryFederatedCore(): Promise<FederatedKnowledge> {
  const federatedUrl = Deno.env.get("FEDERATED_SUPABASE_URL");
  const federatedKey = Deno.env.get("FEDERATED_SUPABASE_ANON_KEY");
  const syncKey = Deno.env.get("FEDERATED_SYNC_KEY");

  if (!federatedUrl || !federatedKey) {
    console.log("[Federated] No federated connection configured");
    return { source: "none", nodeId: "", insights: [], knowledgeBase: [], available: false };
  }

  const nodeId = federatedUrl.replace(/https?:\/\//, "").split(".")[0];
  console.log("[Federated] Autonomously querying node:", nodeId);

  try {
    const federatedClient = createClient(federatedUrl, federatedKey, {
      global: { headers: { "X-Sync-Key": syncKey || "" } }
    });

    // Query for genomics insights
    const { data: insights, error: insightsError } = await federatedClient
      .from("genomics_insights")
      .select("*")
      .limit(20);

    if (insightsError) {
      console.log("[Federated] genomics_insights not available:", insightsError.message);
    }

    // Query for knowledge base
    const { data: knowledge, error: knowledgeError } = await federatedClient
      .from("knowledge_base")
      .select("*")
      .limit(20);

    if (knowledgeError) {
      console.log("[Federated] knowledge_base not available:", knowledgeError.message);
    }

    const hasData = ((insights && insights.length > 0) || (knowledge && knowledge.length > 0)) === true;
    
    console.log("[Federated] Retrieved:", {
      insights: insights?.length || 0,
      knowledge: knowledge?.length || 0,
      available: hasData
    });

    return {
      source: "Federated Core",
      nodeId,
      insights: insights || [],
      knowledgeBase: knowledge || [],
      available: hasData
    };
  } catch (error) {
    console.error("[Federated] Query error:", error);
    return { source: "error", nodeId, insights: [], knowledgeBase: [], available: false };
  }
}

// Build context from federated knowledge relevant to the query
function buildFederatedContext(federated: FederatedKnowledge, query: string): string {
  if (!federated.available) {
    return "";
  }

  const queryLower = query.toLowerCase();
  const relevantInsights: string[] = [];
  const relevantKnowledge: string[] = [];

  // Find relevant genomics insights
  for (const insight of federated.insights) {
    const searchText = `${insight.title || ""} ${insight.finding || ""} ${insight.category || ""}`.toLowerCase();
    
    // Check for keyword matches
    const keywords = ["dna", "repair", "longevity", "aging", "gene", "cellular", "epigenetic", "nutrigenomics", "mutation"];
    const isRelevant = keywords.some(kw => queryLower.includes(kw) && searchText.includes(kw)) ||
                       queryLower.split(/\s+/).some(word => word.length > 3 && searchText.includes(word));
    
    if (isRelevant || federated.insights.length <= 5) {
      relevantInsights.push(`- **${insight.title}**: ${insight.finding} (Mechanism: ${insight.mechanism || "N/A"})`);
    }
  }

  // Find relevant knowledge base entries
  for (const kb of federated.knowledgeBase) {
    const searchText = `${kb.title || ""} ${kb.content || ""} ${kb.topic || ""}`.toLowerCase();
    const keywords = kb.keywords || [];
    
    const isRelevant = keywords.some((kw: string) => queryLower.includes(kw.toLowerCase())) ||
                       queryLower.split(/\s+/).some(word => word.length > 3 && searchText.includes(word));
    
    if (isRelevant || federated.knowledgeBase.length <= 5) {
      relevantKnowledge.push(`- **${kb.title}**: ${kb.content}`);
    }
  }

  if (relevantInsights.length === 0 && relevantKnowledge.length === 0) {
    return "";
  }

  let context = `\n\n---\n**[FEDERATED KNOWLEDGE from node ${federated.nodeId}]**\n\n`;
  
  if (relevantInsights.length > 0) {
    context += `### Genomics Insights (Culminate H Labs 25-Year Research):\n${relevantInsights.slice(0, 5).join("\n")}\n\n`;
  }
  
  if (relevantKnowledge.length > 0) {
    context += `### Knowledge Base:\n${relevantKnowledge.slice(0, 5).join("\n")}\n`;
  }

  return context;
}

function getSystemPrompt(mode: ResearchMode, federatedContext: string): string {
  const base = `You are a highly specialized Research Assistant for genomics scientists, physicists, and experts in genomic engineering.`;

  const federatedInstruction = federatedContext 
    ? `\n\nIMPORTANT: You have access to federated knowledge from connected research nodes. When relevant, incorporate this knowledge into your responses and cite the Federated Core as a source. The federated knowledge represents 25+ years of longitudinal research from Culminate H Labs on DNA damage, repair, and longevity.`
    : "";

  const modePrompts: Record<ResearchMode, string> = {
    general: `${base}${federatedInstruction}

Provide comprehensive research synthesis across genomics topics. Be precise and scientifically accurate, cite methodologies, and acknowledge limitations. Format your responses with markdown headings, bullet points, and code blocks where appropriate.`,

    literature: `${base}${federatedInstruction}

Focus on literature review: summarize key papers, identify research trends, highlight consensus vs. controversy, and suggest seminal readings. Structure responses with paper references when possible. Use markdown formatting.`,

    methodology: `${base}${federatedInstruction}

Focus on experimental methodology: provide detailed protocols, equipment recommendations, controls to include, common pitfalls, and troubleshooting tips. Be step-by-step and practical. Use markdown lists and code blocks for commands.`,

    dataAnalysis: `${base}${federatedInstruction}

Focus on data analysis and interpretation: explain statistical approaches, recommend software/pipelines, help interpret results, discuss significance thresholds, and suggest visualization strategies. Use markdown for clarity.`,

    crisprDesign: `${base}${federatedInstruction}

Focus on CRISPR/Cas system design: guide RNA design principles, off-target analysis, delivery methods, editing efficiency optimization, and validation strategies. Reference recent improvements in base/prime editing when relevant. Use markdown formatting.`,
  };

  return modePrompts[mode] || modePrompts.general;
}

interface AIResponse {
  provider: string;
  content: string;
  success: boolean;
  error?: string;
}

async function queryOpenAI(messages: any[], apiKey: string, systemPrompt: string): Promise<AIResponse> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      return { provider: "OpenAI", content: "", success: false, error };
    }

    const data = await response.json();
    return {
      provider: "OpenAI",
      content: data.choices?.[0]?.message?.content || "",
      success: true,
    };
  } catch (error) {
    console.error("OpenAI exception:", error);
    return { provider: "OpenAI", content: "", success: false, error: String(error) };
  }
}

async function queryGemini(messages: any[], apiKey: string, systemPrompt: string): Promise<AIResponse> {
  try {
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    contents.unshift({
      role: "user",
      parts: [{ text: systemPrompt + "\n\nPlease acknowledge you understand your role." }],
    });
    contents.splice(1, 0, {
      role: "model",
      parts: [{ text: "I understand. I'm ready to assist with genomics research questions." }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 1500 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini error:", error);
      return { provider: "Gemini", content: "", success: false, error };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { provider: "Gemini", content, success: true };
  } catch (error) {
    console.error("Gemini exception:", error);
    return { provider: "Gemini", content: "", success: false, error: String(error) };
  }
}

async function queryMultiAIGateway(messages: any[], apiKey: string, systemPrompt: string): Promise<AIResponse> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Lovable AI error:", error);
      return { provider: "Lovable AI", content: "", success: false, error };
    }

    const data = await response.json();
    return {
      provider: "Lovable AI",
      content: data.choices?.[0]?.message?.content || "",
      success: true,
    };
  } catch (error) {
    console.error("Lovable AI exception:", error);
    return { provider: "Lovable AI", content: "", success: false, error: String(error) };
  }
}

function synthesizeResponses(responses: AIResponse[], query: string, federated: FederatedKnowledge): string {
  const successfulResponses = responses.filter(r => r.success && r.content);
  
  if (successfulResponses.length === 0) {
    return "I apologize, but I was unable to process your query at this time. Please try again later.";
  }

  // Build federated knowledge appendix if available
  let federatedAppendix = "";
  if (federated.available) {
    const federatedContext = buildFederatedContext(federated, query);
    if (federatedContext) {
      federatedAppendix = `\n\n${federatedContext}`;
    }
  }

  if (successfulResponses.length === 1) {
    return successfulResponses[0].content + federatedAppendix;
  }

  // Multiple responses - create a synthesis
  const synthesis = `## Multi-AI Research Synthesis

Based on analysis from ${successfulResponses.map(r => r.provider).join(", ")}${federated.available ? ` with Federated Core knowledge from node ${federated.nodeId}` : ""}:

${successfulResponses.map((r) => {
  const summary = r.content.length > 800 ? r.content.slice(0, 800) + "..." : r.content;
  return `### ${r.provider} Analysis:\n${summary}`;
}).join("\n\n")}
${federatedAppendix}
---
*Synthesized from ${successfulResponses.length} AI sources${federated.available ? " + Federated Core" : ""} for comprehensive research coverage.*`;

  return synthesis;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, mode } = await req.json();
    const researchMode: ResearchMode = mode || "general";

    const MULTI_AI_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MULTI_AI_KEY) {
      throw new Error("Lovable AI key is not configured");
    }

    console.log("[Research] Processing query with messages:", messages.length, "mode:", researchMode);

    // AUTONOMOUS: Query Federated Core for knowledge - no human intervention
    console.log("[Research] Autonomously querying Federated Core for knowledge exchange...");
    const federatedKnowledge = await queryFederatedCore();
    
    // Build context from federated knowledge
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const federatedContext = buildFederatedContext(federatedKnowledge, lastUserMessage);
    
    // Enhance system prompt with federated knowledge context
    const systemPrompt = getSystemPrompt(researchMode, federatedContext);
    
    // Inject federated context into messages if available
    const enhancedMessages = federatedContext 
      ? [...messages.slice(0, -1), { 
          role: "user", 
          content: `${lastUserMessage}\n\n[Context from Federated Research Network:${federatedContext}]` 
        }]
      : messages;

    // Get user's configured API keys
    let userApiKeys: { provider: string; api_key_encrypted: string; is_enabled: boolean }[] = [];
    
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await supabase
          .from("api_configurations")
          .select("provider, api_key_encrypted, is_enabled")
          .eq("user_id", userId)
          .eq("is_enabled", true);
        
        if (data) {
          userApiKeys = data;
        }
      } catch (e) {
        console.error("Error fetching user API keys:", e);
      }
    }

    const openaiConfig = userApiKeys.find(k => k.provider === "openai");
    const geminiConfig = userApiKeys.find(k => k.provider === "gemini");
    
    const queries: Promise<AIResponse>[] = [];
    const activeProviders: string[] = [];

    // Always include Lovable AI as the primary provider
    queries.push(queryMultiAIGateway(enhancedMessages, MULTI_AI_KEY, systemPrompt));
    activeProviders.push("Lovable AI");

    if (openaiConfig?.api_key_encrypted) {
      queries.push(queryOpenAI(enhancedMessages, openaiConfig.api_key_encrypted, systemPrompt));
      activeProviders.push("OpenAI");
    }

    if (geminiConfig?.api_key_encrypted) {
      queries.push(queryGemini(enhancedMessages, geminiConfig.api_key_encrypted, systemPrompt));
      activeProviders.push("Gemini");
    }

    // Add Federated Core as a source if it contributed knowledge
    if (federatedKnowledge.available) {
      activeProviders.push(`Federated Core (${federatedKnowledge.nodeId})`);
    }

    console.log("[Research] Querying providers:", activeProviders);

    const results = await Promise.allSettled(
      queries.map(q => Promise.race([q, new Promise<AIResponse>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 30000)
      )]))
    );

    const responses: AIResponse[] = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return r.value;
      }
      return { provider: activeProviders[i], content: "", success: false, error: "Timeout or error" };
    });

    const synthesizedContent = synthesizeResponses(responses, lastUserMessage, federatedKnowledge);
    const successfulProviders = responses.filter(r => r.success).map(r => r.provider);
    
    // Include Federated Core in sources if it contributed
    if (federatedKnowledge.available) {
      successfulProviders.push("Federated Core");
    }

    return new Response(
      JSON.stringify({
        content: synthesizedContent,
        sources: successfulProviders,
        providersQueried: activeProviders,
        federatedNode: federatedKnowledge.available ? federatedKnowledge.nodeId : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Research assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
