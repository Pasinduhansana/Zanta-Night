"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Home,
  Loader2,
  Lock,
  RefreshCw,
  Ticket,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT } from "@/lib/event-config";
import type { BookingPublic, BookingStatus, SlipInfo } from "@/lib/validation";
import { useT } from "@/components/providers/LanguageProvider";
import QrCode from "@/components/QrCode";
import TicketDownload from "@/components/tickets/TicketDownload";
import type { Dict } from "@/lib/i18n/en";

type State =
  | { status: "loading" }
  | { status: "error"; code?: string; message?: string }
  | { status: "ready"; booking: BookingPublic };

type EventInfo = {
  paymentConfigured: boolean;
  windowHours: number;
  payment: {
    bank: { name: string; accountName: string; accountNumber: string };
    wallets: { label: string; number: string }[];
    extraNote: string;
  };
};

type UploadState = {
  phase: "idle" | "uploading" | "success" | "error";
  code?: string;
  message?: string;
};

const UPLOADABLE: BookingStatus[] = ["pending", "awaiting_verification", "rejected"];

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: "border-mist/40 text-mist bg-mist/5",
  awaiting_verification: "border-[#ffc53d]/55 text-[#ffc53d] bg-[#ffc53d]/8",
  confirmed: "border-acid/55 text-acid bg-acid/8",
  checked_in: "border-volt/55 text-volt bg-volt/8",
  rejected: "border-[#ff7a6b]/55 text-[#ff7a6b] bg-[#ff7a6b]/8",
  expired: "border-mist/25 text-mist bg-mist/5",
};

const STATUS_KEY = {
  pending: "pending",
  awaiting_verification: "awaiting",
  confirmed: "confirmed",
  checked_in: "checkedIn",
  rejected: "rejected",
  expired: "expired",
} as const satisfies Record<BookingStatus, keyof Dict["confirmation"]["status"]>;

function statusUi(status: BookingStatus, t: Dict) {
  const entry = t.confirmation.status[STATUS_KEY[status]];
  return {
    className: STATUS_CLASS[status],
    label: entry.label,
    blurb: entry.blurb(EVENT.payment.windowHours),
  };
}

/**
 * Zig-zag clip-path used for the torn edge of the darkened stub veil.
 * `left` = jagged edge down the left side (desktop stub), `top` = across the
 * top edge (mobile stub, which stacks below the main ticket body).
 */
function jaggedEdge(axis: "left" | "top", teeth = 16): string {
  const pts: string[] = [];
  const steps = teeth * 2;
  for (let i = 0; i <= steps; i++) {
    const p = (i / steps) * 100;
    const zig = i % 2 === 0 ? 0 : 2.4;
    pts.push(axis === "left" ? `${zig}% ${p}%` : `${p}% ${zig}%`);
  }
  if (axis === "left") pts.push("100% 100%", "100% 0%");
  else pts.push("100% 100%", "0% 100%");
  return `polygon(${pts.join(", ")})`;
}

const TEAR_LEFT = jaggedEdge("left");
const TEAR_TOP = jaggedEdge("top");

type TicketPhase = "locked" | "partial" | "full";

function ticketPhase(status: BookingStatus): TicketPhase {
  if (status === "confirmed" || status === "checked_in") return "full";
  if (status === "awaiting_verification") return "partial";
  return "locked";
}

function uploadErrorText(
  code: string | undefined,
  fallback: string | undefined,
  t: Dict,
): string {
  const map = t.confirmation.uploadErrors;
  switch (code) {
    case "type":
    case "size":
    case "network":
    case "notAllowed":
    case "notFound":
      return map[code];
    default:
      return fallback || map.generic;
  }
}

