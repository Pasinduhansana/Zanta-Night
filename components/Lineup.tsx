"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";
import { ArrowUpRight } from "lucide-react";

export default function Lineup() {
  const t = useT();
  const rootRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (headRef.current) {
        gsap.from(headRef.current.children, {
          y: 46,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: headRef.current, start: "top 84%" },
        });
      }
      if (gridRef.current) {
        gsap.from(gridRef.current.querySelectorAll("[data-card]"), {
          y: 90,
          opacity: 0,
          rotate: 1.5,
          duration: 1.15,
          ease: "power4.out",
          stagger: 0.14,
          scrollTrigger: { trigger: gridRef.current, start: "top 82%" },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  const marqueeItems = [
    ...EVENT.performers.map((p) => p.name),
    `${EVENT.date.shortLabel}`,
    EVENT.subtitle.toUpperCase(),
    `${EVENT.ticket.priceLabel} ENTRY`,
  ];

  return (
    <section id="lineup" ref={rootRef} className="grain relative overflow-hidden py-24 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_10%_20%,rgba(0,143,85,.18),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div ref={headRef}>
          <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
            <span className="kicker text-acid">{t.lineup.section}</span>
            <span className="kicker text-mist">{t.lineup.count}</span>
          </div>

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[0.9] tracking-tight">
              {t.lineup.headingTop}
              <span className="block text-metallic-sheen">{t.lineup.headingBottom}</span>
            </h2>
            <p className="max-w-sm text-mist lg:pb-3">
              {t.lineup.intro(EVENT.performers.map((p) => p.name).join(", "))}
            </p>
          </div>
        </div>

        <div ref={gridRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT.performers.map((artist) => (
            <article
              key={artist.slug}
              data-card
              className="card-sheen group relative aspect-[3/4] overflow-hidden border border-white/10 bg-forest transition-colors duration-500 hover:border-acid/60"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_25%,rgba(0,143,85,.55),rgba(0,26,20,.9))]"
              />
              <Image
                src={artist.image}
                alt={`${artist.name} — stylized festival silhouette`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover opacity-80 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07] group-hover:opacity-100"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,26,20,.95)_6%,rgba(0,26,20,.35)_45%,rgba(0,45,32,.2))]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-jade/0 mix-blend-color transition-colors duration-500 group-hover:bg-jade/25"
              />

              <span className="absolute left-5 top-4 font-display text-[3.6rem] leading-none text-hollow-acid opacity-70 transition-opacity duration-500 group-hover:opacity-100">
                {artist.index}
              </span>

              <div className="absolute inset-x-5 bottom-5">
                <span className="kicker text-acid">{t.lineup.performer}</span>
                <h3 className="mt-2 text-[clamp(2rem,4vw,2.9rem)] leading-[0.95] text-bone transition-transform duration-500 group-hover:-translate-y-1">
                  {artist.name}
                </h3>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
                  <p className="text-[0.78rem] uppercase tracking-[0.18em] text-mist">
                    {t.lineup.lines[artist.slug]}
                  </p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-acid transition-transform duration-500 group-hover:rotate-45" />
                </div>
              </div>

              <span
                aria-hidden
                className="absolute right-4 top-4 rounded-full border border-acid/40 bg-abyss/70 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-acid backdrop-blur-sm"
              >
                {t.event.dec25Short}
              </span>
            </article>
          ))}
        </div>
      </div>

      <div className="relative mt-16 overflow-hidden border-y border-white/10 bg-forest/40 py-4">
        <div className="marquee-track gap-8">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-8 pr-8">
              {marqueeItems.map((item, i) => (
                <span key={`${dup}-${i}`} className="flex items-center gap-8">
                  <span className="font-display text-2xl tracking-wide text-bone sm:text-3xl">
                    {item}
                  </span>
                  <span className="h-1.5 w-1.5 rotate-45 bg-acid" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-12 w-full max-w-[1400px] px-5 text-center sm:px-8">
        <Link href="/booking?qty=1" className="btn-acid px-7 py-4 text-[0.72rem]">
          {t.lineup.beThere(EVENT.ticket.priceLabel)}
        </Link>
      </div>
    </section>
  );
}
