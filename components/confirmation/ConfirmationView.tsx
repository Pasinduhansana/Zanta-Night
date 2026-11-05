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
  RefreshCw,
  Ticket,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { EVENT } from "@/lib/event-config";
import type { BookingPublic, BookingStatus, SlipInfo } from "@/lib/validation";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
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

type UploadState = { phase: "idle" | "uploading" | "success" | "error"; message?: string };

const UPLOADABLE: BookingStatus[] = ["pending", "awaiting_verification", "rejected"];

const STATUS_UI: Record<
  BookingStatus,
  { label: string; className: string; blurb: string }
> = {
  pending: {
    label: "Awaiting payment",
    className: "border-mist/40 text-mist bg-mist/5",
    blurb: "Transfer the total below, then upload your payment slip on this page.",
  },
  awaiting_verification: {
    label: "Slip received",
    className: "border-[#ffc53d]/55 text-[#ffc53d] bg-[#ffc53d]/8",
    blurb: "Your slip is in — we're verifying the transfer. Refresh this page for updates.",
  },
  confirmed: {
    label: "Payment confirmed",
    className: "border-acid/55 text-acid bg-acid/8",
    blurb: "You're fully booked in. Show this reference at the entrance.",
  },
  checked_in: {
    label: "Checked in",
    className: "border-volt/55 text-volt bg-volt/8",
    blurb: "Entry recorded — enjoy the night.",
  },
  rejected: {
    label: "Verification failed",
    className: "border-[#ff7a6b]/55 text-[#ff7a6b] bg-[#ff7a6b]/8",
    blurb: "Your slip could not be verified. Fix the issue and upload again.",
  },
  expired: {
    label: "Booking expired",
    className: "border-mist/25 text-mist bg-mist/5",
    blurb: `The ${EVENT.payment.windowHours}-hour payment window passed. You can book again.`,
  },
};