async function fetchBooking(ref: string): Promise<State> {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(ref)}`, { cache: "no-store" });
    const data = (await res.json()) as {
      ok: boolean;
      booking?: BookingPublic;
      error?: string;
      code?: string;
    };
    if (!res.ok || !data.ok || !data.booking) {
      return {
        status: "error",
        code: data.code ?? (res.status === 404 ? "notFound" : res.status === 400 ? "invalid" : "server"),
        message: data.error,
      };
    }
    return { status: "ready", booking: data.booking };
  } catch {
    return { status: "error", code: "network" };
  }
}

export default function ConfirmationView() {
  const t = useT();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref")?.trim() ?? "";

  const [state, setState] = useState<State>({ status: "loading" });
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [upload, setUpload] = useState<UploadState>({ phase: "idle" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bookingStatus = state.status === "ready" ? state.booking.status : null;

  const loadBooking = useCallback(async () => {
    if (!ref) return;
    setState({ status: "loading" });
    setState(await fetchBooking(ref));
  }, [ref]);

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    void (async () => {
      const result = await fetchBooking(ref);
      if (!cancelled) setState(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/event", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: EventInfo & { ok: boolean }) => {
        if (!cancelled && data.ok) setEventInfo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // While the slip awaits verification, poll quietly so the approved ticket
  // reveal (tear-open + downloads) happens without a manual refresh.
  useEffect(() => {
    if (!ref || bookingStatus !== "awaiting_verification") return;
    let cancelled = false;
    const id = window.setInterval(() => {
      void fetchBooking(ref).then((next) => {
        if (cancelled || next.status !== "ready") return;
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          return prev.booking.status !== next.booking.status ||
            prev.booking.verifiedAt !== next.booking.verifiedAt
            ? next
            : prev;
        });
      });
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ref, bookingStatus]);

  const applyBooking = (booking: BookingPublic) =>
    setState({ status: "ready", booking });

  const handleUpload = async () => {
    if (!pendingFile || !ref) return;
    const file = pendingFile;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUpload({ phase: "error", code: "type" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUpload({ phase: "error", code: "size" });
      return;
    }
    setUpload({ phase: "uploading" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/tickets/${encodeURIComponent(ref)}/slip`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok: boolean;
        booking?: BookingPublic;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.ok || !data.booking) {
        setUpload({
          phase: "error",
          code: data.code ?? (res.status >= 500 ? "server" : "generic"),
          message: data.error,
        });
        return;
      }
      applyBooking(data.booking);
      setUpload({ phase: "success" });
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setUpload({ phase: "error", code: "network" });
    }
  };

  if (!ref) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-40 pb-24 sm:px-8">
        <div className="border border-white/15 bg-forest/40 p-8">
          <AlertTriangle className="h-7 w-7 text-acid" />
          <h1 className="mt-4 text-4xl">{t.confirmation.noRefTitle}</h1>
          <p className="mt-3 text-mist">{t.confirmation.noRefBody}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              {t.confirmation.newBooking}
            </Link>
            <Link href="/" className="btn-ghost px-6 py-3.5 text-[0.7rem]">
              <Home className="h-4 w-4" />
              {t.confirmation.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 pt-40 pb-24 sm:px-8">
        <div className="flex items-center gap-3 text-mist">
          <Loader2 className="h-4 w-4 animate-spin text-acid" />
          <span className="kicker">{t.confirmation.loading}</span>
        </div>
        <div className="skeleton mt-6 h-80 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    const errorText = (() => {
      switch (state.code) {
        case "notFound":
          return t.confirmation.errors.notFound;
        case "invalid":
          return t.confirmation.errors.invalid;
        case "network":
          return t.confirmation.errors.network;
        case "server":
          return t.confirmation.errors.server;
        default:
          return state.message || t.confirmation.errors.notFound;
      }
    })();
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-40 pb-24 sm:px-8">
        <div className="border border-[#ff7a6b]/40 bg-[#ff7a6b]/8 p-8">
          <AlertTriangle className="h-7 w-7 text-[#ff7a6b]" />
          <h1 className="mt-4 text-4xl">{t.confirmation.notFoundTitle}</h1>
          <p className="mt-3 text-mist">{errorText}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={loadBooking} className="btn-ghost px-6 py-3.5 text-[0.7rem]">
              <RefreshCw className="h-4 w-4" />
              {t.confirmation.retry}
            </button>
            <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              {t.confirmation.newBooking}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { booking } = state;
  const ui = statusUi(booking.status, t);
  const showPayment =
    booking.status !== "confirmed" &&
    booking.status !== "checked_in" &&
    booking.status !== "expired";
  const canUpload = showPayment && UPLOADABLE.includes(booking.status);
  const phase = ticketPhase(booking.status);

  const details: [string, string][] = [
    [t.confirmation.details.date, t.event.dateShort],
    [t.confirmation.details.time, EVENT.time.label],
    [t.confirmation.details.venue, EVENT.venue.statusLabel],
    [t.confirmation.details.tickets, `${booking.quantity} × ${t.event.category}`],
  ];

  const uploadError =
    upload.phase === "error"
      ? uploadErrorText(upload.code, upload.message, t)
      : null;
  const uploadSuccess = upload.phase === "success" ? t.confirmation.uploadSuccess : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker text-acid">{t.confirmation.created}</span>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.92]">
            {t.confirmation.headingTop}
            <span className="block text-metallic-sheen">{t.confirmation.headingBottom}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={loadBooking}
          className="btn-ghost mt-11 px-4 py-2.5 text-[0.62rem]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t.confirmation.refresh}
        </button>
      </div>

      <p className="mt-4 max-w-lg text-mist">
        {t.confirmation.refIntro}{" "}
        <strong className="font-semibold text-acid">{booking.reference}</strong>{" "}
        {t.confirmation.refOutro(t.event.dateShort)}
      </p>

      {/* status banner */}
      <div className={`mt-6 flex items-start gap-3.5 border px-5 py-4 ${ui.className}`}>
        {booking.status === "confirmed" || booking.status === "checked_in" ? (
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
        ) : booking.status === "rejected" ? (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        ) : booking.status === "awaiting_verification" ? (
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <Ticket className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">{ui.label}</p>
          <p className="mt-1 text-sm opacity-90">
            {ui.blurb}
            {booking.status === "rejected" && booking.rejectReason
              ? ` ${t.confirmation.reasonPrefix} ${booking.rejectReason}`
              : ""}
          </p>
        </div>
      </div>

      {/* ------------------------------------------ ticket reveal (3 phases) */}
      <AnimatePresence mode="wait" initial={false}>
        {phase === "locked" ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.3 } }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-7 overflow-hidden border border-dashed border-white/25 bg-forest/30"
          >
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-acid/40 bg-abyss/70">
                <Lock className="h-6 w-6 text-acid" strokeWidth={2} />
              </span>
              <span className="kicker text-mist">{t.ticket.lockedKicker}</span>
              <h2 className="font-display text-3xl leading-none text-bone">
                {t.ticket.lockedTitle}
              </h2>
              <p className="max-w-md text-sm text-mist">{t.ticket.lockedBody}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, y: 26, rotate: -0.35 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 110, damping: 17 }}
            className="relative mt-7 overflow-hidden border border-acid/30 bg-forest shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
          >
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-3xl leading-none">
                  ZANTA <span className="text-acid">NIGHT</span>
                </p>
                <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.3em] text-mist">
                  {t.event.subtitle}
                </p>
              </div>
              <span className={`chip ${booking.status === "confirmed" ? "chip-acid" : ""}`}>
                {t.event.category}
              </span>
            </div>

            <div className="mt-7 border-t border-dashed border-white/20 pt-6">
              <p className="kicker text-mist">{t.confirmation.guest}</p>
              <p className="mt-2 font-display text-[clamp(1.7rem,4vw,2.6rem)] leading-none text-bone">
                {booking.fullName}
              </p>
              <p className="mt-2 text-sm text-mist">
                {booking.email} · {booking.phone}
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
              {details.map(([k, v]) => (
                <div key={k} className="bg-forest/80 px-4 py-3.5">
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                    {k}
                  </p>
                  <p className="mt-1.5 text-sm font-medium uppercase tracking-wide text-bone">
                    {v}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                  {t.confirmation.total}
                </p>
                <p className="font-display text-4xl leading-none text-acid tabular-nums">
                  LKR {booking.total.toLocaleString("en-US")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                  {t.confirmation.statusLabel}
                </p>
                <p
                  className={`mt-1 inline-flex items-center gap-2 border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] ${ui.className}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {ui.label}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <QrCode value={booking.reference} alt="" className="h-14 w-14 bg-white p-1" />
              <div className="mt-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-mist">
                <span>{booking.reference}</span>
                <span>{EVENT.organizer}</span>
              </div>
            </div>
          </div>

          <div aria-hidden className="relative hidden w-px md:block">
            <span className="perf-line absolute inset-y-0 left-0 w-px" />
            <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-abyss" />
            <span className="absolute -bottom-4 -left-4 h-8 w-8 rounded-full bg-abyss" />
          </div>
          <div className="border-t border-dashed border-white/25 md:hidden" />

          <div className="relative flex w-full flex-col justify-between gap-6 overflow-hidden bg-abyss/60 p-6 md:w-56 md:p-7">
            <div>
              <p className="kicker text-acid">{t.confirmation.entryStub}</p>
              <p className="mt-4 font-display text-4xl leading-[0.95] text-bone">
                {t.event.dateShort}
              </p>
              <p className="mt-2 text-sm text-mist">{EVENT.time.label}</p>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.22em] text-mist/70">
                {EVENT.venue.statusLabel}
              </p>
            </div>

            <div>
              <QrCode value={booking.reference} alt="" className="h-16 w-16 bg-white p-1" />
              <p className="mt-4 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-acid">
                {booking.reference}
              </p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.2em] text-mist">
                {t.confirmation.qty(booking.quantity)}
              </p>
            </div>

            {/* torn-edge veil: stub stays sealed until the admin approves */}
            <AnimatePresence>
              {phase === "partial" && (
                <motion.div
                  key="veil-desktop"
                  aria-hidden
                  className="absolute inset-0 hidden origin-right md:block"
                  style={{
                    clipPath: TEAR_LEFT,
                    backgroundColor: "rgba(0,0,0,0.85)",
                    backdropFilter: "blur(3px)",
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{
                    x: 44,
                    opacity: 0,
                    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  }}
                  transition={{ delay: 0.28, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center">
                    <Lock className="h-5 w-5 text-acid" strokeWidth={2} />
                    <span className="text-[0.52rem] font-semibold uppercase leading-relaxed tracking-[0.2em] text-mist">
                      {t.ticket.partialKicker}
                    </span>
                  </div>
                </motion.div>
              )}
              {phase === "partial" && (
                <motion.div
                  key="veil-mobile"
                  aria-hidden
                  className="absolute inset-0 origin-bottom md:hidden"
                  style={{
                    clipPath: TEAR_TOP,
                    backgroundColor: "rgba(0,0,0,0.85)",
                    backdropFilter: "blur(3px)",
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{
                    y: 44,
                    opacity: 0,
                    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  }}
                  transition={{ delay: 0.28, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center">
                    <Lock className="h-5 w-5 text-acid" strokeWidth={2} />
                    <span className="text-[0.52rem] font-semibold uppercase leading-relaxed tracking-[0.2em] text-mist">
                      {t.ticket.partialKicker}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {phase === "full" && (
          <motion.span
            key="sweep"
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-acid/20 to-transparent"
            initial={{ x: "-100%", opacity: 0.9 }}
            animate={{ x: "330%", opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeOut" }}
          />
        )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "partial" && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4 flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#ffc53d]"
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {t.ticket.partialNote}
        </motion.p>
      )}

      {phase === "full" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 border border-acid/30 bg-forest/40 p-5"
        >
          <p className="kicker text-acid">{t.ticket.approvedKicker}</p>
          <div className="mt-4">
            <TicketDownload booking={booking} statusLabel={ui.label} />
          </div>
        </motion.div>
      )}

      {/* -------------------------------------------------- payment & slip */}
      {showPayment && (
        <div className="mt-7 border border-white/12 bg-forest/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
            <span className="kicker text-acid">{t.confirmation.payment}</span>
            <span className="kicker text-mist">
              {eventInfo?.paymentConfigured
                ? t.confirmation.uploadWithin(eventInfo.windowHours)
                : t.confirmation.toBeAnnounced}
            </span>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
            {/* instructions */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-dashed border-white/15 pb-3">
                <span className="text-sm text-mist">{t.confirmation.amountDue}</span>
                <span className="font-display text-3xl leading-none text-acid tabular-nums">
                  LKR {booking.total.toLocaleString("en-US")}
                </span>
              </div>

              {eventInfo?.paymentConfigured ? (
                <div className="space-y-3 text-sm">
                  <p className="text-mist">{t.confirmation.transferNote(booking.reference)}</p>
                  {eventInfo.payment.bank.accountNumber && (
                    <div className="border border-white/10 bg-abyss/50 px-4 py-3">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                        {t.confirmation.bankTransfer}
                      </p>
                      <p className="mt-1.5 font-medium text-bone">
                        {eventInfo.payment.bank.name || t.confirmation.bankFallback} —{" "}
                        {eventInfo.payment.bank.accountName}
                      </p>
                      <p className="mt-0.5 font-display text-xl tracking-wider text-acid">
                        {eventInfo.payment.bank.accountNumber}
                      </p>
                    </div>
                  )}
                  {eventInfo.payment.wallets.map((w) => (
                    <div key={`${w.label}-${w.number}`} className="border border-white/10 bg-abyss/50 px-4 py-3">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                        {w.label}
                      </p>
                      <p className="mt-1 font-display text-xl tracking-wider text-acid">
                        {w.number}
                      </p>
                    </div>
                  ))}
                  {eventInfo.payment.extraNote && (
                    <p className="text-xs text-mist">{eventInfo.payment.extraNote}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-mist">{t.confirmation.paymentUnconfigured}</p>
              )}
            </div>

            {/* upload */}
            <div className="border border-white/10 bg-abyss/50 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="kicker text-mist">{t.confirmation.slip}</span>
                {booking.slip && (
                  <span className="text-[0.58rem] uppercase tracking-[0.2em] text-mist/70">
                    {(booking.slip as SlipInfo).fileName}
                  </span>
                )}
              </div>

              {canUpload ? (
                <>
                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-white/25 px-4 py-7 text-center transition-colors hover:border-acid/60 hover:bg-acid/5">
                    <Upload className="h-5 w-5 text-acid" />
                    <span className="text-sm text-bone">
                      {pendingFile ? pendingFile.name : t.confirmation.chooseSlip}
                    </span>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-mist/70">
                      {t.confirmation.formats}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        setPendingFile(e.target.files?.[0] ?? null);
                        setUpload({ phase: "idle" });
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!pendingFile || upload.phase === "uploading"}
                    className="btn-acid mt-4 w-full px-6 py-3.5 text-[0.7rem] disabled:opacity-60"
                  >
                    {upload.phase === "uploading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.confirmation.uploading}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {booking.slip ? t.confirmation.replaceSlip : t.confirmation.uploadSlip}
                      </>
                    )}
                  </button>

                  {uploadSuccess && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-acid">
                      <CheckCircle2 className="h-4 w-4" />
                      {uploadSuccess}
                    </p>
                  )}
                  {uploadError && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-[#ff7a6b]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {uploadError}
                    </p>
                  )}
                </>
              ) : booking.slip ? (
                <div className="mt-4 flex items-start gap-2.5 text-sm text-mist">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                  <span>
                    {t.confirmation.slipStored}
                    {booking.status === "awaiting_verification"
                      ? ` ${t.confirmation.refreshLater}`
                      : ""}
                  </span>
                </div>
              ) : (
                <p className="mt-4 text-sm text-mist">{t.confirmation.uploadLater}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-ghost px-6 py-3.5 text-[0.7rem]">
          <Home className="h-4 w-4" />
          {t.confirmation.backHome}
        </Link>
        <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
          <Ticket className="h-4 w-4" strokeWidth={2.5} />
          {t.confirmation.bookAnother}
        </Link>
      </div>
    </div>
  );
}
