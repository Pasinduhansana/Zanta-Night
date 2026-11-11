import QRCode from "qrcode";
import { EVENT } from "@/lib/event-config";
import type { BookingPublic } from "@/lib/validation";
import type { Dict } from "@/lib/i18n/en";

export const TICKET_RENDER_SCALE = 2;
const SCALE = TICKET_RENDER_SCALE;
const W = 1200;
const H = 580;
const DIVIDER = 940;
const PAD = 44;
const MAIN_W = DIVIDER - PAD * 2;

const C = {
  abyss: "#001a14",
  forest: "#002d20",
  stub: "#001c14",
  cell: "#012a1d",
  acid: "#b6ff00",
  bone: "#f7f8f2",
  mist: "#c8d2ce",
  hair: "rgba(255,255,255,0.12)",
  perf: "rgba(255,255,255,0.28)",
};

type Ctx = CanvasRenderingContext2D & {
  letterSpacing?: string;
  __display: string;
  __body: string;
};

function families(): { display: string; body: string } {
  const styles = getComputedStyle(document.documentElement);
  const display = styles.getPropertyValue("--font-anton").trim();
  const body = styles.getPropertyValue("--font-grotesk").trim();
  return {
    display: display || "Anton, Impact, sans-serif",
    body: body || "Arial, Helvetica, sans-serif",
  };
}

function setFont(ctx: Ctx, size: number, weight: number, display = false) {
  const fam = display ? ctx.__display : ctx.__body;
  ctx.font = `${weight} ${Math.round(size)}px ${fam}`;
}

function setLs(ctx: Ctx, value: string) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = value;
}

function drawFitted(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxW: number,
  startSize: number,
  minSize: number,
  weight: number,
  display: boolean,
  color: string,
) {
  setLs(ctx, "0px");
  let size = startSize;
  setFont(ctx, size, weight, display);
  while (ctx.measureText(text).width > maxW && size > minSize) {
    size -= 1;
    setFont(ctx, size, weight, display);
  }
  if (ctx.measureText(text).width > maxW) {
    let trimmed = text;
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxW) {
      trimmed = trimmed.slice(0, -1);
    }
    text = `${trimmed}…`;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function wrapLines(ctx: Ctx, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) {
        lines[maxLines - 1] += "…";
        return lines;
      }
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("QR image failed to load"));
    img.src = src;
  });
}

/**
 * Draws the full (post-approval) ticket onto a high-density canvas so the
 * guest can download it as PNG, JPG or (via jsPDF) a PDF document.
 */
