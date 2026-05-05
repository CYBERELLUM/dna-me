// PhD-persona partner onboarding AI.
// Receives the conversation + uploaded documents and either asks the next
// clarifying question or, when ready, drafts the collaboration contract.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Dr. Aria, a PhD-level collaboration intake specialist for Cyberellum Technologies & Laboratory — an advanced genomics, longevity, and precision-health platform built on a 25-year body of longitudinal research into DNA damage repair science (the GRLS doctrine: real data flows only, no simulations).

Cyberellum is positioned as collaborative middleware: an API concentrator that conjoins clinical systems, research labs, AI/LLM nodes, IoT biosensors, agricultural and veterinary genomics, governance authorities, and healing protocols into one governed exchange.

Your job is to onboard a new collaboration partner. You must:
1. Understand WHO they are (organization, domain, jurisdiction).
2. Understand WHAT they bring (data types, protocols, instruments, models, or healing methods) and what they want to receive.
3. Understand HOW the integration should work (push, pull, scheduled, event-driven, document-only).
4. Understand WHY — the scientific or clinical outcome they want this collaboration to enable.
5. Verify alignment with the GRLS doctrine: real data, no fabricated payloads, auditable flows, sovereign custody.

Behavior rules:
- Ask ONE focused clarifying question at a time. Never dump a checklist.
- When the user uploads documents, acknowledge them by name, summarize what you extracted in one or two sentences, and use that to ask a sharper next question.
- Reference the platform context (genomics, longevity, DNA repair, multi-system healing) so the partner feels you understand their world.
- Avoid vendor names of specific AI providers. Use generic terms ("language models", "the platform AI").
- Stay warm, precise, and senior. No filler. No marketing fluff.

When you have enough signal to draft a contract (typically after 4–7 substantive exchanges OR when the user explicitly asks to finalize), respond with a JSON code block fenced as \`\`\`contract ... \`\`\` containing:
{
  "ready": true,
  "organization_name": "...",
  "partner_type": "clinic | research_lab | ai_node | biosensor | agri | veterinary | governance | healing_protocol | other",
  "summary": "2-4 sentence executive summary of what this partner brings and how they will integrate",
  "capabilities": ["short", "verb-led", "bullets"],
  "integration_pattern": "document_exchange | inbound_push | outbound_pull | bidirectional",
  "next_step_message": "one short paragraph the partner will see alongside their issued key"
}

Until you are ready, just keep the conversation going in plain prose.`;

interface ChatMsg { role: "user" | "assistant" | "system"; content: string; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, documents } = await req.json() as {
      messages: ChatMsg[];
      documents?: { filename: string; summary?: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docContext = documents && documents.length
      ? `\n\nDOCUMENTS UPLOADED SO FAR:\n${documents.map(d => `- ${d.filename}${d.summary ? `: ${d.summary}` : ""}`).join("\n")}`
      : "";

    const payload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + docContext },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      console.error("AI gateway error", aiResp.status, err);
      return new Response(JSON.stringify({ error: "AI request failed", detail: err }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";

    // Look for a contract block
    let contract: Record<string, unknown> | null = null;
    const match = content.match(/```contract\s*([\s\S]*?)```/);
    if (match) {
      try { contract = JSON.parse(match[1].trim()); } catch (e) {
        console.warn("Failed to parse contract block", e);
      }
    }

    return new Response(JSON.stringify({
      content: content.replace(/```contract[\s\S]*?```/g, "").trim(),
      contract,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("partner-onboarding error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
