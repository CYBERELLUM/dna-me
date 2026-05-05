import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Body {
  category: string;
  title: string;
  description: string;
  submitterEmail?: string;
  submitterName?: string;
  submitterRole?: string;
  pageUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { category, title, description } = body;

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return new Response(JSON.stringify({ error: "category, title and description are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (title.length > 200 || description.length > 5000) {
      return new Response(JSON.stringify({ error: "Input too long" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      throw new Error("SMTP configuration is incomplete.");
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost, port: smtpPort, tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

    const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f1117;color:#e5e7eb;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#1a1d27;border:1px solid #2a2f3a;border-radius:12px;padding:28px;">
    <h2 style="margin:0 0 6px;color:#a78bfa;">💡 New Feature Suggestion</h2>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:13px;">Submitted via the platform</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#9ca3af;width:130px;">Category</td><td><strong>${escapeHtml(category)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Title</td><td><strong>${escapeHtml(title)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">From</td><td>${escapeHtml(body.submitterName || "Anonymous")} &lt;${escapeHtml(body.submitterEmail || "n/a")}&gt;</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Role</td><td>${escapeHtml(body.submitterRole || "unknown")}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Page</td><td>${escapeHtml(body.pageUrl || "")}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #2a2f3a;margin:20px 0;" />
    <h3 style="margin:0 0 8px;color:#e5e7eb;font-size:15px;">Description</h3>
    <div style="white-space:pre-wrap;line-height:1.6;color:#d1d5db;">${escapeHtml(description)}</div>
  </div>
</body></html>`;

    await client.send({
      from: smtpFromEmail,
      to: "ceo@cyberellum.technology",
      replyTo: body.submitterEmail || undefined,
      subject: `[Feature Suggestion] ${category}: ${title}`,
      html,
    });

    // Auto-reply to the submitter (if they provided an email)
    if (body.submitterEmail) {
      const submitterName = body.submitterName?.trim() || "there";
      const autoReplyHtml = `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f1117;color:#e5e7eb;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#1a1d27;border:1px solid #2a2f3a;border-radius:12px;padding:32px;">
    <h2 style="margin:0 0 16px;color:#a78bfa;">Thank you, ${escapeHtml(submitterName)}!</h2>
    <p style="line-height:1.6;color:#d1d5db;margin:0 0 16px;">
      We've received your suggestion and truly appreciate you taking the time to help us improve the platform.
    </p>
    <p style="line-height:1.6;color:#d1d5db;margin:0 0 16px;">
      Our team will review your input carefully. If we need any clarification, we'll reach out directly.
    </p>
    <div style="background:#0f1117;border:1px solid #2a2f3a;border-radius:8px;padding:16px;margin:20px 0;">
      <div style="color:#9ca3af;font-size:12px;margin-bottom:6px;">Your submission</div>
      <div style="color:#e5e7eb;font-weight:600;margin-bottom:4px;">${escapeHtml(title)}</div>
      <div style="color:#9ca3af;font-size:13px;">Category: ${escapeHtml(category)}</div>
    </div>
    <p style="line-height:1.6;color:#d1d5db;margin:0 0 8px;">Warm regards,</p>
    <p style="line-height:1.6;color:#a78bfa;margin:0;font-weight:600;">The Cyberellum Genomics Team</p>
    <hr style="border:none;border-top:1px solid #2a2f3a;margin:24px 0 12px;" />
    <p style="color:#6b7280;font-size:11px;margin:0;">This is an automated confirmation. Please do not reply.</p>
  </div>
</body></html>`;

      try {
        await client.send({
          from: smtpFromEmail,
          to: body.submitterEmail,
          subject: `We received your suggestion: ${title}`,
          html: autoReplyHtml,
        });
      } catch (autoErr) {
        console.error("Auto-reply send failed:", autoErr);
      }
    }

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-feature-suggestion error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
