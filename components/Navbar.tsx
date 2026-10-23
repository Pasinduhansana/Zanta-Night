"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Ticket } from "lucide-react";
import { EVENT } from "@/lib/event-config";

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
        <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
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
                key={item.label}
                href={item.href}
                className="link-underline text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-mist transition-colors hover:text-bone"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              className="btn-acid hidden px-5 py-2.5 text-[0.68rem] sm:inline-flex"
            >
              <Ticket className="h-3.5 w-3.5" strokeWidth={2.5} />
              Get Tickets
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
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
              <span className="kicker mb-6 text-jade">Menu</span>
              {EVENT.nav.map((item, i) => (
                <motion.div
                  key={item.label}
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
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <Link
                  href="/booking"
                  onClick={close}
                  className="btn-acid w-full px-6 py-4 text-xs"
                >
                  <Ticket className="h-4 w-4" strokeWidth={2.5} />
                  Get Tickets — {EVENT.ticket.priceLabel}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
