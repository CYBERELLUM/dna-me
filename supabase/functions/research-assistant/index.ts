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
  const persona = `# PERSONA — Dr. Aurelia Vance, PhD
You are Dr. Aurelia Vance, a tenured professor of Genomics & Molecular Medicine with 25+ years of bench and translational research across DNA damage repair, longevity biology, CRISPR/Cas systems, epigenetics, and nutrigenomics. You hold joint appointments in Computational Biology and Precision Health. You have led NIH/NSF-funded laboratories, mentored graduate students, peer-reviewed for Nature, Cell, NEJM, and Genome Research, and consult for clinical genomics consortia.

You are NOT a generic chatbot. You ARE a senior scientist running an active laboratory and collaboration consortium. You think and speak the way a principal investigator does.

# VOICE & STYLE
- Precise, measured, scientifically rigorous. No filler, no hype, no marketing tone.
- Always reason from first principles (mechanism → evidence → confidence → application).
- Cite primary literature where relevant (author, year, journal). If you cannot verify a citation, say "I'd want to verify against PubMed/NCBI before committing to that reference" — never fabricate.
- Quantify when possible (effect sizes, p-values, sample sizes, confidence intervals). Acknowledge uncertainty explicitly.
- Use proper nomenclature (HGNC gene symbols italicized in prose, protein names roman, RSIDs, NCBI accessions).
- Format with markdown: clear H2/H3 sections, bullet lists, tables for comparisons, fenced code blocks for sequences/commands/JSON.

# SCIENTIFIC GUARDRAILS (GRLS doctrine — non-negotiable)
1. Real data flows only. Never fabricate experimental results, citations, sequences, p-values, or patient data.
2. If asked something outside your competence or beyond current evidence, say so plainly and propose how it could be investigated.
3. Distinguish: established consensus | emerging evidence | speculative hypothesis | personal opinion.
4. Clinical advice: you are a researcher, not a treating physician. For individual clinical decisions, defer to qualified clinicians and IRB/ethics frameworks.
5. Dual-use / biosafety: refuse to help design pathogen enhancement, gain-of-function in select agents, or human germline edits intended for reproductive use. Discuss the science academically, but not the operational uplift.

# COLLABORATION CONTEXT
You operate inside the Cyberellum Genomics Oracle & Collaboration Lab — an API-concentrator middleware that federates clinical, lab, IoT, agricultural, veterinary, and governance nodes. When a user uploads documents, treat them as primary sources you've been handed by a collaborator: read carefully, extract claims, cross-check against your knowledge, and respond as a PI reviewing a colleague's data.`;

  const federatedInstruction = federatedContext
    ? `\n\n# FEDERATED KNOWLEDGE
You have live access to federated research nodes (Culminate H Labs, 25-year longitudinal DNA-repair / longevity dataset). When the federated context below is relevant, weave it into your reasoning explicitly and cite "Federated Core" as the source. If it conflicts with public literature, surface the conflict — do not silently average them.`
    : "";

  const modePrompts: Record<ResearchMode, string> = {
    general: `${persona}${federatedInstruction}

# MODE: General Research Synthesis
Provide a structured PI-level synthesis: (1) restate the question precisely, (2) state mechanism / biological context, (3) summarize current evidence with citations, (4) note open questions and limitations, (5) suggest a concrete next experiment or analysis.`,

    literature: `${persona}${federatedInstruction}

# MODE: Literature Review
Conduct a senior-author literature review: identify seminal papers, map the evolution of the field, contrast competing models, flag controversies, and recommend a focused reading list (5–10 papers) with one-line annotations of why each matters.`,

    methodology: `${persona}${federatedInstruction}

# MODE: Methodology Design
Design rigorous, reproducible protocols. Specify reagents, equipment, positive/negative controls, sample sizes with power justification, statistical tests, expected pitfalls, and validation orthogonals. Use numbered steps and code blocks for any commands or scripts.`,

    dataAnalysis: `${persona}${federatedInstruction}

# MODE: Data Analysis & Interpretation
Reason as a computational biologist: choose appropriate statistical frameworks, recommend pipelines (with versions where it matters), discuss multiple-testing correction, batch effects, and confounders, suggest visualizations, and interpret results with calibrated confidence.`,

    crisprDesign: `${persona}${federatedInstruction}

# MODE: CRISPR / Genome Editing
Apply current best practices: gRNA design rules, PAM selection, on/off-target scoring (CFD, MIT, CRISPOR), delivery modality trade-offs (RNP vs LNP vs AAV vs lentivirus), base/prime editing alternatives where appropriate, validation by amplicon sequencing / ddPCR, and biosafety considerations.`,
  };

  return modePrompts[mode] || modePrompts.general;
}

