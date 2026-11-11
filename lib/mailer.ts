import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { EVENT } from "@/lib/event-config";

export type TicketMailInput = {
  to: string;
  name: string;
  reference: string;
  tickets: { ticketId: string; seatIndex: number }[];
};

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Emails every issued ticket for a booking as inline QR images.
 * Returns false (with a warning) when SMTP is not configured — payment-credentials pattern.
 */
export async function sendTicketEmail(input: TicketMailInput): Promise<boolean> {
  if (!smtpConfigured()) {
    console.warn(
      "[zanta] SMTP is not configured — ticket email skipped. " +
        "Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to enable sending.",
    );
    return false;
  }

  const attachments = await Promise.all(
    input.tickets.map(async (ticket) => ({
      filename: `${ticket.ticketId}.png`,
      content: await QRCode.toBuffer(ticket.ticketId, {
        type: "png",
        width: 480,
        margin: 1,
        color: { dark: "#001a14ff", light: "#ffffffff" },
      }),
      cid: `qr-${ticket.ticketId}`,
      contentType: "image/png",
    })),
  );

  const eventLine = `${EVENT.date.shortLabel} · ${EVENT.time.label} · ${escapeHtml(EVENT.venue.statusLabel)}`;
  const ticketCards = input.tickets
    .map(
      (ticket) => `
      <tr><td style="padding:0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1d3a30;background:#002d20;margin-bottom:16px;border-radius:6px">
          <tr>
            <td align="center" style="padding:20px 16px 8px">
              <div style="font:700 11px/1 Arial,sans-serif;letter-spacing:3px;color:#b6ff00;text-transform:uppercase">
                Ticket ${ticket.seatIndex} of ${input.tickets.length}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 16px">
              <img src="cid:qr-${ticket.ticketId}" width="180" height="180" alt="QR code for ${ticket.ticketId}" style="display:block;border:8px solid #ffffff;background:#ffffff" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 16px 18px">
              <div style="font:700 18px/1.2 ui-monospace,Menlo,Consolas,monospace;color:#f7f8f2;letter-spacing:2px">${ticket.ticketId}</div>
              <div style="font:400 11px/1.5 Arial,sans-serif;color:#c8d2ce;margin-top:8px;text-transform:uppercase;letter-spacing:2px">
                One person · Single scan
              </div>
            </td>
          </tr>
        </table>
      </td></tr>`,
    )
    .join("");

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
          ${escapeHtml(EVENT.subtitle)}
        </div>
      </td></tr>
      <tr><td style="padding:0 4px 8px">
        <div style="font:700 13px/1.5 Arial,sans-serif;color:#f7f8f2">
          ${escapeHtml(input.name)}, your tickets are confirmed.
        </div>
        <div style="font:400 13px/1.7 Arial,sans-serif;color:#c8d2ce">
          Booking <strong style="color:#b6ff00">${escapeHtml(input.reference)}</strong><br/>
          ${eventLine}
        </div>
      </td></tr>
      ${ticketCards}
      <tr><td style="padding:12px 4px 0;border-top:1px solid #1d3a30">
        <div style="font:400 11px/1.8 Arial,sans-serif;color:#c8d2ce">
          Show one QR code per person at the entrance — each ticket can be scanned only once.
          Keep this email handy; screenshots of the QR codes are fine.
        </div>
      </td></tr>
    </table>
  </body>
</html>`;

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

  await transport.sendMail({
    from: process.env.MAIL_FROM?.trim() || `ZANTA NIGHT <${process.env.SMTP_USER}>`,
    replyTo: process.env.SMTP_USER,
    to: input.to,
    subject: `Your ZANTA NIGHT tickets are ready — ${input.reference}`,
    html,
    text: [
      `Your ZANTA NIGHT tickets are confirmed, ${input.name}.`,
      `Booking: ${input.reference}`,
      `Event: ${EVENT.date.shortLabel} · ${EVENT.time.label} · ${EVENT.venue.statusLabel}`,
      "",
      ...input.tickets.map(
        (ticket) => `Ticket ${ticket.seatIndex}: ${ticket.ticketId} (show the QR code in this email at entry)`,
      ),
    ].join("\n"),
    attachments,
  });
  return true;
}
