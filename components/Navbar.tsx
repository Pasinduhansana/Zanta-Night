"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Ticket } from "lucide-react";
import { EVENT } from "@/lib/event-config";
import {
  LANGS,
  useLang,
  useSetLang,
  useT,
  type Lang,
} from "@/components/providers/LanguageProvider";

const LANG_LABELS: Record<Lang, string> = { en: "EN", si: "සිං" };

function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const setLang = useSetLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center border border-white/15 bg-forest/40 ${className}`}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`px-2.5 py-2 text-[0.65rem] font-semibold tracking-[0.14em] transition-colors ${
            lang === code ? "bg-acid text-abyss" : "text-mist hover:text-bone"
          }`}
        >
          {LANG_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 32,
    () => false,
  );

  // Close the menu when the route changes (render-phase adjustment).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-abyss/85 backdrop-blur-xl border-b border-white/10 py-3"
            : "bg-transparent py-5 border-b border-transparent",
        ].join(" ")}
      >
        <nav className="flex w-full items-center justify-between px-8 sm:px-14 lg:px-20">
          <Link href="/#home" aria-label={`${EVENT.name} home`} className="group flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-[1.7rem] leading-none tracking-tight text-bone transition-colors group-hover:text-acid">
              ZANTA
            </span>
            <span className="font-display text-2xl sm:text-[1.7rem] leading-none tracking-tight text-acid">
              NIGHT
            </span>
          </Link>

          <div className="hidden items-center gap-9 lg:flex">
            {EVENT.nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="link-underline text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-mist transition-colors hover:text-bone"
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LangSwitch className="hidden sm:flex" />
            <Link
              href="/booking"
              className="btn-acid hidden px-5 py-2.5 text-[0.68rem] sm:inline-flex"
            >
              <Ticket className="h-3.5 w-3.5" strokeWidth={2.5} />
              {t.nav.getTickets}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              className="grid h-10 w-10 place-items-center border border-white/15 bg-forest/40 text-bone transition-colors hover:border-acid hover:text-acid lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-abyss/97 backdrop-blur-2xl" onClick={close} />
            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full flex-col justify-center gap-2 px-7 pt-16"
            >
              <span className="kicker mb-6 text-jade">{t.nav.menu}</span>
              {EVENT.nav.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={close}
                    className="group flex items-baseline gap-4 border-b border-white/8 py-4 font-display text-5xl uppercase text-bone transition-colors hover:text-acid"
                  >
                    <span className="font-sans text-[0.6rem] tracking-[0.3em] text-jade">
                      0{i + 1}
                    </span>
                    {t.nav[item.key]}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-col items-stretch gap-4"
              >
                <Link
                  href="/booking"
                  onClick={close}
                  className="btn-acid w-full px-6 py-4 text-xs"
                >
                  <Ticket className="h-4 w-4" strokeWidth={2.5} />
                  {t.nav.getTicketsFrom(EVENT.ticket.priceLabel)}
                </Link>
                <LangSwitch className="self-start" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