async function fetchBooking(ref: string): Promise<State> {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(ref)}`, { cache: "no-store" });
    const data = (await res.json()) as {
      ok: boolean;
      booking?: BookingPublic;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.booking) {
      return { status: "error", message: data.error ?? "We could not find this booking." };
    }
    return { status: "ready", booking: data.booking };
  } catch {
    return { status: "error", message: "Network error while loading your ticket." };
  }
}

export default function ConfirmationView() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref")?.trim() ?? "";

  const [state, setState] = useState<State>({ status: "loading" });
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [upload, setUpload] = useState<UploadState>({ phase: "idle" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const applyBooking = (booking: BookingPublic) =>
    setState({ status: "ready", booking });

  const handleUpload = async () => {
    if (!pendingFile || !ref) return;
    const file = pendingFile;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUpload({ phase: "error", message: "Only JPG, PNG or WebP images are accepted." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUpload({ phase: "error", message: "File is too large — maximum 5 MB." });
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
      };
      if (!res.ok || !data.ok || !data.booking) {
        setUpload({ phase: "error", message: data.error ?? "Upload failed." });
        return;
      }
      applyBooking(data.booking);
      setUpload({ phase: "success", message: "Slip uploaded — awaiting verification." });
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setUpload({ phase: "error", message: "Network error — please try again." });
    }
  };

  if (!ref) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-40 pb-24 sm:px-8">
        <div className="border border-white/15 bg-forest/40 p-8">
          <AlertTriangle className="h-7 w-7 text-acid" />
          <h1 className="mt-4 text-4xl">No reference found</h1>
          <p className="mt-3 text-mist">
            Open this page from your booking confirmation, or start a new booking.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              New booking
            </Link>
            <Link href="/" className="btn-ghost px-6 py-3.5 text-[0.7rem]">
              <Home className="h-4 w-4" />
              Back to home
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
          <span className="kicker">Loading your ticket…</span>
        </div>
        <div className="skeleton mt-6 h-80 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-40 pb-24 sm:px-8">
        <div className="border border-[#ff7a6b]/40 bg-[#ff7a6b]/8 p-8">
          <AlertTriangle className="h-7 w-7 text-[#ff7a6b]" />
          <h1 className="mt-4 text-4xl">Ticket not found</h1>
          <p className="mt-3 text-mist">{state.message}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={loadBooking} className="btn-ghost px-6 py-3.5 text-[0.7rem]">
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              New booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { booking } = state;
  const ui = STATUS_UI[booking.status];
  const showPayment =
    booking.status !== "confirmed" &&
    booking.status !== "checked_in" &&
    booking.status !== "expired";
  const canUpload = showPayment && UPLOADABLE.includes(booking.status);

  const details: [string, string][] = [
    ["Date", EVENT.date.shortLabel],
    ["Time", EVENT.time.label],
    ["Venue", EVENT.venue.statusLabel],
    ["Tickets", `${booking.quantity} × ${booking.ticketCategory}`],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker text-acid">Booking created</span>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.92]">
            YOUR
            <span className="block text-metallic-sheen">TICKET</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={loadBooking}
          className="btn-ghost mt-11 px-4 py-2.5 text-[0.62rem]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh status
        </button>
      </div>

      <p className="mt-4 max-w-lg text-mist">
        Booking reference{" "}
        <strong className="font-semibold text-acid">{booking.reference}</strong> — keep it for{" "}
        {EVENT.date.shortLabel}.
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
              ? ` Reason: ${booking.rejectReason}`
              : ""}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ stub */}
      <div className="relative mt-7 overflow-hidden border border-acid/30 bg-forest shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-3xl leading-none">
                  ZANTA <span className="text-acid">NIGHT</span>
                </p>
                <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.3em] text-mist">
                  {EVENT.subtitle}
                </p>
              </div>
              <span className={`chip ${booking.status === "confirmed" ? "chip-acid" : ""}`}>
                {booking.ticketCategory}
              </span>
            </div>

            <div className="mt-7 border-t border-dashed border-white/20 pt-6">
              <p className="kicker text-mist">Guest</p>
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
                  Total
                </p>
                <p className="font-display text-4xl leading-none text-acid tabular-nums">
                  LKR {booking.total.toLocaleString("en-US")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                  Status
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
              <div className="barcode h-14 w-full bg-bone" />
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

          <div className="flex w-full flex-col justify-between gap-6 bg-abyss/60 p-6 md:w-56 md:p-7">
            <div>
              <p className="kicker text-acid">Entry stub</p>
              <p className="mt-4 font-display text-4xl leading-[0.95] text-bone">
                {EVENT.date.shortLabel}
              </p>
              <p className="mt-2 text-sm text-mist">{EVENT.time.label}</p>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.22em] text-mist/70">
                {EVENT.venue.statusLabel}
              </p>
            </div>

            <div>
              <div className="barcode h-16 w-full rotate-90 scale-x-[0.55] bg-bone opacity-90" />
              <p className="mt-4 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-acid">
                {booking.reference}
              </p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.2em] text-mist">
                Qty {booking.quantity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- payment & slip */}
      {showPayment && (
        <div className="mt-7 border border-white/12 bg-forest/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
            <span className="kicker text-acid">Payment</span>
            <span className="kicker text-mist">
              {eventInfo?.paymentConfigured
                ? `Upload within ${eventInfo.windowHours}h`
                : "Details to be announced"}
            </span>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
            {/* instructions */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-dashed border-white/15 pb-3">
                <span className="text-sm text-mist">Amount due</span>
                <span className="font-display text-3xl leading-none text-acid tabular-nums">
                  LKR {booking.total.toLocaleString("en-US")}
                </span>
              </div>

              {eventInfo?.paymentConfigured ? (
                <div className="space-y-3 text-sm">
                  <p className="text-mist">
                    Transfer the exact amount, write{" "}
                    <strong className="text-acid">{booking.reference}</strong> as the deposit
                    note, then upload the slip.
                  </p>
                  {eventInfo.payment.bank.accountNumber && (
                    <div className="border border-white/10 bg-abyss/50 px-4 py-3">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
                        Bank transfer
                      </p>
                      <p className="mt-1.5 font-medium text-bone">
                        {eventInfo.payment.bank.name || "Bank"} —{" "}
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
                <p className="text-sm text-mist">
                  Bank &amp; wallet details will be announced shortly — your booking and
                  reference stay valid, upload the slip here once you have paid.
                </p>
              )}
            </div>

            {/* upload */}
            <div className="border border-white/10 bg-abyss/50 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="kicker text-mist">Payment slip</span>
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
                      {pendingFile ? pendingFile.name : "Choose payment slip image"}
                    </span>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-mist/70">
                      JPG, PNG or WebP · max 5 MB
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
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {booking.slip ? "Replace slip" : "Upload slip"}
                      </>
                    )}
                  </button>

                  {upload.phase === "success" && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-acid">
                      <CheckCircle2 className="h-4 w-4" />
                      {upload.message}
                    </p>
                  )}
                  {upload.phase === "error" && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-[#ff7a6b]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {upload.message}
                    </p>
                  )}
                </>
              ) : booking.slip ? (
                <div className="mt-4 flex items-start gap-2.5 text-sm text-mist">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                  <span>
                    Slip uploaded — waiting for verification.{" "}
                    {booking.status === "awaiting_verification" &&
                      "Refresh this page after a while to check the status."}
                  </span>
                </div>
              ) : (
                <p className="mt-4 text-sm text-mist">
                  Upload becomes available once payment details are announced.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-ghost px-6 py-3.5 text-[0.7rem]">
          <Home className="h-4 w-4" />
          Back to home
        </Link>
        <Link href="/booking" className="btn-acid px-6 py-3.5 text-[0.7rem]">
          <Ticket className="h-4 w-4" strokeWidth={2.5} />
          Book another ticket
        </Link>
      </div>
    </div>
  );
}