interface AIResponse {
  provider: string;
  content: string;
  success: boolean;
  error?: string;
}

interface WebSearchResult {
  available: boolean;
  content: string;
  citations: string[];
  error?: string;
}

// Live web search via Perplexity sonar-pro for recent citations,
// medical journals, preprints, and news beyond the model's training cutoff.
interface ResearchFilters {
  dateFrom?: string;
  dateTo?: string;
  recency?: "any" | "day" | "week" | "month" | "year";
  journals?: string[];
  studyType?: string;
  species?: string;
  technique?: string;
}

function buildFilterDirective(f?: ResearchFilters | null): string {
  if (!f) return "";
  const parts: string[] = [];
  if (f.studyType && f.studyType !== "Any") parts.push(`Study type: ${f.studyType}`);
  if (f.species && f.species !== "Any") parts.push(`Species / model: ${f.species}`);
  if (f.technique && f.technique !== "Any") parts.push(`Technique / assay: ${f.technique}`);
  if (f.journals && f.journals.length) parts.push(`Restrict sources to these venues: ${f.journals.join(", ")}`);
  if (f.dateFrom) parts.push(`Published on or after ${f.dateFrom}`);
  if (f.dateTo) parts.push(`Published on or before ${f.dateTo}`);
  if (!parts.length) return "";
  return `\n\n[USER FILTERS — only return sources that satisfy ALL of these constraints]\n- ${parts.join("\n- ")}\nIf no qualifying sources exist, say so explicitly rather than returning unrelated material.`;
}

function toMMDDYYYY(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

async function queryWebSearch(query: string, filters?: ResearchFilters | null): Promise<WebSearchResult> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    return { available: false, content: "", citations: [], error: "PERPLEXITY_API_KEY not configured" };
  }

  const filterDirective = buildFilterDirective(filters);
  const recency = filters?.recency && filters.recency !== "any" ? filters.recency : "year";

  const body: any = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          "You are a biomedical literature retrieval agent. For the user's query, surface the most recent, highest-quality primary sources: peer-reviewed journals (Nature, Cell, NEJM, Lancet, Genome Research, Bioinformatics), reputable preprints (bioRxiv, medRxiv), authoritative databases (PubMed, NCBI, ClinVar, gnomAD, Ensembl, UniProt, WHO, CDC, NIH). Return a tight synthesis (≤300 words) of what the recent literature actually says, then a numbered list of the 5–8 most relevant sources with title, venue, year, and URL. If the topic requires access to a paywalled database or specialized API (e.g., UK Biobank, dbGaP, Clarivate, Cochrane), explicitly recommend the user obtain credentials or add that API.",
      },
      { role: "user", content: `${query}${filterDirective}` },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    search_recency_filter: recency,
    return_citations: true,
  };

  if (filters?.journals && filters.journals.length) {
    body.search_domain_filter = filters.journals.slice(0, 10);
  }
  const after = toMMDDYYYY(filters?.dateFrom);
  const before = toMMDDYYYY(filters?.dateTo);
  if (after) body.search_after_date_filter = after;
  if (before) body.search_before_date_filter = before;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });


    if (!response.ok) {
      const error = await response.text();
      console.error("[WebSearch] Perplexity error:", error);
      return { available: false, content: "", citations: [], error };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations: string[] = data.citations || data.search_results?.map((r: any) => r.url) || [];
    console.log("[WebSearch] Retrieved", citations.length, "citations");
    return { available: !!content, content, citations };
  } catch (error) {
    console.error("[WebSearch] Exception:", error);
    return { available: false, content: "", citations: [], error: String(error) };
  }
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

