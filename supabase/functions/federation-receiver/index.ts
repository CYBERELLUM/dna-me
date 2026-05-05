import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════
// CYBERELLUM RESEARCH PLATFORM — Federation Satellite
const MY_NODE_ID = 'cyberellum-research';
const MY_NODE_NAME = 'Cyberellum Research Platform';
const MY_TIER = 2;
const MY_PROJECT_ID = 'wymznknyhbsiqycrsduj';
// ═══════════════════════════════════════════════════

const HUB_PROJECT_ID = 'thbytgrwucglehsnxbzn';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-federation-key, x-source-node, x-node-id, x-tier, x-signature, x-signature-algorithm, x-timestamp, x-nonce, x-data-classification',
};

const ALLOWED_CLASSIFICATIONS = ['public', 'shared', 'restricted'];
const PUBLIC_ACTIONS = ['ping', 'heartbeat', 'get_capabilities', 'health_check'];

const FABRICATION_INDICATORS = [
  { pattern: /@cloudflare\/workers-types/, description: 'Cloudflare in Deno context' },
  { pattern: /import\.meta\.env\.VITE_/, description: 'Vite env in edge function' },
  { pattern: /from ['"]next\//, description: 'Next.js in Supabase' },
  { pattern: /supabase\.(?:quantum|pqc|federation)\./, description: 'Fabricated namespace' },
];

function validateFederationKey(req: Request): boolean {
  const incomingKey = req.headers.get('x-federation-key');
  const expectedKey = Deno.env.get('FEDERATION_KEY');
  if (!expectedKey) {
    console.error('[Federation] FEDERATION_KEY not configured — rejecting non-public request');
    return false;
  }
  return incomingKey === expectedKey;
}

function validateContent(content: string) {
  const fabrications: { pattern: string; description: string }[] = [];
  for (const ind of FABRICATION_INDICATORS) {
    if (ind.pattern.test(content)) {
      fabrications.push({ pattern: ind.pattern.toString(), description: ind.description });
    }
  }
  return {
    valid: fabrications.length === 0,
    fabrication_detected: fabrications,
    confidence: Math.max(0, 1 - fabrications.length * 0.4),
    recommendation: fabrications.length > 0 ? 'reject' as const : 'accept' as const,
  };
}

async function logAudit(
  supabase: ReturnType<typeof createClient>,
  sourceNode: string,
  action: string,
  validation: ReturnType<typeof validateContent>,
  status: number,
  error?: string
) {
  try {
    await supabase.from('federation_audit_log').insert({
      source_node: sourceNode,
      action,
      validation_passed: validation.valid,
      fabrication_detected: validation.fabrication_detected.length > 0,
      fabrication_patterns: validation.fabrication_detected,
      confidence_score: validation.confidence,
      recommendation: validation.recommendation,
      response_status: status,
      error_message: error || null,
      metadata: { tier: MY_TIER },
    });
  } catch (err) {
    console.error('[Audit] Failed:', err);
  }
}

const NODE_CAPABILITIES = {
  node_id: MY_NODE_ID,
  node_name: MY_NODE_NAME,
  node_type: 'satellite',
  tier: MY_TIER,
  project_id: MY_PROJECT_ID,
  axiom_version: '2.5',
  federation_version: '2.0',
  capabilities: [
    'federation_sync', 'grls_hydration', 'doctrine_receive',
    'knowledge_receive', 'ipc_relay', 'audit_logging',
  ],
  allowed_classifications: ALLOWED_CLASSIFICATIONS,
  hub_connection: {
    hub_id: 'quantum-concierge',
    hub_project: HUB_PROJECT_ID,
    protocol: 'federation-ipc',
  },
};

serve(async (req) => {
  const startTime = Date.now();
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const sourceNode = req.headers.get('x-source-node') || req.headers.get('x-node-id') || 'unknown';
    const body = await req.json();
    const actionType = body.action || body.event_type || 'unknown';

    console.log(`[Federation] ${actionType} from ${sourceNode}`);

    const validation = validateContent(JSON.stringify(body));

    if (validation.recommendation === 'reject') {
      await logAudit(supabase, sourceNode, actionType, validation, 400, 'Fabrication detected');
      return new Response(JSON.stringify({
        success: false, axiom_violation: true,
        reason: 'Content rejected due to fabrication indicators',
        node_id: MY_NODE_ID,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!PUBLIC_ACTIONS.includes(actionType) && !validateFederationKey(req)) {
      await logAudit(supabase, sourceNode, actionType, validation, 401, 'Invalid federation key');
      return new Response(JSON.stringify({
        success: false, error: 'Invalid or missing federation key', node_id: MY_NODE_ID,
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { payload } = body;

    switch (actionType) {
      case 'ping':
      case 'health_check': {
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, node_id: MY_NODE_ID, node_name: MY_NODE_NAME,
          tier: MY_TIER, status: 'online', axiom_enforced: true,
          timestamp: new Date().toISOString(), latency_ms: Date.now() - startTime,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'heartbeat': {
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, node_id: MY_NODE_ID, tier: MY_TIER, status: 'active',
          capabilities: NODE_CAPABILITIES.capabilities,
          timestamp: new Date().toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_capabilities': {
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, ...NODE_CAPABILITIES, timestamp: new Date().toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'doctrine_sync': {
        if (payload?.doctrine || payload?.content) {
          await supabase.from('federation_doctrines').upsert({
            source_node: sourceNode,
            doctrine_type: payload.doctrine_type || payload.type || 'lazarus',
            content: payload.doctrine || payload.content || payload,
            version: payload.version || '2.5',
            title: payload.title || 'Lazarus Protocol',
            status: 'active',
            received_at: new Date().toISOString(),
          }, { onConflict: 'source_node,doctrine_type' });
        }
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, action: 'doctrine_sync', message: 'Doctrine synchronized',
          node_id: MY_NODE_ID, axiom_verified: validation.valid,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'knowledge_sync': {
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, action: 'knowledge_sync', message: 'Knowledge received',
          node_id: MY_NODE_ID,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'grls_hydrate': {
        await supabase.from('governance_hydration_log').insert({
          node_id: MY_NODE_ID,
          phase: payload?.phase || 0,
          phase_name: payload?.phase_name || 'init',
          status: 'processing',
          metadata: { source: sourceNode, payload_keys: Object.keys(payload || {}) },
        });
        if (payload?.memories && Array.isArray(payload.memories)) {
          for (const mem of payload.memories) {
            await supabase.from('grls_memory').upsert({
              memory_key: mem.memory_key,
              memory_type: mem.memory_type || 'hydrated',
              memory_value: mem.memory_value,
              domain: mem.domain || 'federation',
              signal_strength: mem.signal_strength || 5,
              is_active: true,
            }, { onConflict: 'memory_key' });
          }
        }
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, action: 'grls_hydrate', message: 'Hydration acknowledged',
          node_id: MY_NODE_ID, hydration_status: 'processing',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'code_push': {
        await logAudit(supabase, sourceNode, actionType, validation, 200);
        return new Response(JSON.stringify({
          success: true, action: 'code_push', message: 'Code push received',
          node_id: MY_NODE_ID, files_received: payload?.files?.length || 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default: {
        await logAudit(supabase, sourceNode, actionType, validation, 400, `Unknown action: ${actionType}`);
        return new Response(JSON.stringify({
          success: false, error: `Unknown action: ${actionType}`, node_id: MY_NODE_ID,
          supported_actions: [
            'ping', 'heartbeat', 'get_capabilities', 'health_check',
            'doctrine_sync', 'knowledge_sync', 'grls_hydrate', 'code_push',
          ],
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
  } catch (error: unknown) {
    console.error('[Federation] Error:', error);
    return new Response(JSON.stringify({
      success: false, error: 'Internal server error',
      node_id: MY_NODE_ID,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
