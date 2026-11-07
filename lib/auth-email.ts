import { Resend } from "resend";
import { OTP_TTL_MS } from "@/lib/models/OtpCode";

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the 6-digit login code via Resend (RESEND_API_KEY / RESEND_FROM_EMAIL).
 * Without an API key it falls back to logging the code to the server console
 * (dev mode) so the flow stays testable. Throws when Resend rejects the send.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const minutes = Math.max(1, Math.round(OTP_TTL_MS / 60_000));

  if (!resendConfigured()) {
    console.warn(`[zanta] RESEND_API_KEY not set — OTP for ${to}: ${code}`);
    return;
  }

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#001a14;font-family:Arial,Helvetica,sans-serif;color:#f7f8f2">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto">
      <tr><td style="padding:8px 4px 20px">
        <div style="font:400 30px/1 Arial,sans-serif;letter-spacing:4px;text-transform:uppercase">
          ZANTA <span style="color:#b6ff00">NIGHT</span>
        </div>
        <div style="font:400 11px/1.6 Arial,sans-serif;letter-spacing:4px;color:#c8d2ce;text-transform:uppercase;margin-top:8px">
          Member access
        </div>
      </td></tr>
      <tr><td style="padding:0 4px 8px">
        <div style="font:700 13px/1.5 Arial,sans-serif;color:#f7f8f2">
          Your login code
        </div>
        <div style="font:400 13px/1.7 Arial,sans-serif;color:#c8d2ce">
          Enter this code at the My Tickets sign-in for
          <strong style="color:#b6ff00">${escapeHtml(to)}</strong>.
        </div>
      </td></tr>
      <tr><td style="padding:12px 4px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1d3a30;background:#002d20;border-radius:6px">
          <tr><td align="center" style="padding:26px 16px">
            <div style="font:700 44px/1 ui-monospace,Menlo,Consolas,monospace;color:#b6ff00;letter-spacing:10px">${code}</div>
            <div style="font:400 11px/1.6 Arial,sans-serif;color:#c8d2ce;margin-top:14px;text-transform:uppercase;letter-spacing:2px">
              Expires in ${minutes} minutes
            </div>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 4px 0;border-top:1px solid #1d3a30">
        <div style="font:400 11px/1.8 Arial,sans-serif;color:#c8d2ce">
          This code can be used once and expires in ${minutes} minutes.
          If you didn't request it you can safely ignore this email — no one can
          access your bookings without it.
        </div>
      </td></tr>
    </table>
  </body>
</html>`;

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "ZANTA NIGHT <onboarding@resend.dev>";
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Your ZANTA NIGHT login code — ${code}`,
    html,
  });
  if (error) {
    throw new Error(error.message || "Resend rejected the message");
  }
}
