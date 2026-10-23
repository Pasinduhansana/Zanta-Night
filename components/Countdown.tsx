"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EVENT, getEventTarget } from "@/lib/event-config";
import { CalendarDays, Clock, MapPin } from "lucide-react";

type Units = { days: string; hours: string; minutes: string; seconds: string };

function split(ms: number): Units {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days: String(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

const CELLS: { key: keyof Units; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

const subscribeNothing = () => () => {};

function DatePlate() {
  return (
    <div className="w-full max-w-md border border-white/12 bg-forest/50 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="kicker text-acid">Save the date</span>
        <span className="kicker text-mist">Year {EVENT.date.yearStatus}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/10">
        <div className="px-4 py-4">
          <CalendarDays className="mb-2 h-4 w-4 text-acid" />
          <p className="font-display text-2xl leading-none text-bone">{EVENT.date.shortLabel}</p>
          <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-mist">Date</p>
        </div>
        <div className="px-4 py-4">
          <Clock className="mb-2 h-4 w-4 text-acid" />
          <p className="font-display text-2xl leading-none text-bone">3PM—12AM</p>
          <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-mist">Doors open</p>
        </div>
        <div className="px-4 py-4">
          <MapPin className="mb-2 h-4 w-4 text-acid" />
          <p className="font-display text-2xl leading-none text-bone">TBA</p>
          <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-mist">Venue</p>
        </div>
      </div>
      {!EVENT.date.year && (
        <p className="border-t border-white/10 px-4 py-2.5 text-[0.6rem] uppercase tracking-[0.18em] text-mist/80">
          Countdown activates once the year is confirmed
        </p>
      )}
    </div>
  );
}

export default function Countdown() {
  const target = getEventTarget();
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!mounted || !target) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(initial);
    };
  }, [mounted, target]);

  const skeleton = (
    <div className="grid w-full max-w-md grid-cols-4 gap-px border border-white/12 bg-white/10">
      {CELLS.map((cell) => (
        <div key={cell.key} className="skeleton h-[92px]" />
      ))}
    </div>
  );

  if (!target) return <DatePlate />;

  if (!mounted || now === null) return skeleton;

  const diff = target.getTime() - now;
  if (diff <= 0) {
    return (
      <div className="w-full max-w-md border border-acid/50 bg-acid/10 px-5 py-4 backdrop-blur-md">
        <p className="kicker text-acid">The night is live</p>
        <p className="mt-1 font-display text-3xl">ZANTA NIGHT — {EVENT.date.shortLabel}</p>
      </div>
    );
  }

  const units = split(diff);

  return (
    <div className="w-full max-w-md border border-white/12 bg-forest/50 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="kicker text-acid">Countdown</span>
        <span className="kicker text-mist">
          {EVENT.date.shortLabel} · {EVENT.date.year}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-px bg-white/10">
        {CELLS.map((cell) => (
          <div key={cell.key} className="bg-forest/60 px-2 py-3.5 text-center">
            <p className="font-display text-3xl leading-none tabular-nums text-bone sm:text-4xl">
              {units[cell.key]}
            </p>
            <p className="mt-2 text-[0.52rem] font-semibold uppercase tracking-[0.22em] text-mist">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
