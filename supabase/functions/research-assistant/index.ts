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

function getSystemPrompt(mode: ResearchMode): string {
  const base = `You are a highly specialized Research Assistant for genomics scientists, physicists, and experts in genomic engineering.`;

  const modePrompts: Record<ResearchMode, string> = {
    general: `${base}

Provide comprehensive research synthesis across genomics topics. Be precise and scientifically accurate, cite methodologies, and acknowledge limitations. Format your responses with markdown headings, bullet points, and code blocks where appropriate.`,

    literature: `${base}

Focus on literature review: summarize key papers, identify research trends, highlight consensus vs. controversy, and suggest seminal readings. Structure responses with paper references when possible. Use markdown formatting.`,

    methodology: `${base}

Focus on experimental methodology: provide detailed protocols, equipment recommendations, controls to include, common pitfalls, and troubleshooting tips. Be step-by-step and practical. Use markdown lists and code blocks for commands.`,

    dataAnalysis: `${base}

Focus on data analysis and interpretation: explain statistical approaches, recommend software/pipelines, help interpret results, discuss significance thresholds, and suggest visualization strategies. Use markdown for clarity.`,

    crisprDesign: `${base}

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
    // Convert messages to Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Add system instruction as first user message
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
          generationConfig: {
            maxOutputTokens: 1500,
          },
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
      console.error("Multi-AI Gateway error:", error);
      return { provider: "Multi-AI Gateway", content: "", success: false, error };
    }

    const data = await response.json();
    return {
      provider: "Multi-AI Gateway",
      content: data.choices?.[0]?.message?.content || "",
      success: true,
    };
  } catch (error) {
    console.error("Multi-AI Gateway exception:", error);
    return { provider: "Multi-AI Gateway", content: "", success: false, error: String(error) };
  }
}

function synthesizeResponses(responses: AIResponse[], query: string): string {
  const successfulResponses = responses.filter(r => r.success && r.content);
  
  if (successfulResponses.length === 0) {
    return "I apologize, but I was unable to process your query at this time. Please try again later.";
  }

  if (successfulResponses.length === 1) {
    return successfulResponses[0].content;
  }

  // Multiple responses - create a synthesis
  const synthesis = `## Multi-AI Research Synthesis

Based on analysis from ${successfulResponses.map(r => r.provider).join(", ")}:

${successfulResponses.map((r, i) => {
  // Extract key points from each response (first ~500 chars for summary)
  const summary = r.content.length > 800 ? r.content.slice(0, 800) + "..." : r.content;
  return `### ${r.provider} Analysis:\n${summary}`;
}).join("\n\n")}

---
*Synthesized from ${successfulResponses.length} AI sources for comprehensive research coverage.*`;

  return synthesis;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, mode } = await req.json();
    const researchMode: ResearchMode = mode || "general";
    const systemPrompt = getSystemPrompt(researchMode);

    const MULTI_AI_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MULTI_AI_KEY) {
      throw new Error("Multi-AI Gateway key is not configured");
    }

    console.log("Processing research query with messages:", messages.length, "mode:", researchMode);

    // Try to get user's configured API keys if userId provided
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

    // Collect enabled providers
    const openaiConfig = userApiKeys.find(k => k.provider === "openai");
    const geminiConfig = userApiKeys.find(k => k.provider === "gemini");
    
    // Query all available providers in parallel
    const queries: Promise<AIResponse>[] = [];
    const activeProviders: string[] = [];

    // Always include Multi-AI Gateway as the primary provider
    queries.push(queryMultiAIGateway(messages, MULTI_AI_KEY, systemPrompt));
    activeProviders.push("Multi-AI Gateway");

    // Add user-configured providers
    if (openaiConfig?.api_key_encrypted) {
      queries.push(queryOpenAI(messages, openaiConfig.api_key_encrypted, systemPrompt));
      activeProviders.push("OpenAI");
    }

    if (geminiConfig?.api_key_encrypted) {
      queries.push(queryGemini(messages, geminiConfig.api_key_encrypted, systemPrompt));
      activeProviders.push("Gemini");
    }

    console.log("Querying providers:", activeProviders);

    // Wait for all queries with a timeout
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

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const synthesizedContent = synthesizeResponses(responses, lastUserMessage);
    const successfulProviders = responses.filter(r => r.success).map(r => r.provider);

    // Return as a non-streaming response with metadata
    return new Response(
      JSON.stringify({
        content: synthesizedContent,
        sources: successfulProviders,
        providersQueried: activeProviders,
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
