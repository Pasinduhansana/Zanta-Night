"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { EVENT, bookingHref } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";
import { CalendarDays, Clock, MapPin, Minus, Plus, Ticket, Users } from "lucide-react";

export default function TicketsSection() {
  const t = useT();
  const rootRef = useRef<HTMLElement | null>(null);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState<{ remaining: number; capacity: number } | null>(null);
  const total = EVENT.ticket.price * qty;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/event", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { ok: boolean; remaining?: number; capacity?: number }) => {
        if (!cancelled && data.ok) {
          setStock({ remaining: data.remaining ?? 0, capacity: data.capacity ?? 0 });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-ticket-panel]", {
        y: 70,
        opacity: 0,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: root, start: "top 78%" },
      });
      gsap.from("[data-ticket-fade]", {
        y: 34,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const details = [
    {
      icon: CalendarDays,
      label: t.tickets.details.date,
      value: `${t.event.dateShort}${EVENT.date.year ? ` ${EVENT.date.year}` : ""}`,
    },
    { icon: Clock, label: t.tickets.details.time, value: EVENT.time.label },
    { icon: MapPin, label: t.tickets.details.venue, value: EVENT.venue.statusLabel },
    { icon: Users, label: t.tickets.details.entry, value: t.event.category },
  ];

  return (
    <section id="tickets" ref={rootRef} className="grain relative overflow-hidden py-24 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_100%,rgba(0,143,85,.28),transparent_72%)]"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
          <span className="kicker text-acid">{t.tickets.section}</span>
          <span className="kicker text-mist">{t.event.category}</span>
        </div>

        <div
          data-ticket-panel
          className="mt-10 grid overflow-hidden border border-white/12 bg-forest/50 backdrop-blur-sm lg:grid-cols-[1.25fr_1fr]"
        >
          {/* left — offer */}
          <div className="relative p-7 sm:p-10 lg:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(182,255,0,.1),transparent_65%)]"
            />
            <div className="relative">
              <span className="kicker text-acid">{t.tickets.generalEntry}</span>
              <p className="mt-4 font-display text-[clamp(4rem,12vw,9rem)] leading-[0.85] text-metallic">
                {EVENT.ticket.priceLabel}
              </p>
              <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-acid">
                {t.tickets.gateNote(EVENT.ticket.gatePriceLabel, t.event.dateShort)}
              </p>
              <p className="mt-4 max-w-md text-mist">
                {t.tickets.priceNote(
                  EVENT.name,
                  t.event.subtitle,
                  t.event.dateShort,
                  EVENT.time.label,
                )}
              </p>

              <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                {details.map((d) => (
                  <div key={d.label} className="flex items-start gap-3.5 bg-forest/80 p-4">
                    <d.icon className="mt-0.5 h-4 w-4 shrink-0 text-acid" strokeWidth={1.8} />
                    <div>
                      <p className="text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-mist">
                        {d.label}
                      </p>
                      <p className="mt-1 text-sm font-medium uppercase tracking-wide text-bone">
                        {d.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right — selector */}
          <div
            data-ticket-fade
            className="relative border-t border-white/12 bg-abyss/70 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12"
          >
            <div className="flex items-center justify-between">
              <span className="kicker text-mist">{t.tickets.quantity}</span>
              <span className="text-[0.62rem] uppercase tracking-[0.22em] text-mist/70">
                {t.tickets.maxPerBooking(EVENT.ticket.maxPerOrder)}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label={t.tickets.decrease}
                className="grid h-12 w-12 place-items-center border border-white/20 text-bone transition-colors hover:border-acid hover:text-acid disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-bone"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[3ch] text-center font-display text-5xl leading-none text-bone tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(EVENT.ticket.maxPerOrder, q + 1))}
                disabled={qty >= EVENT.ticket.maxPerOrder}
                aria-label={t.tickets.increase}
                className="grid h-12 w-12 place-items-center border border-white/20 text-bone transition-colors hover:border-acid hover:text-acid disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-bone"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="ml-auto text-right">
                <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-mist">
                  {t.tickets.total}
                </span>
                <span className="font-display text-3xl leading-none text-acid tabular-nums">
                  LKR {total.toLocaleString("en-US")}
                </span>
              </span>
            </div>

            <div className="my-7 border-t border-dashed border-white/20" />

            <ul className="space-y-2.5 text-[0.82rem] text-mist">
              {[
                t.tickets.bulletAccess(t.event.category),
                t.tickets.bulletRef,
                EVENT.date.year
                  ? t.tickets.bulletCountdown(t.event.dateShort, String(EVENT.date.year))
                  : t.tickets.bulletYear,
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rotate-45 bg-acid" />
                  {line}
                </li>
              ))}
            </ul>

            <Link href={bookingHref(qty)} className="btn-acid mt-8 w-full px-7 py-4 text-[0.75rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              {t.tickets.continue(`LKR ${total.toLocaleString("en-US")}`)}
            </Link>
            <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.2em] text-mist/60">
              {t.tickets.payNote}
            </p>
            {stock && (
              <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.2em] text-mist">
                <span className={stock.remaining <= 20 ? "text-[#ffc53d]" : "text-acid"}>
                  {stock.remaining}
                </span>{" "}
                {t.tickets.remaining(stock.capacity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
