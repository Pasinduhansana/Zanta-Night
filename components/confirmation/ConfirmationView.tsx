"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Home, Loader2, RefreshCw, Ticket } from "lucide-react";
import { EVENT } from "@/lib/event-config";
import type { BookingPublic } from "@/lib/validation";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; booking: BookingPublic };

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

  const retry = useCallback(() => {
    if (!ref) return;
    setState({ status: "loading" });
    void fetchBooking(ref).then(setState);
  }, [ref]);

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
            <button type="button" onClick={retry} className="btn-ghost px-6 py-3.5 text-[0.7rem]">
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
  const details: [string, string][] = [
    ["Date", EVENT.date.shortLabel],
    ["Time", EVENT.time.label],
    ["Venue", EVENT.venue.statusLabel],
    ["Tickets", `${booking.quantity} × ${booking.ticketCategory}`],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      <span className="kicker text-acid">Booking confirmed</span>
      <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.92]">
        YOU&apos;RE ON
        <span className="block text-metallic-sheen">THE LIST</span>
      </h1>
      <p className="mt-4 max-w-lg text-mist">
        Your booking reference is{" "}
        <strong className="font-semibold text-acid">{booking.reference}</strong> — keep it
        handy for {EVENT.date.shortLabel}.
      </p>

      {/* ------------------------------------------------------------ stub */}
      <div className="relative mt-9 overflow-hidden border border-acid/30 bg-forest shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col md:flex-row">
          {/* main half */}
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
              <span className="chip chip-acid">{booking.ticketCategory}</span>
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
                <p className="mt-1 inline-flex items-center gap-2 border border-acid/50 bg-acid/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-acid">
                  <span className="h-1.5 w-1.5 rounded-full bg-acid" />
                  {booking.status}
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

          {/* perforation */}
          <div aria-hidden className="relative hidden w-px md:block">
            <span className="perf-line absolute inset-y-0 left-0 w-px" />
            <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-abyss" />
            <span className="absolute -bottom-4 -left-4 h-8 w-8 rounded-full bg-abyss" />
          </div>
          <div className="border-t border-dashed border-white/25 md:hidden" />

          {/* stub */}
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
