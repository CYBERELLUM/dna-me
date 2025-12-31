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
    
    if (!supabaseUrl || !supabaseKey) {
      console.log("[Federated Seed] Local Supabase not configured for logging");
      return;
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/federation_sync_history`, {
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
        completed_at: status !== "pending" && status !== "running" ? new Date().toISOString() : null,
      })
    });
    
    if (!response.ok) {
      console.error("[Federated Seed] Failed to log sync:", await response.text());
    } else {
      console.log("[Federated Seed] Logged sync operation:", operation, status);
    }
  } catch (err) {
    console.error("[Federated Seed] Failed to log sync operation:", err);
  }
}


// Culminate H Labs 25-year research findings
const genomicsInsights = [
  {
    category: "dna_damage",
    title: "Agricultural Industrialization DNA Impact",
    finding: "The industrialization of agriculture, initiated around 1913, has negatively impacted human DNA through introduction of synthetic chemicals, processed foods, and environmental toxins.",
    mechanism: "Persistent exposure to agrochemicals and processed food derivatives causes epigenetic modifications and direct DNA damage through oxidative stress pathways.",
    implication: "This damage has led to genetic mutations that cause cellular deterioration, contributing to various health issues, premature aging, and diseases.",
    confidence: 0.92,
    years_studied: 25,
    source: "Culminate H Labs Longitudinal Study"
  },
  {
    category: "dna_repair",
    title: "DNA Damage Repair Science Framework",
    finding: "DNA controls disease and aging processes at the fundamental level. By controlling DNA repair mechanisms, we can influence both disease progression and aging trajectories.",
    mechanism: "Targeted intervention at the genetic level can restore proper cellular function by activating endogenous DNA repair pathways including base excision repair (BER), nucleotide excision repair (NER), and homologous recombination.",
    implication: "A complete method to restore wellness at the core biological level through precision genetic and cellular interventions.",
    confidence: 0.89,
    years_studied: 25,
    source: "Culminate H Labs R&D"
  },
  {
    category: "cellular_aging",
    title: "Cellular Deterioration Cascade",
    finding: "Genetic mutations accumulated from environmental and dietary factors trigger a cascade of cellular deterioration affecting mitochondrial function, telomere maintenance, and protein homeostasis.",
    mechanism: "Damaged DNA leads to impaired transcription, producing dysfunctional proteins that accumulate and impair cellular processes, creating a feedback loop of accelerated aging.",
    implication: "Interrupting this cascade at the DNA level provides upstream intervention before downstream damage becomes irreversible.",
    confidence: 0.87,
    years_studied: 25,
    source: "Culminate H Labs Cellular Biology Division"
  },
  {
    category: "nutrigenomics",
    title: "Diet Evolution and Genetic Adaptation",
    finding: "Human genetic adaptation has not kept pace with rapid dietary changes introduced by agricultural industrialization, creating a mismatch between our genome and modern nutrition.",
    mechanism: "Gene-nutrient interactions optimized for ancestral diets are disrupted by modern processed foods, leading to metabolic dysregulation and increased disease susceptibility.",
    implication: "Precision nutrition guided by individual genetic profiles can restore optimal gene expression and cellular function.",
    confidence: 0.91,
    years_studied: 25,
    source: "Culminate H Labs Nutrigenomics Research"
  },
  {
    category: "longevity_genes",
    title: "Longevity Gene Network Identification",
    finding: "A network of interconnected genes controlling lifespan has been identified, including SIRT1-7, FOXO3, AMPK pathway genes, and novel repair-associated transcription factors.",
    mechanism: "These genes regulate cellular stress response, DNA repair efficiency, metabolic homeostasis, and stem cell maintenance - all critical for healthy aging.",
    implication: "Targeted activation of longevity gene networks through precision interventions can extend healthspan and potentially lifespan.",
    confidence: 0.85,
    years_studied: 25,
    source: "Culminate H Labs Longevity Research"
  },
  {
    category: "epigenetics",
    title: "Epigenetic Clock Reversal",
    finding: "Epigenetic modifications accumulated through environmental exposure can be partially reversed through targeted interventions, effectively reducing biological age markers.",
    mechanism: "DNA methylation patterns established by industrial-age exposures can be reprogrammed using specific compounds and lifestyle interventions that activate demethylation enzymes.",
    implication: "Biological age, distinct from chronological age, is modifiable through precision epigenetic interventions.",
    confidence: 0.83,
    years_studied: 20,
    source: "Culminate H Labs Epigenetics Program"
  }
];

// Security patterns learned from satellite implementations
const securityKnowledge = [
  {
    topic: "ip_rate_limiting",
    title: "IP-Based Rate Limiting Pattern",
    content: `Implement rate limiting at the IP level to prevent brute force attacks. Track login attempts per IP address with a sliding window (recommended: 10 attempts per 15 minutes). Auto-block IPs that exceed thresholds for 1 hour. Store attempts in a dedicated table with indexes on ip_address and created_at for efficient querying.`,
    implementation: `CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);`,
    keywords: ["rate limiting", "IP blocking", "brute force", "security", "authentication"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.95
  },
  {
    topic: "suspicious_login_detection",
    title: "Suspicious Login Detection Algorithm",
    content: `Implement risk scoring for login attempts based on multiple factors: new IP address (+20 points), rapid attempts >3/min (+30 points), missing/suspicious user agent (+15 points), bot-like user agent patterns (+40 points), multiple recent failures (+25 points). Flag logins with risk score ≥50 as suspicious and require additional verification or alert the user.`,
    implementation: `CREATE FUNCTION detect_suspicious_login(p_email TEXT, p_ip_address TEXT, p_user_agent TEXT)
