import nodemailer from "nodemailer";
import { OTP_TTL_MS } from "@/lib/models/OtpCode";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the 6-digit login code through the configured SMTP app-password transport.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const minutes = Math.max(1, Math.round(OTP_TTL_MS / 60_000));

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

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP email transport is not configured");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    tls: {
      rejectUnauthorized:
        process.env.NODE_ENV === "production" || process.env.SMTP_ALLOW_SELF_SIGNED !== "true",
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const from = process.env.MAIL_FROM?.trim() || `ZANTA NIGHT <${process.env.SMTP_USER}>`;
  await transport.sendMail({
    from,
    to,
    replyTo: process.env.SMTP_USER,
    subject: "Your ZANTA NIGHT verification code",
    html,
    text: `Your ZANTA NIGHT verification code is ${code}. It expires in ${minutes} minutes.`,
  });
}
