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
        const cards = gridRef.current.querySelectorAll("[data-card]");
        gsap.from(cards, {
          y: 90,
          opacity: 0,
          rotate: 2,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.14,
          scrollTrigger: { trigger: gridRef.current, start: "top 82%" },
        });
        gsap.from(gridRef.current.querySelectorAll("[data-card-image]"), {
          y: 42,
          scale: 0.88,
          duration: 1.3,
          ease: "power3.out",
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

      <div className="relative w-full px-8 sm:px-14 lg:px-20">
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

        <div ref={gridRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(19rem,auto)]">
          {EVENT.performers.map((artist, artistIndex) => (
            <article
              key={artist.slug}
              data-card
              className={`card-sheen group relative flex min-h-[30rem] flex-col overflow-hidden border border-white/10 bg-forest/70 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-acid/60 ${
                artistIndex === 0 ? "lg:col-span-2 lg:row-span-2 lg:min-h-[39rem]" : ""
              }`}
            >
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <Image
                  src={artist.backgroundImage}
                  alt=""
                  fill
                  aria-hidden
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
                <Image
                  src={artist.image}
                  alt={`${artist.name} — festival performer`}
                  fill
                  data-card-image
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain object-bottom px-7 pt-7 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <span className="absolute left-5 top-4 font-display text-[3.6rem] leading-none text-hollow-acid opacity-80 transition-transform duration-500 group-hover:-translate-y-1">
                  {artist.index}
                </span>
                <span className="absolute right-4 top-4 rounded-full border border-acid/50 bg-abyss/60 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-acid backdrop-blur-sm">
                  {t.event.dec25Short}
                </span>
              </div>

              <div className="relative border-t border-white/15 bg-abyss/80 px-5 py-5 backdrop-blur-sm">
                <span className="kicker text-acid">{t.lineup.performer}</span>
                <h3 className="mt-2 text-[clamp(2rem,4vw,3.8rem)] leading-[0.9] text-bone transition-transform duration-500 group-hover:-translate-y-1">
                  {artist.name}
                </h3>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
                  <p className="text-[0.78rem] uppercase tracking-[0.18em] text-mist">
                    {t.lineup.lines[artist.slug]}
                  </p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-acid transition-transform duration-500 group-hover:rotate-45" />
                </div>
              </div>
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

      <div className="relative mt-12 w-full px-8 text-center sm:px-14 lg:px-20">
        <Link href="/booking?qty=1" className="btn-acid px-7 py-4 text-[0.72rem]">
          {t.lineup.beThere(EVENT.ticket.priceLabel)}
        </Link>
      </div>
    </section>
  );
}