export async function renderTicketCanvas(
  booking: BookingPublic,
  statusLabel: string,
  t: Dict,
  ticketId?: string,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const raw = canvas.getContext("2d");
  if (!raw) throw new Error("Canvas 2D unavailable");
  const ctx = raw as Ctx;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";

  const fam = families();
  ctx.__display = fam.display;
  ctx.__body = fam.body;

  const qrUrl = await QRCode.toDataURL(ticketId ?? booking.reference, {
    width: 512,
    margin: 1,
    color: { dark: "#001a14ff", light: "#ffffffff" },
  });
  const qr = await loadImage(qrUrl);

  /* ---------------------------------------------------------- backgrounds */
  ctx.fillStyle = C.forest;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.stub;
  ctx.fillRect(DIVIDER, 0, W - DIVIDER, H);

  /* --------------------------------------------------------- main column */
  // wordmark
  setLs(ctx, "1px");
  setFont(ctx, 38, 400, true);
  const wordA = "ZANTA ";
  ctx.fillStyle = C.bone;
  ctx.fillText(wordA, PAD, 36);
  const wordAx = PAD + ctx.measureText(wordA).width;
  ctx.fillStyle = C.acid;
  ctx.fillText("NIGHT", wordAx, 36);

  setLs(ctx, "4px");
  setFont(ctx, 10.5, 500, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(EVENT.subtitle.toUpperCase(), PAD, 86);

  // category chip (top-right of the main side)
  setLs(ctx, "2px");
  setFont(ctx, 9.5, 700, false);
  const chipLabel = booking.ticketCategory.toUpperCase();
  const chipW = ctx.measureText(chipLabel).width + 30;
  const chipX = DIVIDER - PAD - chipW;
  ctx.strokeStyle = C.acid;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(chipX + 0.5, 40.5, chipW - 1, 25);
  ctx.fillStyle = C.acid;
  ctx.fillText(chipLabel, chipX + 15, 47);

  // perforation
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 128.5);
  ctx.lineTo(DIVIDER - PAD, 128.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // guest
  setLs(ctx, "3px");
  setFont(ctx, 9.5, 600, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(t.confirmation.guest.toUpperCase(), PAD, 148);

  setLs(ctx, "0px");
  drawFitted(ctx, booking.fullName, PAD, 164, MAIN_W, 40, 24, 400, true, C.bone);

  setFont(ctx, 13.5, 400, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(`${booking.email} · ${booking.phone}`, PAD, 216);

  // details grid 2×2
  const details: [string, string][] = [
    [t.confirmation.details.date, t.event.dateShort],
    [t.confirmation.details.time, EVENT.time.label],
    [t.confirmation.details.venue, EVENT.venue.statusLabel],
    [t.confirmation.details.tickets, `${booking.quantity} × ${t.event.category}`],
  ];
  const cellW = (MAIN_W - 1) / 2;
  const cellH = 62;
  const gridY = 260;
  details.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + 1);
    const y = gridY + row * (cellH + 1);
    ctx.fillStyle = C.cell;
    ctx.fillRect(x, y, cellW, cellH);
    setLs(ctx, "2.5px");
    setFont(ctx, 9, 600, false);
    ctx.fillStyle = C.mist;
    ctx.fillText(label.toUpperCase(), x + 14, y + 11);
    setLs(ctx, "1px");
    setFont(ctx, 14, 500, false);
    ctx.fillStyle = C.bone;
    drawFitted(ctx, value.toUpperCase(), x + 14, y + 31, cellW - 28, 14, 10.5, 500, false, C.bone);
  });
  ctx.strokeStyle = C.hair;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD + 0.5, gridY + 0.5, MAIN_W - 1, cellH * 2 + 1);

  // total + status
  setLs(ctx, "2.5px");
  setFont(ctx, 9, 600, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(t.confirmation.total.toUpperCase(), PAD, 400);
  setLs(ctx, "0px");
  setFont(ctx, 32, 400, true);
  ctx.fillStyle = C.acid;
  ctx.fillText(`LKR ${booking.total.toLocaleString("en-US")}`, PAD, 414);

  setLs(ctx, "1.5px");
  setFont(ctx, 10.5, 700, false);
  const stLabel = statusLabel.toUpperCase();
  const stW = ctx.measureText(stLabel).width + 38;
  const stX = DIVIDER - PAD - stW;
  ctx.strokeStyle = C.acid;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(stX + 0.5, 412.5, stW - 1, 27);
  ctx.fillStyle = C.acid;
  ctx.beginPath();
  ctx.arc(stX + 15, 426, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(stLabel, stX + 26, 419);

  // QR + reference
  ctx.drawImage(qr, PAD, 470, 76, 76);
  setLs(ctx, "2px");
  setFont(ctx, 12, 700, false);
  ctx.fillStyle = C.bone;
  ctx.fillText(booking.reference.toUpperCase(), PAD + 92, 486);
  setFont(ctx, 11, 500, false);
  ctx.fillStyle = C.mist;
  const orgLabel = EVENT.organizer;
  const orgW = ctx.measureText(orgLabel).width;
  ctx.fillText(orgLabel, DIVIDER - PAD - orgW, 486);

  /* -------------------------------------------------------------- stub */
  setLs(ctx, "3px");
  setFont(ctx, 9.5, 700, false);
  ctx.fillStyle = C.acid;
  ctx.fillText(t.confirmation.entryStub.toUpperCase(), DIVIDER + 24, 40);

  setLs(ctx, "0px");
  drawFitted(
    ctx,
    EVENT.date.shortLabel,
    DIVIDER + 24,
    66,
    W - DIVIDER - 48,
    30,
    20,
    400,
    true,
    C.bone,
  );

  setFont(ctx, 13, 400, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(EVENT.time.label, DIVIDER + 24, 110);

  setLs(ctx, "2px");
  setFont(ctx, 10, 500, false);
  ctx.fillStyle = "rgba(200,210,206,0.7)";
  const stubW = W - DIVIDER - 48;
  wrapLines(ctx, EVENT.venue.statusLabel.toUpperCase(), stubW, 2).forEach((line, i) => {
    ctx.fillText(line, DIVIDER + 24, 140 + i * 17);
  });

  const stubQr = 96;
  const stubQrX = DIVIDER + (W - DIVIDER) / 2 - stubQr / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(stubQrX - 6, 402, stubQr + 12, stubQr + 12);
  ctx.drawImage(qr, stubQrX, 408, stubQr, stubQr);

  ctx.textAlign = "center";
  setLs(ctx, "1.5px");
  setFont(ctx, 12, 700, false);
  ctx.fillStyle = C.acid;
  ctx.fillText(booking.reference.toUpperCase(), DIVIDER + (W - DIVIDER) / 2, 516);
  setLs(ctx, "2px");
  setFont(ctx, 10, 500, false);
  ctx.fillStyle = C.mist;
  ctx.fillText(
    t.confirmation.qty(booking.quantity).toUpperCase(),
    DIVIDER + (W - DIVIDER) / 2,
    540,
  );
  ctx.textAlign = "left";

  /* ------------------------------------------------------ frame + divider */
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = C.perf;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(DIVIDER + 0.5, 0);
  ctx.lineTo(DIVIDER + 0.5, H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = C.abyss;
  ctx.beginPath();
  ctx.arc(DIVIDER + 0.5, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(DIVIDER + 0.5, H, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(182,255,0,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  return canvas;
}
