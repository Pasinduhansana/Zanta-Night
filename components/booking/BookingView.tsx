"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Ticket, AlertTriangle } from "lucide-react";
import {
  bookingSchema,
  type BookingFormValues,
  type BookingInput,
} from "@/lib/validation";
import { EVENT } from "@/lib/event-config";
import { useT } from "@/components/providers/LanguageProvider";

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

  const serverErrorText = (() => {
    if (!serverError) return null;
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

  const onSubmit = async (values: BookingInput) => {
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
    <div className="mx-auto w-full max-w-[1400px] px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
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
                {...register("email")}
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
            disabled={submitting || soldOut}
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
