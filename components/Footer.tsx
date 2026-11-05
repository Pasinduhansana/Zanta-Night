"use client";

import Link from "next/link";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";

export default function Footer() {
  const t = useT();
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-abyss">
      <div className="mx-auto w-full max-w-[1400px] px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-3xl leading-none">
              ZANTA <span className="text-acid">NIGHT</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              {t.footer.blurb(
                t.event.subtitle,
                t.event.dateShort,
                EVENT.time.label,
                EVENT.organizer,
              )}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <p className="kicker text-acid">{t.footer.explore}</p>
            <ul className="mt-4 space-y-2.5">
              {EVENT.nav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-mist transition-colors hover:text-acid"
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/booking" className="text-sm text-mist transition-colors hover:text-acid">
                  {t.footer.bookTickets}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="kicker text-acid">{t.footer.lineup}</p>
            <ul className="mt-4 space-y-2.5">
              {EVENT.performers.map((p) => (
                <li key={p.slug} className="text-sm text-mist">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kicker text-acid">{t.footer.mainSponsors}</p>
            <ul className="mt-4 space-y-2.5">
              {EVENT.sponsors.map((s) => (
                <li key={s.name} className="text-sm text-mist">
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.62rem] uppercase tracking-[0.24em] text-mist/70">
            © {EVENT.organizer} · {EVENT.name}
          </p>
          <p className="text-[0.62rem] uppercase tracking-[0.24em] text-mist/70">
            {t.footer.venueYear(
              EVENT.venue.statusLabel,
              EVENT.date.year ? t.event.yearConfirmed : t.event.yearPending,
            )}
          </p>
        </div>
      </div>

      <div aria-hidden className="relative select-none overflow-hidden">
        <p className="translate-y-[18%] whitespace-nowrap text-center font-display text-[clamp(4rem,15.5vw,15rem)] leading-[0.75] text-hollow opacity-30">
          ZANTA NIGHT
        </p>
      </div>
    </footer>
  );
}
