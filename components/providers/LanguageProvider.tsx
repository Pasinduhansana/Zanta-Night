"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { en, type Dict } from "@/lib/i18n/en";
import { si } from "@/lib/i18n/si";

export const LANGS = ["en", "si"] as const;
export type Lang = (typeof LANGS)[number];

const STORAGE_KEY = "zanta-lang";
const CHANGE_EVENT = "zanta-lang-change";
const dictionaries: Record<Lang, Dict> = { en, si };

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

const getSnapshot = (): Lang => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "si" ? "si" : "en";
  } catch {
    return "en";
  }
};

const getServerSnapshot = (): Lang => "en";

type LangContextValue = { t: Dict; lang: Lang; setLang: (next: Lang) => void };

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((next: Lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — session-only switch */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LangContextValue = { t: dictionaries[lang], lang, setLang };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx.lang;
}

export function useSetLang(): (next: Lang) => void {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useSetLang must be used inside <LanguageProvider>");
  return ctx.setLang;
}

export function useT(): Dict {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT must be used inside <LanguageProvider>");
  return ctx.t;
}
