"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, Ticket } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";
import Countdown from "./Countdown";
import Motes from "./Motes";

const BEAMS = [
  { x: "8%", r1: "-22deg", r2: "-6deg", dur: "11s", delay: "0s", peak: "0.5", w: "2px" },
  { x: "26%", r1: "10deg", r2: "24deg", dur: "13s", delay: "2.4s", peak: "0.38", w: "3px" },
  { x: "58%", r1: "-14deg", r2: "6deg", dur: "9s", delay: "1.1s", peak: "0.55", w: "2px" },
  { x: "74%", r1: "18deg", r2: "34deg", dur: "14s", delay: "3.6s", peak: "0.32", w: "4px" },
  { x: "92%", r1: "-30deg", r2: "-12deg", dur: "12s", delay: "0.7s", peak: "0.42", w: "2px" },
  { x: "40%", r1: "6deg", r2: "20deg", dur: "16s", delay: "4.5s", peak: "0.22", w: "150px", wide: true },
];

function Chars({ text, base, className = "" }: { text: string; base: number; className?: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={`char-rise ${className}`}
          style={{ ["--d" as string]: `${base + i * 0.055}s` }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const t = useT();
  const rootRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (bgRef.current) {
        gsap.to(bgRef.current, {
          yPercent: 16,
          scale: 1.12,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      }
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          yPercent: -8,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={rootRef}
      className="grain relative isolate min-h-[100svh] overflow-hidden"
    >
      {/* ---------------------------------------------------------- backdrop */}
      <div ref={bgRef} className="absolute inset-0 -z-10 origin-center">
        <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_50%_0%,#003826_0%,#001a14_55%,#001009_100%)]" />
        <Image
          src={EVENT.images.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45 mix-blend-luminosity"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,26,20,.72),rgba(0,26,20,.35)_45%,rgba(0,26,20,.96))]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_15%_100%,rgba(0,143,85,.4),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_85%_8%,rgba(182,255,0,.16),transparent_60%)]" />

        {/* atmospheric fog */}
        <div className="fog fog-a left-[-12%] top-[45%] h-[46vh] w-[62vw] bg-jade/30" />
        <div className="fog fog-b right-[-14%] top-[10%] h-[40vh] w-[55vw] bg-[radial-gradient(circle,rgba(182,255,0,.22),transparent_70%)]" />

        {/* laser beams */}
        {BEAMS.map((b, i) => (
          <span
            key={i}
            aria-hidden
            className={`beam ${b.wide ? "beam-wide" : ""}`}
            style={
              {
                "--x": b.x,
                "--r1": b.r1,
                "--r2": b.r2,
                "--dur": b.dur,
                "--delay": b.delay,
                "--peak": b.peak,
                "--w": b.w,
              } as React.CSSProperties
            }
          />
        ))}

        <div className="vignette absolute inset-0" />
      </div>

      <Motes count={40} />

      {/* ----------------------------------------------------------- content */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-between px-5 pb-10 pt-32 sm:px-8 sm:pt-36"
      >
        {/* top row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="chip chip-acid">{t.event.dateShort}</span>
            <span className="chip">{EVENT.time.label}</span>
            <span className="chip hidden sm:inline-flex">{EVENT.venue.statusLabel}</span>
          </div>
          <p className="kicker fade-up text-mist" style={{ ["--d" as string]: "0.1s" }}>
            {t.event.presents(EVENT.organizer)}
          </p>
        </div>

        {/* headline */}
        <div className="py-8">
          <span
            className="kicker fade-up inline-block text-acid"
            style={{ ["--d" as string]: "0.25s" }}
          >
            {t.event.subtitle}
          </span>

          <h1 className="mt-5">
            <span className="sr-only">
              {EVENT.wordmark[0]} {EVENT.wordmark[1]} — {t.event.subtitle}
            </span>
            <span aria-hidden className="block">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block font-display text-[clamp(4rem,17vw,15.5rem)] leading-[0.82] tracking-[-0.015em]">
                  <Chars text="ZANTA" base={0.35} className="text-metallic" />
                </span>
              </span>
              <span className="relative -mt-[0.04em] block overflow-hidden pb-[0.08em] sm:ml-[6vw]">
                <span className="block font-display text-[clamp(4rem,17vw,15.5rem)] leading-[0.82] tracking-[-0.015em] text-hollow">
                  <Chars text="NIGHT" base={0.62} />
                </span>
              </span>
            </span>
          </h1>

          {/* price sticker */}
          <div
            className="fade-up absolute right-4 top-[46%] hidden rotate-[-11deg] lg:block xl:right-12"
            style={{ ["--d" as string]: "1.35s" }}
          >
            <div className="grid h-32 w-32 place-items-center rounded-full border-2 border-abyss bg-acid text-abyss shadow-[0_18px_50px_-14px_rgba(182,255,0,.6)]">
              <div className="text-center leading-none">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.3em]">{t.hero.from}</p>
                <p className="font-display text-[2.1rem] leading-none">LKR</p>
                <p className="font-display text-[2.6rem] leading-none">500</p>
                <p className="mt-1 text-[0.5rem] font-bold uppercase tracking-[0.24em]">
                  {t.event.category}
                </p>
              </div>
            </div>
          </div>

          <div
            className="fade-up mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
            style={{ ["--d" as string]: "1.05s" }}
          >
            <span className="font-display text-[clamp(1rem,2.3vw,1.7rem)] tracking-[0.26em] text-bone">
              {t.event.tagline}
            </span>
            <span aria-hidden className="hidden h-px w-24 bg-acid/70 sm:block" />
          </div>

          <div
            className="fade-up mt-5 flex flex-wrap items-center gap-3"
            style={{ ["--d" as string]: "1.2s" }}
          >
            {EVENT.performers.map((p) => (
              <span key={p.slug} className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-mist">
                {p.name}
                <span className="ml-3 text-acid">/</span>
              </span>
            ))}
          </div>
        </div>

        {/* bottom row */}
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div
            className="fade-up flex flex-col gap-3.5 sm:flex-row"
            style={{ ["--d" as string]: "1.45s" }}
          >
            <Link href="/booking?qty=1" className="btn-acid px-7 py-4 text-[0.72rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              {t.hero.cta(EVENT.ticket.priceLabel)}
            </Link>
            <Link href="/#experience" className="btn-ghost px-7 py-4 text-[0.72rem]">
              {t.hero.explore}
              <ArrowDown className="h-4 w-4" />
            </Link>
          </div>

          <div className="fade-up w-full lg:w-auto" style={{ ["--d" as string]: "1.6s" }}>
            <Countdown />
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div
        aria-hidden
        className="fade-up absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        style={{ ["--d" as string]: "2s" }}
      >
        <span className="text-[0.55rem] uppercase tracking-[0.4em] text-mist">{t.hero.scroll}</span>
        <span className="scroll-cue h-10 w-px bg-gradient-to-b from-acid to-transparent" />
      </div>
    </section>
  );
}
