// Issues an API key for a partner contract and persists it.
// Returns the plaintext key ONCE; only the hash is stored.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require admin
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
    const { data: isAdmin } = await userClient.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contract, documents } = await req.json() as {
      contract: {
        organization_name: string;
        partner_type: string;
        summary: string;
        capabilities: string[];
        integration_pattern: string;
        next_step_message?: string;
      };
      documents?: { filename: string; storage_path: string; mime_type?: string; size_bytes?: number; summary?: string }[];
    };

    if (!contract?.organization_name) {
      return new Response(JSON.stringify({ error: "contract.organization_name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Generate api key: cyb_<32 hex>
    const raw = crypto.getRandomValues(new Uint8Array(24));
    const keyBody = Array.from(raw).map(b => b.toString(16).padStart(2, "0")).join("");
    const plainKey = `cyb_${keyBody}`;
    const keyHash = await sha256(plainKey);
    const keyPrefix = plainKey.slice(0, 12);

    const { data: partner, error: insErr } = await supabase
      .from("partners")
      .insert({
        organization_name: contract.organization_name,
        partner_type: contract.partner_type,
        status: "active",
        api_key_hash: keyHash,
        api_key_prefix: keyPrefix,
        intake_summary: contract.summary,
        capabilities: contract.capabilities,
        contract_payload: contract,
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    if (documents && documents.length) {
      const rows = documents.map(d => ({
        partner_id: partner.id,
        filename: d.filename,
        storage_path: d.storage_path,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        summary: d.summary,
      }));
      const { error: docErr } = await supabase.from("partner_documents").insert(rows);
      if (docErr) console.warn("partner_documents insert warning", docErr);
    }

    return new Response(JSON.stringify({
      partner_id: partner.id,
      api_key: plainKey,
      api_key_prefix: keyPrefix,
      message: contract.next_step_message ?? "Welcome to the Cyberellum collaboration network.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("partner-issue-key error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