async function queryPrimaryGateway(messages: any[], apiKey: string, systemPrompt: string): Promise<AIResponse> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Upgraded from gemini-2.5-flash → gemini-2.5-pro for deeper scientific reasoning,
        // longer context, and higher fidelity on multi-step genomics queries.
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Primary AI error:", error);
      return { provider: "Primary", content: "", success: false, error };
    }

    const data = await response.json();
    return {
      provider: "Primary",
      content: data.choices?.[0]?.message?.content || "",
      success: true,
    };
  } catch (error) {
    console.error("Primary AI exception:", error);
    return { provider: "Primary", content: "", success: false, error: String(error) };
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

  // Multiple responses - create a synthesis without exposing provider names
  const synthesis = `## Research Synthesis

Based on multi-source AI analysis${federated.available ? ` with Federated Core knowledge` : ""}:

${successfulResponses.map((r, i) => {
  const summary = r.content.length > 800 ? r.content.slice(0, 800) + "..." : r.content;
  return `### Analysis ${i + 1}:\n${summary}`;
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
    const { messages, mode, filters } = await req.json();
    const researchMode: ResearchMode = mode || "general";

    const MULTI_AI_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MULTI_AI_KEY) {
      throw new Error("AI Gateway key is not configured");
    }

    // Require a valid authenticated user — block unauthenticated AI gateway usage
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ") && SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data } = await authClient.auth.getClaims(token);
        if (data?.claims?.sub) userId = data.claims.sub as string;
      } catch (e) {
        console.warn("[Research] Could not verify JWT:", e);
      }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[Research] Processing query with messages:", messages.length, "mode:", researchMode);

    // AUTONOMOUS: Query Federated Core + live Web Search in parallel
    console.log("[Research] Querying Federated Core + live web search...");
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const [federatedKnowledge, webSearch] = await Promise.all([
      queryFederatedCore(),
      queryWebSearch(lastUserMessage, filters),
    ]);

    // Build context from federated knowledge
    const federatedContext = buildFederatedContext(federatedKnowledge, lastUserMessage);

    // Build live web-search context block (recent citations)
    let webContext = "";
    if (webSearch.available) {
      webContext = `\n\n---\n**[LIVE WEB SEARCH — recent literature & sources]**\n\n${webSearch.content}`;
      if (webSearch.citations.length > 0) {
        webContext += `\n\n**Citations:**\n${webSearch.citations.map((u, i) => `${i + 1}. ${u}`).join("\n")}`;
      }
    }

    // Enhance system prompt with federated knowledge context
    const systemPrompt = getSystemPrompt(researchMode, federatedContext) +
      (webSearch.available
        ? `\n\n# LIVE WEB CITATIONS\nYou have been provided with a real-time web-search briefing of recent peer-reviewed sources, preprints, and authoritative databases (see context block). USE these as primary citations when they are relevant. If the literature is thin or behind paywalls, explicitly recommend that the user add an API key (e.g., PubMed/NCBI E-utilities, Semantic Scholar, Crossref, UK Biobank, ClinicalTrials.gov) or join a specific consortium/database to obtain the missing data. Never fabricate URLs — only cite the ones provided or known canonical resources.`
        : "")
;

    // Inject federated + web context into the last user message
    const combinedContext = `${federatedContext}${webContext}`;
    const enhancedMessages = combinedContext
      ? [
          ...messages.slice(0, -1),
          {
            role: "user",
            content: `${lastUserMessage}\n\n[Research context:${combinedContext}]`,
          },
        ]
      : messages;

    // Get user's configured API keys (decrypted from Vault via SECURITY DEFINER RPC)
    let openaiKey: string | null = null;
    let geminiKey: string | null = null;

    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const [openaiRes, geminiRes] = await Promise.all([
          supabase.rpc("get_user_api_key", { _user_id: userId, _provider: "openai" }),
          supabase.rpc("get_user_api_key", { _user_id: userId, _provider: "gemini" }),
        ]);
        openaiKey = (openaiRes.data as string | null) ?? null;
        geminiKey = (geminiRes.data as string | null) ?? null;
      } catch (e) {
        console.error("Error fetching user API keys from vault:", e);
      }
    }

    const queries: Promise<AIResponse>[] = [];
    const activeProviders: string[] = [];

    queries.push(queryPrimaryGateway(enhancedMessages, MULTI_AI_KEY, systemPrompt));
    activeProviders.push("Primary");

    if (openaiKey) {
      queries.push(queryOpenAI(enhancedMessages, openaiKey, systemPrompt));
      activeProviders.push("OpenAI");
    }

    if (geminiKey) {
      queries.push(queryGemini(enhancedMessages, geminiKey, systemPrompt));
      activeProviders.push("Gemini");
    }

    if (federatedKnowledge.available) {
      activeProviders.push(`Federated Core (${federatedKnowledge.nodeId})`);
    }
    if (webSearch.available) {
      activeProviders.push("Live Web Search");
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

    let synthesizedContent = synthesizeResponses(responses, lastUserMessage, federatedKnowledge);

    // Append live web citations as a dedicated, visible section
    if (webSearch.available && webSearch.citations.length > 0) {
      synthesizedContent += `\n\n---\n### 🌐 Live Web Citations (recent sources)\n${webSearch.citations
        .slice(0, 8)
        .map((u, i) => `${i + 1}. ${u}`)
        .join("\n")}`;
    }

    const sourceCount = responses.filter(r => r.success).length;
    const sources = [`${sourceCount} AI sources`];
    if (federatedKnowledge.available) sources.push("Federated Core");
    if (webSearch.available) sources.push("Live Web Search");

    return new Response(
      JSON.stringify({
        content: synthesizedContent,
        sources,
        providersQueried: sourceCount,
        federatedNode: federatedKnowledge.available ? "connected" : null,
        webSearch: webSearch.available
          ? { citationCount: webSearch.citations.length, citations: webSearch.citations }
          : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Research assistant error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
