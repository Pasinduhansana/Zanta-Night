"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BadgeCheck, Loader2, Mail, Ticket, AlertTriangle } from "lucide-react";
import {
  bookingSchema,
  type BookingFormValues,
  type BookingInput,
  type BookingPublic,
  type BookingStatus,
} from "@/lib/validation";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";
import type { Dict } from "@/lib/i18n/en";

type ServerErrorState = {
  code?: string;
  status?: number;
  message?: string;
  data?: Record<string, unknown>;
};

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="kicker text-mist">{label}</span>
        {hint && !error && (
          <span className="text-[0.58rem] uppercase tracking-[0.18em] text-mist/50">{hint}</span>
        )}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs text-[#ff7a6b]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "mt-2 w-full border border-white/15 bg-abyss/60 px-4 py-3.5 text-bone placeholder:text-mist/40 outline-none transition-colors focus:border-acid focus:bg-abyss/90";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PURCHASE_STATUS: Record<
  BookingStatus,
  { key: keyof Dict["confirmation"]["status"]; cls: string }
> = {
  pending: { key: "pending", cls: "border-mist/40 text-mist bg-mist/5" },
  awaiting_verification: {
    key: "awaiting",
    cls: "border-[#ffc53d]/55 text-[#ffc53d] bg-[#ffc53d]/8",
  },
  confirmed: { key: "confirmed", cls: "border-acid/55 text-acid bg-acid/8" },
  checked_in: { key: "checkedIn", cls: "border-volt/55 text-volt bg-volt/8" },
  rejected: { key: "rejected", cls: "border-[#ff7a6b]/55 text-[#ff7a6b] bg-[#ff7a6b]/8" },
  expired: { key: "expired", cls: "border-mist/25 text-mist bg-mist/5" },
};

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function verifyErrorText(
  t: Dict,
  code: string | undefined,
  status: number | undefined,
  retryAfter?: number,
): string {
  const e = t.booking.verify.errors;
  switch (code) {
    case "invalidEmail":
      return e.invalidEmail;
    case "cooldown":
      return e.cooldown(retryAfter || 60);
    case "rateLimited":
      return e.rateLimited;
    case "sendFailed":
      return e.sendFailed;
    case "expired":
      return e.expired;
    case "tooMany":
      return e.tooMany;
    case "notFound":
      return e.notFound;
    case "network":
      return e.network;
    case "emailVerification":
      return e.unverified;
    case "emailMismatch":
      return e.mismatch;
    default:
      if (status === 500 || status === 503) return e.server;
      return e.server;
  }
}

export default function BookingView() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQty = Math.min(
    Math.max(Number(searchParams.get("qty")) || 1, 1),
    EVENT.ticket.maxPerOrder,
  );

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ServerErrorState | null>(null);
  const [stock, setStock] = useState<{ remaining: number; capacity: number } | null>(null);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<{
    email: string;
    bookings: BookingPublic[];
  } | null>(null);

  const messagesRef = useRef(t.booking.errors);
  useEffect(() => {
    messagesRef.current = t.booking.errors;
  }, [t]);

  const resolver = useMemo<Resolver<BookingFormValues, unknown, BookingInput>>(
    () => (values, context, options) =>
      zodResolver(bookingSchema(messagesRef.current))(values, context, options),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/event", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { ok: boolean; remaining?: number; capacity?: number }) => {
        if (!cancelled && data.ok) {
          setStock({ remaining: data.remaining ?? 0, capacity: data.capacity ?? 0 });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // A session from a previous sign-in/verification auto-verifies the matching email.
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok?: boolean; email?: string }>) : null))
      .then((data) => {
        if (!cancelled && data?.ok && data.email) setSessionEmail(data.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const soldOut = stock !== null && stock.remaining <= 0;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingFormValues, unknown, BookingInput>({
    resolver,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      quantity: initialQty,
      notes: "",
    },
    mode: "onBlur",
  });

  const watchedQuantity = useWatch({ control, name: "quantity" });
  const quantity = Number(watchedQuantity || 1) || 1;
  const total = EVENT.ticket.price * quantity;

  const watchedEmail = useWatch({ control, name: "email" });
  const normalizedEmail = String(watchedEmail ?? "").trim().toLowerCase();
  const sessionVerified = sessionEmail !== null && normalizedEmail === sessionEmail;
  const otpVerified = verifiedEmail !== null && verifiedEmail === normalizedEmail;
  const isVerified = sessionVerified || otpVerified;
  const showPurchases =
    isVerified && purchases?.email === normalizedEmail && purchases.bookings.length > 0;

  // Cooldown ticker for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Load the prior purchases for the verified email (session-scoped API).
  useEffect(() => {
    if (!isVerified) return;
    if (purchases?.email === normalizedEmail) return;
    let cancelled = false;
    void fetch("/api/my/tickets", { cache: "no-store" })
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{
              ok?: boolean;
              email?: string;
              bookings?: BookingPublic[];
            }>)
          : null,
      )
      .then((data) => {
        if (
          !cancelled &&
          data?.ok &&
          data.email === normalizedEmail &&
          Array.isArray(data.bookings)
        ) {
          setPurchases({ email: normalizedEmail, bookings: data.bookings });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isVerified, normalizedEmail, purchases]);

  const serverErrorText = (() => {
    if (!serverError) return null;
    if (serverError.code === "emailVerification") {
      return t.booking.verify.errors.unverified;
    }
    if (serverError.code === "emailMismatch") {
      return t.booking.verify.errors.mismatch;
    }
    if (serverError.code === "capacity") {
      return t.booking.capacity(Number(serverError.data?.remaining ?? 0));
    }
    if (serverError.code === "network") return t.booking.networkError;
    if (serverError.code === "validation") return t.booking.validationFailed;
    if (serverError.code === "server" || serverError.status === 500) {
      return t.booking.genericError;
    }
    return serverError.message || t.booking.genericError;
  })();

  const refreshSession = async () => {
    try {
      const r = await fetch("/api/auth/session", { cache: "no-store" });
      const d = r.ok ? ((await r.json()) as { ok?: boolean; email?: string }) : null;
      setSessionEmail(d?.ok && d.email ? d.email : null);
    } catch {
      setSessionEmail(null);
    }
  };

  const sendOtp = async () => {
    if (!EMAIL_RE.test(normalizedEmail)) {
      setOtpError(t.booking.verify.errors.invalidEmail);
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose: "booking" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        retryAfter?: number;
      };
      if (!res.ok || !data.ok) {
        setOtpError(verifyErrorText(t, data.code, res.status, data.retryAfter));
        if (data.code === "cooldown" && data.retryAfter) setCooldown(data.retryAfter);
        return;
      }
      setOtpSentTo(normalizedEmail);
      setOtpCode("");
      setOtpStep(true);
      setCooldown(data.retryAfter ?? 60);
    } catch {
      setOtpError(t.booking.verify.errors.network);
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    const value = otpCode.replace(/\D/g, "");
    if (value.length !== 6) return;
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpSentTo, code: value }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        attemptsLeft?: number;
      };
      if (!res.ok || !data.ok) {
        if (typeof data.attemptsLeft === "number") {
          setOtpError(t.booking.verify.errors.invalid(data.attemptsLeft));
        } else {
          setOtpError(verifyErrorText(t, data.code, res.status));
        }
        if (data.code === "expired" || data.code === "tooMany" || data.code === "notFound") {
          setOtpCode("");
        }
        return;
      }
      // The session cookie now proves ownership of otpSentTo.
      setVerifiedEmail(otpSentTo);
      setSessionEmail(otpSentTo);
      setOtpStep(false);
      setOtpCode("");
      setOtpError(null);
    } catch {
      setOtpError(t.booking.verify.errors.network);
    } finally {
      setOtpBusy(false);
    }
  };

  const onSubmit = async (values: BookingInput) => {
    if (!isVerified) {
      setServerError({ code: "emailVerification" });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as {
        ok: boolean;
        booking?: { reference: string };
        error?: string;
        code?: string;
        data?: Record<string, unknown>;
      };
      if (!res.ok || !data.ok || !data.booking) {
        if (data.code === "emailVerification" || data.code === "emailMismatch") {
          // Session no longer matches the form — resync so the verify UI returns.
          setVerifiedEmail(null);
          setSessionEmail(null);
          void refreshSession();
        }
        setServerError({
          code: data.code,
          status: res.status,
          message: data.error,
          data: data.data,
        });
        return;
      }
      router.push(`/confirmation?ref=${encodeURIComponent(data.booking.reference)}`);
    } catch {
      setServerError({ code: "network" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-8 pb-24 pt-32 sm:px-14 lg:px-20 sm:pt-36">
      <Link
        href="/#tickets"
        className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-mist transition-colors hover:text-acid"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t.booking.back}
      </Link>

      <div className="mt-7 border-b border-white/10 pb-8">
        <span className="kicker text-acid">{t.booking.step}</span>
        <h1 className="mt-3 text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.9]">
          {t.booking.headingTop}
          <span className="block text-metallic-sheen">{t.booking.headingBottom}</span>
        </h1>
      </div>

      {/* previous purchases for a returning buyer — form fields stay intact */}
      {showPurchases && purchases && (
        <div className="mt-8 border border-acid/30 bg-forest/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
            <span className="kicker text-acid">{t.booking.purchases.title}</span>
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-mist/70">
              {normalizedEmail}
            </span>
          </div>
          <p className="px-5 pt-3 text-sm text-mist">{t.booking.purchases.note}</p>
          <div className="space-y-2 p-4">
            {purchases.bookings.map((b) => {
              const status = PURCHASE_STATUS[b.status];
              return (
                <div
                  key={b.reference}
                  className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-abyss/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-lg tracking-wider text-acid">
                      {b.reference}
                    </span>
                    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-mist">
                      {t.confirmation.qty(b.quantity)}
                    </span>
                    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-mist/70">
                      {shortDate(b.createdAt)}
                    </span>
                    <span className="text-sm font-medium text-bone tabular-nums">
                      LKR {b.total.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] ${status.cls}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {t.confirmation.status[status.key].label}
                    </span>
                    <Link
                      href={`/confirmation?ref=${encodeURIComponent(b.reference)}`}
                      className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-mist transition-colors hover:text-acid"
                    >
                      {t.auth.tickets.openBooking}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {serverErrorText && (
            <p className="flex items-center gap-2.5 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {serverErrorText}
            </p>
          )}
          {soldOut && (
            <p className="flex items-center gap-2.5 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t.booking.soldOut}
            </p>
          )}

          <Field label={t.booking.fields.fullName} error={errors.fullName?.message}>
            <input
              type="text"
              autoComplete="name"
              placeholder={t.booking.fields.fullNamePlaceholder}
              className={inputClass}
              {...register("fullName")}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={t.booking.fields.email} error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder={t.booking.fields.emailPlaceholder}
                className={inputClass}
                {...register("email", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const next = e.target.value.trim().toLowerCase();
                    if (next !== otpSentTo) {
                      setOtpStep(false);
                      setOtpCode("");
                      setOtpError(null);
                    }
                  },
                })}
              />
            </Field>
            <Field
              label={t.booking.fields.phone}
              error={errors.phone?.message}
              hint={t.booking.fields.phoneHint}
            >
              <input
                type="tel"
                autoComplete="tel"
                placeholder={t.booking.fields.phonePlaceholder}
                className={inputClass}
                {...register("phone")}
              />
            </Field>
          </div>

          {/* email verification — sits below the details, never resets them */}
          <div className="border border-white/12 bg-abyss/40 px-4 py-3.5">
            {isVerified ? (
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <BadgeCheck className="h-5 w-5 text-acid" strokeWidth={2.5} />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-acid">
                  {t.booking.verify.verified}
                </span>
                <span className="text-mist">{normalizedEmail}</span>
              </div>
            ) : otpStep ? (
              <div className="space-y-3">
                <p className="text-sm text-mist">
                  {t.booking.verify.codeSentTo(otpSentTo)}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError(null);
                    }}
                    placeholder={t.booking.verify.codePlaceholder}
                    maxLength={6}
                    className="w-40 border border-white/15 bg-abyss/60 px-4 py-3 text-center font-display text-xl tracking-[0.4em] text-bone outline-none transition-colors focus:border-acid"
                  />
                  <button
                    type="button"
                    onClick={() => void confirmOtp()}
                    disabled={otpBusy || otpCode.length !== 6}
                    className="btn-acid px-5 py-3 text-[0.68rem] disabled:opacity-60"
                  >
                    {otpBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                    {otpBusy ? t.booking.verify.confirming : t.booking.verify.confirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (cooldown <= 0) void sendOtp();
                    }}
                    disabled={otpBusy || cooldown > 0}
                    className="btn-ghost px-4 py-3 text-[0.62rem] disabled:opacity-60"
                  >
                    {cooldown > 0
                      ? t.booking.verify.resendIn(cooldown)
                      : t.booking.verify.resend}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setOtpCode("");
                      setOtpError(null);
                    }}
                    className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-mist transition-colors hover:text-acid"
                  >
                    {t.booking.verify.changeEmail}
                  </button>
                </div>
                {otpError && (
                  <p className="flex items-center gap-1.5 text-xs text-[#ff7a6b]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {otpError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void sendOtp()}
                  disabled={otpBusy || !normalizedEmail}
                  className="btn-ghost px-5 py-3 text-[0.65rem] disabled:opacity-60"
                >
                  {otpBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {otpBusy ? t.booking.verify.sending : t.booking.verify.verifyEmail}
                </button>
                <span className="text-[0.6rem] uppercase tracking-[0.16em] text-mist/60">
                  {t.booking.verify.hint}
                </span>
                {otpError && (
                  <p className="flex w-full items-center gap-1.5 text-xs text-[#ff7a6b]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {otpError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label={t.booking.fields.tickets}
              error={errors.quantity?.message}
              hint={t.booking.fields.ticketsHint(EVENT.ticket.maxPerOrder)}
            >
              <select className={inputClass} {...register("quantity")}>
                {Array.from({ length: EVENT.ticket.maxPerOrder }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} className="bg-abyss">
                    {t.booking.fields.ticketOption(n)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={t.booking.fields.notes}
              error={errors.notes?.message}
              hint={t.booking.fields.notesHint}
            >
              <textarea
                rows={3}
                placeholder={t.booking.fields.notesPlaceholder}
                className={`${inputClass} resize-none`}
                {...register("notes")}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting || soldOut || !isVerified}
            className="btn-acid w-full px-7 py-4 text-[0.75rem] disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.booking.reserving}
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" strokeWidth={2.5} />
                {t.booking.submit(`LKR ${total.toLocaleString("en-US")}`)}
              </>
            )}
          </button>

          {!isVerified && (
            <p className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-[#ffc53d]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t.booking.verify.required}
            </p>
          )}

          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-mist/60">
            {t.booking.payNote}
          </p>
        </form>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-white/12 bg-forest/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <span className="kicker text-acid">{t.booking.summaryTitle}</span>
              <span className="kicker text-mist">{t.event.category}</span>
            </div>

            <div className="space-y-3.5 px-5 py-5 text-sm">
              {[
                [t.booking.rows.event, `${EVENT.name} — ${t.event.subtitle}`],
                [
                  t.booking.rows.date,
                  `${t.event.dateShort}${EVENT.date.year ? ` ${EVENT.date.year}` : ""}`,
                ],
                [t.booking.rows.time, EVENT.time.label],
                [t.booking.rows.venue, EVENT.venue.statusLabel],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-6">
                  <span className="text-mist">{k}</span>
                  <span className="text-right font-medium uppercase tracking-wide text-bone">
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-white/20 px-5 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-mist">
                  {EVENT.ticket.priceLabel} × {quantity}
                </span>
                <span className="tabular-nums text-bone">LKR {total.toLocaleString("en-US")}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-abyss/60 px-5 py-4">
              <span className="kicker text-mist">{t.booking.total}</span>
              <span className="font-display text-3xl leading-none text-acid tabular-nums">
                LKR {total.toLocaleString("en-US")}
              </span>
            </div>
            <p className="border-t border-white/10 px-5 py-3 text-[0.6rem] uppercase tracking-[0.18em] text-acid/90">
              {t.booking.gateNote(EVENT.ticket.gatePriceLabel, t.event.dateShort)}
            </p>
            {stock && (
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[0.62rem] uppercase tracking-[0.18em] text-mist">
                <span>{t.booking.ticketsLeft}</span>
                <span className={stock.remaining <= 20 ? "text-[#ffc53d]" : "text-bone"}>
                  {stock.remaining} / {stock.capacity}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 border border-white/10 bg-abyss/50 p-5">
            <p className="kicker text-mist">{t.booking.whatNext}</p>
            <ol className="mt-3 space-y-2 text-[0.8rem] text-mist">
              {t.booking.steps.map((step, i) => (
                <li key={step}>
                  {i + 1} — {step}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
