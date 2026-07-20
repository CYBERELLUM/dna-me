import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface NutrigenomicsReportRequest {
  recipientEmail: string;
  recipientName: string;
  cellularData: {
    senescenceLevel: number;
    mitochondrialHealth: number;
    telomereLength: number;
    autophagyActivity: number;
    inflammationLevel: number;
    projectionYears: number;
  };
  selectedCompound?: string;
  aiInsights?: string;
}

const generateReportHtml = (data: NutrigenomicsReportRequest): string => {
  const { cellularData, selectedCompound: rawCompound, aiInsights: rawInsights, recipientName: rawName } = data;
  const recipientName = escapeHtml(rawName);
  const selectedCompound = rawCompound ? escapeHtml(rawCompound) : "";
  const aiInsights = rawInsights ? escapeHtml(rawInsights) : "";
  
  const getStatusColor = (value: number, inverse: boolean = false) => {
    const adjusted = inverse ? 1 - value : value;
    if (adjusted >= 0.7) return "#10b981";
    if (adjusted >= 0.4) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusLabel = (value: number, inverse: boolean = false) => {
    const adjusted = inverse ? 1 - value : value;
    if (adjusted >= 0.7) return "Optimal";
    if (adjusted >= 0.4) return "Moderate";
    return "Needs Attention";
  };

  const recommendations = [];
  
  if (cellularData.senescenceLevel > 0.4) {
    recommendations.push("Consider senolytics like Quercetin + Dasatinib or Fisetin to target senescent cells");
  }
  if (cellularData.mitochondrialHealth < 0.6) {
    recommendations.push("Support mitochondrial function with NAD+ precursors (NMN, NR) and CoQ10");
  }
  if (cellularData.telomereLength < 0.5) {
    recommendations.push("Focus on telomere protection with Omega-3s and reduce oxidative stress");
  }
  if (cellularData.autophagyActivity < 0.5) {
    recommendations.push("Enhance autophagy through intermittent fasting and spermidine supplementation");
  }
  if (cellularData.inflammationLevel > 0.3) {
    recommendations.push("Address chronic inflammation with Curcumin, Omega-3s, and anti-inflammatory diet");
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nutrigenomics Insights Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1117; color: #e5e7eb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2)); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; margin-bottom: 20px;">
        <span style="color: #22c55e; font-size: 12px; font-family: monospace;">🧬 CULMINATE H LABS</span>
      </div>
      <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px;">Nutrigenomics Insights Report</h1>
      <p style="color: #9ca3af; font-size: 14px; margin: 0;">Personalized cellular aging analysis and recommendations</p>
    </div>

    <!-- Greeting -->
    <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <p style="color: #e5e7eb; margin: 0;">Hello ${recipientName || "Researcher"},</p>
      <p style="color: #9ca3af; margin: 10px 0 0; font-size: 14px;">Here's your personalized nutrigenomics analysis based on your current cellular biomarkers.</p>
    </div>

    <!-- Cellular Biomarkers -->
    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px;">
      <span style="color: #22c55e;">📊</span> Cellular Biomarkers
    </h2>
    
    <div style="background: rgba(30, 30, 40, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <!-- Senescence -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #e5e7eb; font-size: 14px;">Senescence Level</span>
          <span style="color: ${getStatusColor(cellularData.senescenceLevel, true)}; font-size: 12px; font-weight: 600;">${getStatusLabel(cellularData.senescenceLevel, true)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${getStatusColor(cellularData.senescenceLevel, true)}; height: 100%; width: ${cellularData.senescenceLevel * 100}%; border-radius: 4px;"></div>
        </div>
        <span style="color: #9ca3af; font-size: 12px;">${Math.round(cellularData.senescenceLevel * 100)}%</span>
      </div>

      <!-- Mitochondrial Health -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #e5e7eb; font-size: 14px;">Mitochondrial Health</span>
          <span style="color: ${getStatusColor(cellularData.mitochondrialHealth)}; font-size: 12px; font-weight: 600;">${getStatusLabel(cellularData.mitochondrialHealth)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${getStatusColor(cellularData.mitochondrialHealth)}; height: 100%; width: ${cellularData.mitochondrialHealth * 100}%; border-radius: 4px;"></div>
        </div>
        <span style="color: #9ca3af; font-size: 12px;">${Math.round(cellularData.mitochondrialHealth * 100)}%</span>
      </div>

      <!-- Telomere Length -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #e5e7eb; font-size: 14px;">Telomere Length</span>
          <span style="color: ${getStatusColor(cellularData.telomereLength)}; font-size: 12px; font-weight: 600;">${getStatusLabel(cellularData.telomereLength)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${getStatusColor(cellularData.telomereLength)}; height: 100%; width: ${cellularData.telomereLength * 100}%; border-radius: 4px;"></div>
        </div>
        <span style="color: #9ca3af; font-size: 12px;">${Math.round(cellularData.telomereLength * 100)}%</span>
      </div>

      <!-- Autophagy Activity -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #e5e7eb; font-size: 14px;">Autophagy Activity</span>
          <span style="color: ${getStatusColor(cellularData.autophagyActivity)}; font-size: 12px; font-weight: 600;">${getStatusLabel(cellularData.autophagyActivity)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${getStatusColor(cellularData.autophagyActivity)}; height: 100%; width: ${cellularData.autophagyActivity * 100}%; border-radius: 4px;"></div>
        </div>
        <span style="color: #9ca3af; font-size: 12px;">${Math.round(cellularData.autophagyActivity * 100)}%</span>
      </div>

      <!-- Inflammation -->
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #e5e7eb; font-size: 14px;">Inflammation Level</span>
          <span style="color: ${getStatusColor(cellularData.inflammationLevel, true)}; font-size: 12px; font-weight: 600;">${getStatusLabel(cellularData.inflammationLevel, true)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${getStatusColor(cellularData.inflammationLevel, true)}; height: 100%; width: ${cellularData.inflammationLevel * 100}%; border-radius: 4px;"></div>
        </div>
        <span style="color: #9ca3af; font-size: 12px;">${Math.round(cellularData.inflammationLevel * 100)}%</span>
      </div>
    </div>

    <!-- Projection -->
    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
      <span style="color: #a78bfa; font-size: 12px; font-family: monospace;">PROJECTION TIMELINE</span>
      <h3 style="color: #ffffff; font-size: 32px; margin: 10px 0 5px;">${cellularData.projectionYears} Years</h3>
      <p style="color: #9ca3af; font-size: 14px; margin: 0;">Epigenetic forecast horizon</p>
    </div>

    ${selectedCompound ? `
    <!-- Active Intervention -->
    <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #22c55e; font-size: 14px; margin: 0 0 10px;">🌿 Active Intervention</h3>
      <p style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 600;">${selectedCompound}</p>
    </div>
    ` : ""}

    ${aiInsights ? `
    <!-- AI Insights -->
    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px;">
      <span style="color: #3b82f6;">🤖</span> AI Analysis
    </h2>
    <div style="background: rgba(30, 30, 40, 0.6); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <p style="color: #e5e7eb; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${aiInsights}</p>
    </div>
    ` : ""}

    <!-- Recommendations -->
    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px;">
      <span style="color: #f59e0b;">💡</span> Personalized Recommendations
    </h2>
    <div style="background: rgba(30, 30, 40, 0.6); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      ${recommendations.length > 0 ? recommendations.map(rec => `
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <span style="color: #f59e0b;">•</span>
          <p style="color: #e5e7eb; font-size: 14px; margin: 0; line-height: 1.5;">${rec}</p>
        </div>
      `).join("") : `
        <p style="color: #10b981; font-size: 14px; margin: 0;">✓ Your biomarkers are within optimal ranges. Continue your current protocol!</p>
      `}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px;">Generated by Culminate H Labs Nutrigenomics Platform</p>
      <p style="color: #4b5563; font-size: 11px; margin: 0;">This report is for research purposes only and does not constitute medical advice.</p>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send nutrigenomics report");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestData: NutrigenomicsReportRequest = await req.json();
    console.log("Request from user:", userData.user.id);

    // Force recipient to the authenticated user's own email to prevent SMTP relay abuse.
    // The caller-supplied recipientEmail is ignored.
    const recipientEmail = userData.user.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({ success: false, error: "Authenticated user has no email on file." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    requestData.recipientEmail = recipientEmail;

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.error("Missing SMTP configuration");
      throw new Error("SMTP configuration is incomplete. Please configure SMTP settings.");
    }

    console.log(`Connecting to SMTP server: ${smtpHost}:${smtpPort}`);

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    const htmlContent = generateReportHtml(requestData);

    console.log(`Sending email to: ${recipientEmail}`);

    await client.send({
      from: smtpFromEmail,
      to: recipientEmail,
      subject: `🧬 Your Nutrigenomics Insights Report - Culminate H Labs`,
      html: htmlContent,
    });

    await client.close();

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Nutrigenomics report sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
