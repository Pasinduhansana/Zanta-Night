"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";

const PANELS = [
  { index: "01", image: EVENT.images.party, alt: "Dance floor under green lasers" },
  { index: "02", image: EVENT.images.food, alt: "Night food festival grills" },
  { index: "03", image: EVENT.images.lights, alt: "Green laser beams in fog" },
  { index: "04", image: EVENT.images.introCrowd, alt: "Crowd with hands raised in fog" },
];

export default function Experience() {
  const t = useT();
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!root || !viewport || !track || !pin) return;

    const setProgress = (p: number) => {
      if (barRef.current) gsap.set(barRef.current, { scaleX: Math.max(0.03, p) });
      const idx = Math.min(
        PANELS.length,
        Math.max(1, Math.round(p * (PANELS.length - 1)) + 1),
      );
      if (counterRef.current) counterRef.current.textContent = `0${idx} / 0${PANELS.length}`;
      setActive((prev) => (prev === idx - 1 ? prev : idx - 1));
    };

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const distance = () => Math.max(1, track.scrollWidth - viewport.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setProgress(self.progress),
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { x: 0 });
          setProgress(0);
        };
      });

      const onScroll = () => {
        const max = viewport.scrollWidth - viewport.clientWidth;
        setProgress(max > 0 ? viewport.scrollLeft / max : 0);
      };
      viewport.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      setProgress(0);

      return () => viewport.removeEventListener("scroll", onScroll);
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return (
    <section id="experience" ref={rootRef} className="relative overflow-hidden bg-forest/25 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(0,143,85,.2),transparent_75%)]"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
          <span className="kicker text-acid">{t.experience.section}</span>
          <span className="kicker text-mist hidden sm:block">{t.experience.hint}</span>
        </div>
        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2.4rem,6.5vw,5.4rem)] leading-[0.92] tracking-tight">
            {t.experience.headingTop}
            <span className="block text-metallic-sheen">{t.experience.headingBottom}</span>
          </h2>
          <p className="max-w-sm text-mist lg:pb-2">{t.experience.intro}</p>
        </div>
      </div>

      <div ref={pinRef} className="relative mt-10 sm:mt-14">
        <div
          ref={viewportRef}
          className="no-scrollbar h-[74vh] min-h-[440px] snap-x snap-mandatory overflow-x-auto lg:h-[78vh] lg:overflow-hidden"
        >
          <div ref={trackRef} className="flex h-full w-max will-change-transform">
            {PANELS.map((panel, i) => (
              <article
                key={panel.index}
                className={`relative flex h-full w-[88vw] shrink-0 snap-start flex-col border-r border-white/10 md:w-[70vw] lg:w-[64vw] xl:w-[58vw] ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:max-w-[46%]">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="font-display text-[3.4rem] leading-none text-hollow-acid sm:text-[4.4rem]">
                        {panel.index}
                      </span>
                      <span className="chip chip-acid">{t.experience.panels[i].chip}</span>
                    </div>
                    <h3 className="mt-6 text-[clamp(2.2rem,5vw,4rem)] leading-[0.95]">
                      {t.experience.panels[i].title}
                    </h3>
                    <p className="mt-5 max-w-md text-mist sm:text-lg">
                      {t.experience.panels[i].copy(EVENT.time.label, t.event.dateShort)}
                    </p>
                  </div>

                  {i === PANELS.length - 1 && (
                    <Link href="/booking?qty=1" className="btn-acid mt-8 w-fit px-7 py-4 text-[0.72rem]">
                      {t.hero.cta(EVENT.ticket.priceLabel)}
                    </Link>
                  )}
                </div>

                <div className="relative min-h-[45%] flex-1 overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_40%,rgba(0,143,85,.5),rgba(0,26,20,.85))]"
                  />
                  <Image
                    src={panel.image}
                    alt={panel.alt}
                    fill
                    sizes="(max-width: 1024px) 88vw, 58vw"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div
                    aria-hidden
                    className={`absolute inset-0 bg-[linear-gradient(to_${i % 2 === 1 ? "left" : "right"},rgba(0,26,20,.88),transparent_55%)]`}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-5 sm:px-8">
          <div className="mb-2.5 flex items-center justify-between">
            <span
              ref={counterRef}
              className="rounded-full border border-white/15 bg-abyss/70 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.24em] text-acid backdrop-blur-sm"
            >
              01 / 0{PANELS.length}
            </span>
            <span className="hidden text-[0.6rem] uppercase tracking-[0.3em] text-mist sm:block">
              {active === PANELS.length - 1 ? t.experience.endOfStrip : t.experience.keepScrolling}
            </span>
          </div>
          <div className="h-[3px] w-full bg-white/12">
            <div ref={barRef} className="h-full origin-left scale-x-[0.03] bg-acid" />
          </div>
        </div>
      </div>
    </section>
  );
}
