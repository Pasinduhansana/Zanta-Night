"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Ticket,
} from "lucide-react";
import type { BookingPublic, BookingStatus } from "@/lib/validation";
import { useT } from "@/components/providers/LanguageProvider";
import QrCode from "@/components/QrCode";
import type { Dict } from "@/lib/i18n/en";

type MyTicket = {
  ticketId: string;
  bookingRef: string;
  seatIndex: number;
  status: string;
  issuedAt: string;
  usedAt: string | null;
};

type Payload = {
  email: string;
  bookings: BookingPublic[];
  tickets: MyTicket[];
};

type State =
  | { status: "loading" }
  | { status: "unauth" }
  | { status: "error"; message?: string }
  | { status: "ready"; data: Payload };

type PaymentUi = { label: string; className: string };

function paymentUi(status: BookingStatus, t: Dict): PaymentUi {
  const s = t.auth.tickets.status;
  if (status === "confirmed" || status === "checked_in") {
    return { label: s.approved, className: "border-acid/55 text-acid bg-acid/8" };
  }
  if (status === "rejected" || status === "expired") {
    return { label: s.rejected, className: "border-[#ff7a6b]/55 text-[#ff7a6b] bg-[#ff7a6b]/8" };
  }
  return { label: s.pending, className: "border-mist/40 text-mist bg-mist/5" };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function fetchMine(): Promise<State> {
  try {
    const res = await fetch("/api/my/tickets", { cache: "no-store" });
    if (res.status === 401) return { status: "unauth" };
    const data = (await res.json()) as {
      ok: boolean;
      email?: string;
      bookings?: BookingPublic[];
      tickets?: MyTicket[];
      error?: string;
    };
    if (!res.ok || !data.ok || !data.email || !data.bookings || !data.tickets) {
      return { status: "error", message: data.error };
    }
    return {
      status: "ready",
      data: { email: data.email, bookings: data.bookings, tickets: data.tickets },
    };
  } catch {
    return { status: "error" };
  }
}

export default function MyTicketsView() {
  const t = useT();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const next = await fetchMine();
    if (next.status === "unauth") {
      router.replace("/login");
      return;
    }
    setState(next);
  }, [router]);

  useEffect(() => {
    let alive = true;
    void fetchMine().then((next) => {
      if (!alive) return;
      if (next.status === "unauth") {
        router.replace("/login");
        return;
      }
      setState(next);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Session cookie is cleared server-side on success; ignore network errors.
    }
    router.replace("/login");
  };

  if (state.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 pt-40 pb-24 sm:px-8">
        <div className="flex items-center gap-3 text-mist">
          <Loader2 className="h-4 w-4 animate-spin text-acid" />
          <span className="kicker">{t.auth.tickets.loading}</span>
        </div>
        <div className="skeleton mt-6 h-40 w-full" />
        <div className="skeleton mt-4 h-40 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-40 pb-24 sm:px-8">
        <div className="border border-[#ff7a6b]/40 bg-[#ff7a6b]/8 p-8">
          <AlertTriangle className="h-7 w-7 text-[#ff7a6b]" />
          <p className="mt-4 text-mist">
            {state.message || t.auth.tickets.errors.server}
          </p>
          <button
            type="button"
            onClick={load}
            className="btn-ghost mt-6 px-6 py-3.5 text-[0.7rem]"
          >
            <RefreshCw className="h-4 w-4" />
            {t.confirmation.retry}
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "unauth") {
    return null;
  }

  const { email, bookings, tickets } = state.data;
  const ticketsByRef = new Map<string, MyTicket[]>();
  for (const ticket of tickets) {
    const list = ticketsByRef.get(ticket.bookingRef);
    if (list) list.push(ticket);
    else ticketsByRef.set(ticket.bookingRef, [ticket]);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker text-acid">{t.auth.tickets.kicker}</span>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.92]">
            {t.auth.tickets.title}
          </h1>
          <p className="mt-3 text-sm text-mist">{t.auth.tickets.signedInAs(email)}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={load}
            className="btn-ghost mt-11 px-4 py-2.5 text-[0.62rem]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t.confirmation.refresh}
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="btn-ghost mt-11 px-4 py-2.5 text-[0.62rem] disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.auth.tickets.signOut}
          </button>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="mt-10 border border-white/12 bg-forest/40 p-8">
          <Ticket className="h-7 w-7 text-acid" />
          <p className="mt-4 text-mist">{t.auth.tickets.empty}</p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {bookings.map((booking) => {
          const ui = paymentUi(booking.status, t);
          const bookingTickets = ticketsByRef.get(booking.reference) ?? [];
          return (
            <div
              key={booking.reference}
              className="border border-white/12 bg-forest/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-xl tracking-wider text-acid">
                    {booking.reference}
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-[0.2em] text-mist">
                    {t.auth.tickets.qty(booking.quantity)}
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-[0.2em] text-mist/70">
                    {formatDate(booking.createdAt)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-2 border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] ${ui.className}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t.auth.tickets.payment}: {ui.label}
                </span>
              </div>

              {bookingTickets.length > 0 ? (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {bookingTickets.map((ticket) => (
                    <div
                      key={ticket.ticketId}
                      className="border border-white/12 bg-abyss/50 p-4"
                    >
                      <QrCode
                        value={ticket.ticketId}
                        alt={`QR code for ${ticket.ticketId}`}
                        className="mx-auto h-32 w-32 bg-white p-2"
                      />
                      <p className="mt-3 text-center font-display text-sm tracking-wider text-bone">
                        {ticket.ticketId}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[0.58rem] uppercase tracking-[0.2em] text-mist">
                          {t.auth.tickets.seat(ticket.seatIndex)}
                        </span>
                        {ticket.status === "used" ? (
                          <span className="text-[0.58rem] uppercase tracking-[0.16em] text-[#ffc53d]">
                            {t.auth.tickets.used}
                            {ticket.usedAt
                              ? ` · ${formatDateTime(ticket.usedAt)}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-[0.58rem] uppercase tracking-[0.16em] text-acid">
                            {t.auth.tickets.ready}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-4 text-sm text-mist">{t.auth.tickets.notIssued}</p>
              )}

              <div className="border-t border-white/10 px-5 py-3">
                <Link
                  href={`/confirmation?ref=${encodeURIComponent(booking.reference)}`}
                  className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-mist transition-colors hover:text-acid"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.auth.tickets.openBooking}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
