import { Camera, Flame, Car, Star } from "lucide-react";
import { EVENT } from "@/lib/event-config";

const ICONS = [Camera, Flame, Car];

export default function Sponsors() {
  return (
    <section id="sponsors" className="relative border-y border-white/10 bg-abyss py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
          <span className="kicker text-acid">04 — Partners</span>
          <span className="kicker text-mist">Organizer &amp; main sponsors</span>
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="kicker text-mist">Organized by</span>
            <p className="mt-3 flex items-center gap-4 text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.9] font-display tracking-tight text-metallic">
              {EVENT.organizer}
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-mist lg:pb-4">
            Backed by three main partners covering the photography, fireworks and
            transport side of the night.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {EVENT.sponsors.map((sponsor, i) => {
            const Icon = ICONS[i] ?? Star;
            return (
              <div
                key={sponsor.name}
                className="group flex flex-col justify-between gap-8 border border-white/10 bg-forest/40 p-6 transition-all duration-500 hover:border-acid/50 hover:bg-forest/70"
              >
                <div className="flex items-start justify-between">
                  <Icon
                    className="h-6 w-6 text-mist transition-colors duration-500 group-hover:text-acid"
                    strokeWidth={1.5}
                  />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-mist/70">
                    0{i + 1}
                  </span>
                </div>
                <div>
                  <p className="font-display text-[1.55rem] leading-[1.05] uppercase text-bone sm:text-[1.7rem]">
                    {sponsor.name}
                  </p>
                  <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
                    <span className="h-1 w-1 rotate-45 bg-acid" />
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-mist">
                      {sponsor.role}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
