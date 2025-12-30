import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitRequest {
  action: "check" | "log";
  email: string;
  userAgent?: string;
  success?: boolean;
  failureReason?: string;
}

interface RateLimitResponse {
  allowed: boolean;
  blocked?: boolean;
  blockReason?: string;
  attemptsRemaining?: number;
  cooldownSeconds?: number;
  suspicious?: boolean;
  suspicionReason?: string;
  riskScore?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get client IP from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const clientIp = cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
    
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { action, email, success, failureReason }: RateLimitRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    if (action === "check") {
      // Check rate limit
      const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
        .rpc("check_login_rate_limit", {
          p_email: normalizedEmail,
          p_ip_address: clientIp,
        });

      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
        // Fail open - allow the attempt but log the error
        return new Response(
          JSON.stringify({ allowed: true, error: "Rate limit check failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rateLimit = rateLimitData?.[0];
      
      if (rateLimit?.is_blocked) {
        console.log(`Blocked login attempt: email=${normalizedEmail}, ip=${clientIp}, reason=${rateLimit.block_reason}`);
        
        return new Response(
          JSON.stringify({
            allowed: false,
            blocked: true,
            blockReason: rateLimit.block_reason,
            cooldownSeconds: rateLimit.cooldown_seconds,
          } as RateLimitResponse),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for suspicious activity
      const { data: suspicionData, error: suspicionError } = await supabaseAdmin
        .rpc("detect_suspicious_login", {
          p_email: normalizedEmail,
          p_ip_address: clientIp,
          p_user_agent: userAgent,
        });

      if (suspicionError) {
        console.error("Suspicion detection error:", suspicionError);
      }

      const suspicion = suspicionData?.[0];
      
      const response: RateLimitResponse = {
        allowed: true,
        attemptsRemaining: rateLimit?.attempts_remaining,
        suspicious: suspicion?.is_suspicious || false,
        suspicionReason: suspicion?.suspicion_reason,
        riskScore: suspicion?.risk_score || 0,
      };

      // Log suspicious attempts with high risk
      if (suspicion?.risk_score >= 50) {
        console.warn(`Suspicious login attempt: email=${normalizedEmail}, ip=${clientIp}, risk=${suspicion.risk_score}, reasons=${suspicion.suspicion_reason}`);
      }

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "log") {
      // Log the login attempt
      const { data: logId, error: logError } = await supabaseAdmin
        .rpc("log_login_attempt", {
          p_email: normalizedEmail,
          p_ip_address: clientIp,
          p_user_agent: userAgent,
          p_success: success || false,
          p_failure_reason: failureReason || null,
        });

      if (logError) {
        console.error("Failed to log login attempt:", logError);
      } else {
        console.log(`Login attempt logged: email=${normalizedEmail}, ip=${clientIp}, success=${success}, id=${logId}`);
      }

      return new Response(
        JSON.stringify({ logged: !logError, id: logId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Auth security error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", allowed: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