RETURNS TABLE (is_suspicious BOOLEAN, suspicion_reason TEXT, risk_score INT)
-- Check rapid-fire attempts (>3 in last minute): +30 points
-- Check if new IP for this user: +20 points  
-- Check missing/short user agent: +15 points
-- Check bot patterns in user agent: +40 points
-- Check multiple recent failures: +25 points
-- Return suspicious if total >= 50`,
    keywords: ["suspicious activity", "anomaly detection", "login security", "risk scoring", "fraud detection"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.92
  },
  {
    topic: "email_verification_flow",
    title: "Email Verification Security Pattern",
    content: `Require email confirmation before granting access to protect intellectual property and ensure identity verification. Disable auto_confirm_email in Supabase Auth settings. Implement a clear email verification UI flow that explains why verification is required (IP protection, data security). Store verification status and track confirmation timestamps for audit trails.`,
    implementation: `-- Supabase Auth configuration
supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectUrl,
    data: { display_name: displayName }
  }
});
// Show email verification pending screen until confirmed`,
    keywords: ["email verification", "identity verification", "signup security", "IP protection"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.98
  },
  {
    topic: "password_strength_requirements",
    title: "Strong Password Validation Pattern",
    content: `Enforce strong password requirements to protect accounts: minimum 12 characters, at least one uppercase letter, one lowercase letter, one number, and one special character. Use Zod schema validation for consistent enforcement across client and server. Display clear password requirements during signup.`,
    implementation: `const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character");`,
    keywords: ["password strength", "validation", "zod", "security requirements"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.97
  },
  {
    topic: "subscriber_data_isolation",
    title: "RLS-Based Subscriber Data Isolation",
    content: `Implement absolute data isolation between subscribers using Row Level Security (RLS). Every table containing user data must have RLS enabled with policies enforcing auth.uid() = user_id for all operations. Never use service role keys client-side. Audit RLS policies regularly to ensure no cross-subscriber data leakage.`,
    implementation: `ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own data"
ON user_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own data"  
ON user_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own data"
ON user_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own data"
ON user_data FOR DELETE
USING (auth.uid() = user_id);`,
    keywords: ["RLS", "row level security", "data isolation", "multi-tenant", "subscriber firewall"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.99
  },
  {
    topic: "mfa_totp_implementation",
    title: "Multi-Factor Authentication with TOTP",
    content: `Implement optional but encouraged TOTP-based MFA using authenticator apps (Google Authenticator, Authy). Offer MFA setup immediately after signup. Use Supabase Auth MFA APIs: mfa.enroll(), mfa.challengeAndVerify(), mfa.listFactors(). Track MFA enrollment status and prompt users without MFA periodically.`,
    implementation: `// Enroll MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Authenticator App'
});

// Verify MFA code
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId,
  code: userProvidedCode
});`,
    keywords: ["MFA", "TOTP", "two-factor", "authenticator", "security"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.94
  },
  {
    topic: "auto_block_policy",
    title: "Automatic IP Blocking Policy",
    content: `Implement automatic temporary IP blocking when abuse patterns are detected. After 10 failed login attempts from a single IP within 15 minutes, automatically block that IP for 1 hour. Store blocked IPs in a dedicated table with reason, blocked_until timestamp, and permanent flag. Check blocked_ips table before processing any authentication request.`,
    implementation: `CREATE TABLE blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-block after 10 failures
INSERT INTO blocked_ips (ip_address, reason, blocked_until)
VALUES (p_ip, 'Excessive failed attempts', now() + INTERVAL '1 hour')
ON CONFLICT (ip_address) DO UPDATE 
SET blocked_until = EXCLUDED.blocked_until;`,
    keywords: ["IP blocking", "auto-block", "abuse prevention", "security automation"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.93
  },
  {
    topic: "audit_logging_pattern",
    title: "Security Audit Logging Pattern",
    content: `Log all security-relevant events for forensic analysis and compliance. Track: login attempts (success/failure), IP addresses, user agents, timestamps, rate limit triggers, suspicious activity flags. Automatically purge logs older than 30 days to manage storage while maintaining sufficient history for security investigations.`,
    implementation: `CREATE FUNCTION log_login_attempt(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
  INSERT INTO login_attempts (...)
  RETURNING id;
  
  -- Auto-cleanup old logs
  DELETE FROM login_attempts 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;`,
    keywords: ["audit logging", "security events", "forensics", "compliance", "monitoring"],
    category: "security_pattern",
    satellite_origin: "cyberellum_research_platform",
    confidence: 0.96
  }
];

const knowledgeBase = [
  {
    topic: "core_philosophy",
    title: "Culminate H Labs Mission",
    content: "From Ancient Wisdom to Precision Health Innovation. Culminate H Labs integrates insights from ancient civilizations with scientific breakthroughs in genetics and cellular biology to develop complete methods for restoring wellness at the core biological level.",
    keywords: ["precision health", "ancient wisdom", "genetics", "cellular biology", "wellness"],
    category: "organizational"
  },
  {
    topic: "research_methodology",
    title: "Longitudinal Research Approach",
    content: "Over 25 years of longitudinal studies and R&D focusing on diet evolution, genetic adaptation, and the impact of modern agricultural practices on human DNA. This extensive research has yielded critical discoveries about DNA damage and repair mechanisms.",
    keywords: ["longitudinal study", "25 years", "R&D", "diet evolution", "genetic adaptation"],
    category: "methodology"
  },
  {
    topic: "key_discovery_1",
    title: "Agricultural Impact Discovery",
    content: "The industrialization of agriculture, initiated around 1913, has negatively impacted human DNA. This damage has led to genetic mutations that cause cellular deterioration, contributing to various health issues, premature aging, and diseases.",
    keywords: ["agriculture", "1913", "DNA damage", "mutations", "cellular deterioration", "aging"],
    category: "discovery"
  },
  {
    topic: "key_discovery_2",
    title: "DNA Control Principle",
    content: "DNA Damage Repair Science: DNA controls disease and aging - we control DNA. By understanding and manipulating DNA repair mechanisms, we can address the root causes of disease and aging rather than just treating symptoms.",
    keywords: ["DNA repair", "disease control", "aging control", "root cause", "precision medicine"],
    category: "discovery"
  },
  {
    topic: "therapeutic_approach",
    title: "Precision Health Restoration",
    content: "A complete method to restore wellness at the core biological level by studying diet evolution and genetic adaptation. This approach targets the fundamental genetic and cellular mechanisms that drive health and longevity.",
    keywords: ["wellness restoration", "biological level", "genetic mechanisms", "longevity", "precision health"],
    category: "therapeutic"
  },
  {
    topic: "sirtuin_pathway",
    title: "Sirtuin Activation Research",
    content: "SIRT1-7 family of proteins play crucial roles in DNA repair, metabolic regulation, and stress resistance. Targeted activation of sirtuins through NAD+ precursors and specific compounds shows promise for longevity enhancement.",
    keywords: ["sirtuins", "SIRT1", "NAD+", "metabolic regulation", "stress resistance", "longevity"],
    category: "molecular_targets"
  },
  {
    topic: "telomere_maintenance",
    title: "Telomere Biology Insights",
    content: "Telomere shortening accelerated by industrial-age toxin exposure contributes to cellular senescence. Strategies to maintain telomere length through telomerase activation and lifestyle interventions are under investigation.",
    keywords: ["telomeres", "telomerase", "cellular senescence", "aging", "intervention"],
    category: "molecular_targets"
  },
  {
    topic: "mitochondrial_health",
    title: "Mitochondrial Function Restoration",
    content: "Mitochondrial dysfunction is a hallmark of aging accelerated by DNA damage. Restoring mitochondrial biogenesis and function through targeted interventions can reverse aspects of cellular aging.",
    keywords: ["mitochondria", "biogenesis", "cellular aging", "energy metabolism", "restoration"],
    category: "molecular_targets"
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = "seed" } = await req.json();

    console.log("[Federated Seed] Starting seed operation");

    const federatedUrl = Deno.env.get("FEDERATED_SUPABASE_URL");
    const federatedKey = Deno.env.get("FEDERATED_SUPABASE_ANON_KEY");
    const syncKey = Deno.env.get("FEDERATED_SYNC_KEY");

    if (!federatedUrl || !federatedKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Federated Core not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nodeId = federatedUrl.replace(/https?:\/\//, "").split(".")[0];
    console.log("[Federated Seed] Connected to node:", nodeId);

    const federatedClient = createClient(federatedUrl, federatedKey, {
      global: { headers: { "X-Sync-Key": syncKey || "" } }
    });

    const results = {
      genomics_insights: { inserted: 0, errors: [] as string[] },
      knowledge_base: { inserted: 0, errors: [] as string[] },
      security_knowledge: { inserted: 0, errors: [] as string[] }
    };

    // Seed genomics_insights
    console.log("[Federated Seed] Seeding genomics_insights with", genomicsInsights.length, "records");
    for (const insight of genomicsInsights) {
      const { error } = await federatedClient.from("genomics_insights").insert({
        ...insight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.log("[Federated Seed] Error inserting insight:", error.message);
        results.genomics_insights.errors.push(error.message);
      } else {
        results.genomics_insights.inserted++;
      }
    }

    // Seed knowledge_base (including general and security knowledge)
    const allKnowledge = [...knowledgeBase, ...securityKnowledge];
    console.log("[Federated Seed] Seeding knowledge_base with", allKnowledge.length, "records (including", securityKnowledge.length, "security patterns)");
    
    for (const knowledge of allKnowledge) {
      const { error } = await federatedClient.from("knowledge_base").insert({
        ...knowledge,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.log("[Federated Seed] Error inserting knowledge:", error.message);
        if (knowledge.category === "security_pattern") {
          results.security_knowledge.errors.push(error.message);
        } else {
          results.knowledge_base.errors.push(error.message);
        }
      } else {
        if (knowledge.category === "security_pattern") {
          results.security_knowledge.inserted++;
        } else {
          results.knowledge_base.inserted++;
        }
      }
    }

    const totalInserted = results.genomics_insights.inserted + results.knowledge_base.inserted + results.security_knowledge.inserted;
    const totalErrors = results.genomics_insights.errors.length + results.knowledge_base.errors.length + results.security_knowledge.errors.length;

    console.log("[Federated Seed] Complete. Inserted:", totalInserted, "Errors:", totalErrors);
    console.log("[Federated Seed] Security patterns shared:", results.security_knowledge.inserted);

    // Log the sync operation
    await logSyncOperation(
      "seed",
      nodeId,
      totalInserted > 0 ? "completed" : "failed",
      totalInserted,
      totalErrors,
      { 
        genomics: results.genomics_insights.inserted,
        knowledge: results.knowledge_base.inserted,
        security: results.security_knowledge.inserted
      },
      totalErrors > 0 ? `${totalErrors} records failed to sync` : null
    );

    return new Response(
      JSON.stringify({
        success: totalInserted > 0,
        node: nodeId,
        results,
        summary: {
          totalInserted,
          totalErrors,
          securityPatternsShared: results.security_knowledge.inserted,
          message: totalInserted > 0 
            ? `Successfully seeded ${totalInserted} records to Federated Core (${results.security_knowledge.inserted} security patterns from satellite)`
            : "No records inserted - tables may need to be created first"
        },
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Federated Seed] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Seed operation failed";

    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
