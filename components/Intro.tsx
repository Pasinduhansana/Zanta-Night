"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";
import { Ticket } from "lucide-react";

export default function Intro() {
  const t = useT();
  const statement = t.intro.statement;
  const rootRef = useRef<HTMLElement | null>(null);
  const wordsRef = useRef<HTMLSpanElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (wordsRef.current) {
        gsap.fromTo(
          wordsRef.current.querySelectorAll("span"),
          { opacity: 0.13, y: 14 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            stagger: 0.35,
            scrollTrigger: {
              trigger: wordsRef.current,
              start: "top 82%",
              end: "bottom 55%",
              scrub: 0.6,
            },
          },
        );
      }

      if (plateRef.current) {
        gsap.from(plateRef.current, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: { trigger: plateRef.current, start: "top 85%" },
        });
        gsap.to(plateRef.current.querySelector("img"), {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: plateRef.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      }

      if (sideRef.current) {
        gsap.from(sideRef.current, {
          y: 90,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: sideRef.current, start: "top 92%" },
        });
        gsap.to(sideRef.current.querySelector("img"), {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: sideRef.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="intro" ref={rootRef} className="grain relative overflow-hidden py-24 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_0%,rgba(0,143,85,.22),transparent_70%)]"
      />

      <div className="relative w-full px-8 sm:px-14 lg:px-20">
        <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
          <span className="kicker text-acid">{t.intro.section}</span>
          <span className="kicker text-mist">
            {EVENT.time.label} · {t.event.dateShort}
          </span>
        </div>

        <h2 className="mt-10 max-w-[16ch] text-[clamp(2.4rem,6.4vw,5.6rem)] leading-[0.95] tracking-tight sm:max-w-none">
          <span className="sr-only">{statement}</span>
          <span ref={wordsRef} aria-hidden className="block">
            {statement.split(" ").map((word, i) => (
              <span key={`${word}-${i}`} className="mr-[0.28em] inline-block will-change-transform">
                <span
                  className={
                    i >= statement.split(" ").length - 3
                      ? "text-metallic-sheen"
                      : i === 1
                        ? "text-hollow"
                        : "text-bone"
                  }
                >
                  {word}
                </span>
              </span>
            ))}
          </span>
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col justify-between gap-8 lg:col-span-5">
            <div className="space-y-5 text-mist">
              <p className="text-lg leading-relaxed text-bone/90 sm:text-xl">
                {t.intro.para1(EVENT.name)}
              </p>
              <p className="leading-relaxed">
                {t.intro.para2(EVENT.performers.map((p) => p.name).join(", "), t.event.dateShort)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="chip">{t.intro.chipFood}</span>
              <span className="chip">{t.intro.chipDj}</span>
              <span className="chip">{t.intro.chipNight}</span>
              <span className="chip chip-acid">{t.intro.chipEntry(EVENT.ticket.priceLabel)}</span>
            </div>

            <Link href="/booking?qty=1" className="btn-acid w-fit px-7 py-4 text-[0.72rem]">
              <Ticket className="h-4 w-4" strokeWidth={2.5} />
              {t.intro.secure}
            </Link>
          </div>

          <div className="relative lg:col-span-7">
            <div
              ref={plateRef}
              className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-forest"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_30%,rgba(0,143,85,.5),transparent_70%)]"
              />
              <Image
                src={EVENT.images.introCrowd}
                alt="Crowd dancing in green stage fog"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="relative object-cover will-change-transform"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,26,20,.85),transparent_55%)]"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <p className="font-display text-2xl leading-none sm:text-3xl">
                  {t.intro.doors}
                  <span className="mt-2 block text-acid">{t.intro.until}</span>
                </p>
                <span className="chip chip-acid">{EVENT.venue.statusLabel}</span>
              </div>
            </div>

            <div
              ref={sideRef}
              className="relative -mt-16 ml-auto w-[62%] max-w-xs overflow-hidden border border-white/10 bg-forest sm:-mt-24 sm:max-w-sm lg:-ml-24 lg:-mt-28 lg:w-[46%]"
            >
              <div className="relative aspect-square">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(70%_70%_at_60%_40%,rgba(182,255,0,.28),transparent_70%)]"
                />
                <Image
                  src={EVENT.images.food}
                  alt="Night food festival grills"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="relative object-cover will-change-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <p className="absolute bottom-3 left-4 kicker text-acid">{t.intro.streetFood}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
