"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code";

type ApiResponse = {
  ok: boolean;
  retryAfter?: number;
  redirect?: string;
  code?: string;
  error?: string;
  attemptsLeft?: number;
};

function mapError(
  code: string | undefined,
  status: number | undefined,
  message: string | undefined,
  attemptsLeft: number | undefined,
  cooldown: number,
  t: ReturnType<typeof useT>,
): string {
  const e = t.auth.login.errors;
  switch (code) {
    case "invalidEmail":
      return e.invalidEmail;
    case "noBookings":
      return e.noBookings;
    case "cooldown":
      return e.cooldown(cooldown || 60);
    case "rateLimited":
      return e.rateLimited;
    case "sendFailed":
      return e.sendFailed;
    case "expired":
      return e.expired;
    case "invalid":
      return e.invalid(attemptsLeft && attemptsLeft > 0 ? attemptsLeft : 1);
    case "tooMany":
      return e.tooMany;
    case "notFound":
      return e.notFound;
    case "network":
      return e.network;
    default:
      if (status === 500 || status === 503) return e.server;
      return message || e.server;
  }
}

export default function LoginView() {
  const t = useT();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // Already signed in — go straight to the dashboard.
  useEffect(() => {
    let alive = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok?: boolean }>) : null))
      .then((data) => {
        if (alive && data?.ok) router.replace("/tickets");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [router]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setError(
          mapError(data.code, res.status, data.error, undefined, data.retryAfter ?? 60, t),
        );
        if (data.code === "cooldown" && data.retryAfter) setCooldown(data.retryAfter);
        return;
      }
      setEmail(value);
      setStep("code");
      setAttemptsLeft(null);
      setCooldown(data.retryAfter ?? 60);
    } catch {
      setError(t.auth.login.errors.network);
    } finally {
      setBusy(false);
    }
  };

  const onSubmitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError(t.auth.login.errors.invalidEmail);
      return;
    }
    await sendCode(value);
  };

  const onSubmitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = code.replace(/\D/g, "");
    if (value.length !== 6) {
      setError(t.auth.login.errors.invalid(attemptsLeft ?? 1));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        if (typeof data.attemptsLeft === "number") setAttemptsLeft(data.attemptsLeft);
        setError(mapError(data.code, res.status, data.error, data.attemptsLeft, cooldown, t));
        if (data.code === "expired" || data.code === "tooMany" || data.code === "notFound") {
          setCode("");
        }
        return;
      }
      router.push(data.redirect ?? "/tickets");
      router.refresh();
    } catch {
      setError(t.auth.login.errors.network);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "mt-2 w-full border border-white/15 bg-abyss/60 px-4 py-3.5 text-bone placeholder:text-mist/40 outline-none transition-colors focus:border-acid focus:bg-abyss/90";

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-24 pt-40 sm:px-8">
      <span className="kicker text-acid">{t.auth.login.kicker}</span>
      <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.92]">
        {t.auth.login.title}
      </h1>
      <p className="mt-4 max-w-md text-mist">{t.auth.login.subtitle}</p>

      {error && (
        <p className="mt-6 flex items-start gap-2.5 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={onSubmitEmail} noValidate className="mt-7 space-y-6">
          <label className="block">
            <span className="kicker text-mist">{t.auth.login.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={t.auth.login.emailPlaceholder}
              autoComplete="email"
              maxLength={120}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="btn-acid w-full px-6 py-3.5 text-[0.7rem] disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.auth.login.sending}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                {t.auth.login.sendCode}
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitCode} noValidate className="mt-7 space-y-6">
          <div className="border border-white/12 bg-forest/40 px-4 py-3.5 text-sm text-mist">
            {t.auth.login.codeSentTo(email)}
            <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-mist/70">
              {t.auth.login.expiresIn(5)}
              {attemptsLeft !== null ? ` · ${t.auth.login.attemptsLeft(attemptsLeft)}` : ""}
            </span>
          </div>

          <label className="block">
            <span className="kicker text-mist">{t.auth.login.codeLabel}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder={t.auth.login.codePlaceholder}
              maxLength={6}
              className={`${inputClass} text-center font-display text-3xl tracking-[0.5em]`}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="btn-acid w-full px-6 py-3.5 text-[0.7rem] disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.auth.login.verifying}
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                {t.auth.login.verify}
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setAttemptsLeft(null);
              }}
              className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-mist transition-colors hover:text-acid"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.auth.login.changeEmail}
            </button>
            <button
              type="button"
              onClick={() => {
                if (cooldown <= 0) void sendCode(email);
              }}
              disabled={busy || cooldown > 0}
              className="btn-ghost px-4 py-2.5 text-[0.62rem] disabled:opacity-60"
            >
              {cooldown > 0 ? t.auth.login.resendIn(cooldown) : t.auth.login.resend}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
