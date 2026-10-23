import Link from "next/link";
import { EVENT } from "@/lib/event-config";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-abyss">
      <div className="mx-auto w-full max-w-[1400px] px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-3xl leading-none">
              ZANTA <span className="text-acid">NIGHT</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              {EVENT.subtitle} — {EVENT.date.shortLabel}, {EVENT.time.label}. Presented by{" "}
              {EVENT.organizer}.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <p className="kicker text-acid">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {EVENT.nav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-mist transition-colors hover:text-acid"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/booking" className="text-sm text-mist transition-colors hover:text-acid">
                  Book tickets
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="kicker text-acid">Lineup</p>
            <ul className="mt-4 space-y-2.5">
              {EVENT.performers.map((p) => (
                <li key={p.slug} className="text-sm text-mist">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kicker text-acid">Main sponsors</p>
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
            {EVENT.venue.statusLabel} · Year {EVENT.date.yearStatus}
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
