"use client";

import { useState } from "react";
import { AlertTriangle, FileImage, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { renderTicketCanvas, TICKET_RENDER_SCALE } from "@/lib/ticket-render";
import type { BookingPublic } from "@/lib/validation";
import { useT } from "@/components/providers/LanguageProvider";

type Kind = "png" | "jpg" | "pdf";

type Props = {
  booking: BookingPublic;
  statusLabel: string;
  ticketId?: string;
  compact?: boolean;
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function canvasToBlob(canvas: HTMLCanvasElement, kind: "png" | "jpg"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      kind === "png" ? "image/png" : "image/jpeg",
      0.92,
    );
  });
}

export default function TicketDownload({ booking, statusLabel, ticketId, compact = false }: Props) {
  const t = useT();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [failed, setFailed] = useState(false);

  const download = async (kind: Kind) => {
    if (busy) return;
    setBusy(kind);
    setFailed(false);
    try {
      const canvas = await renderTicketCanvas(booking, statusLabel, t, ticketId);
      const filenameBase = ticketId || booking.reference;
      if (kind === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pageW = Math.round((canvas.width / TICKET_RENDER_SCALE) * 0.75);
        const pageH = Math.round((canvas.height / TICKET_RENDER_SCALE) * 0.75);
        const pdf = new jsPDF({
          orientation: pageW >= pageH ? "landscape" : "portrait",
          unit: "pt",
          format: [pageW, pageH],
          compress: true,
        });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
        pdf.save(`ZANTA-NIGHT-${filenameBase}.pdf`);
      } else {
        saveBlob(await canvasToBlob(canvas, kind), `ZANTA-NIGHT-${filenameBase}.${kind}`);
      }
      await fetch("/api/my/tickets/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(ticketId ? { ticketId } : { bookingRef: booking.reference }),
          format: kind,
        }),
      });
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const options: { kind: Kind; label: string; icon: typeof FileText }[] = [
    { kind: "png", label: t.ticket.download.png, icon: ImageIcon },
    { kind: "jpg", label: t.ticket.download.jpg, icon: FileImage },
    { kind: "pdf", label: t.ticket.download.pdf, icon: FileText },
  ];

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "space-y-3"}>
      {!compact && (
        <div>
          <p className="kicker text-acid">{t.ticket.download.title}</p>
          <p className="mt-2 text-sm text-mist">{t.ticket.download.hint}</p>
        </div>
      )}
      <div className={compact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-3"}>
        {options.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => void download(kind)}
            disabled={busy !== null}
            className={`inline-flex items-center gap-2 border border-acid/50 bg-acid/10 text-acid transition-colors hover:bg-acid/20 disabled:opacity-60 ${
              compact
                ? "px-3 py-1.5 text-[0.58rem]"
                : "px-5 py-3 text-[0.68rem]"
            } font-semibold uppercase tracking-[0.18em]`}
          >
            {busy === kind ? (
              <Loader2 className={compact ? "h-3 w-3 animate-spin" : "h-4 w-4 animate-spin"} />
            ) : (
              <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
            )}
            {busy === kind ? t.ticket.download.preparing : label}
          </button>
        ))}
      </div>
      {failed && (
        <p className={`flex items-center gap-2 text-sm text-[#ff7a6b] ${compact ? "w-full" : ""}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t.ticket.download.error}
        </p>
      )}
    </div>
  );
}
