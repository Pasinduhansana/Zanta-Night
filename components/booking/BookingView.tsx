"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Ticket, AlertTriangle } from "lucide-react";
import { bookingSchema, type BookingFormValues, type BookingInput } from "@/lib/validation";
import { EVENT } from "@/lib/event-config";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQty = Math.min(
    Math.max(Number(searchParams.get("qty")) || 1, 1),
    EVENT.ticket.maxPerOrder,
  );

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stock, setStock] = useState<{ remaining: number; capacity: number } | null>(null);

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
    resolver: zodResolver(bookingSchema),
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
      };
      if (!res.ok || !data.ok || !data.booking) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/confirmation?ref=${encodeURIComponent(data.booking.reference)}`);
    } catch {
      setServerError("Network error — please check your connection and try again.");
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
        Back to tickets
      </Link>

      <div className="mt-7 border-b border-white/10 pb-8">
        <span className="kicker text-acid">Step 01 — Your details</span>
        <h1 className="mt-3 text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.9]">
          BOOK YOUR
          <span className="block text-metallic-sheen">ENTRY</span>
        </h1>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {serverError && (
            <p className="flex items-center gap-2.5 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {serverError}
            </p>
          )}
          {soldOut && (
            <p className="flex items-center gap-2.5 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This event is fully booked right now — no tickets remain.
            </p>
          )}

          <Field label="Full name" error={errors.fullName?.message}>
            <input
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              className={inputClass}
              {...register("fullName")}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Email" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                {...register("email")}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message} hint="WhatsApp friendly">
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+94 7X XXX XXXX"
                className={inputClass}
                {...register("phone")}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Tickets"
              error={errors.quantity?.message}
              hint={`Max ${EVENT.ticket.maxPerOrder}`}
            >
              <select className={inputClass} {...register("quantity")}>
                {Array.from({ length: EVENT.ticket.maxPerOrder }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} className="bg-abyss">
                    {n} {n === 1 ? "ticket" : "tickets"}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes" error={errors.notes?.message} hint="Optional">
              <textarea
                rows={3}
                placeholder="Anything we should know…"
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
                Reserving…
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" strokeWidth={2.5} />
                Confirm booking — LKR {total.toLocaleString("en-US")}
              </>
            )}
          </button>

          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-mist/60">
            Pay by bank or mobile transfer after booking — upload your slip on the
            confirmation page
          </p>
        </form>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-white/12 bg-forest/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <span className="kicker text-acid">Order summary</span>
              <span className="kicker text-mist">{EVENT.ticket.category}</span>
            </div>

            <div className="space-y-3.5 px-5 py-5 text-sm">
              {[
                ["Event", `${EVENT.name} — ${EVENT.subtitle}`],
                ["Date", EVENT.date.shortLabel],
                ["Time", EVENT.time.label],
                ["Venue", EVENT.venue.statusLabel],
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
              <span className="kicker text-mist">Total</span>
              <span className="font-display text-3xl leading-none text-acid tabular-nums">
                LKR {total.toLocaleString("en-US")}
              </span>
            </div>
            {stock && (
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[0.62rem] uppercase tracking-[0.18em] text-mist">
                <span>Tickets left</span>
                <span className={stock.remaining <= 20 ? "text-[#ffc53d]" : "text-bone"}>
                  {stock.remaining} of {stock.capacity}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 border border-white/10 bg-abyss/50 p-5">
            <p className="kicker text-mist">What happens next</p>
            <ol className="mt-3 space-y-2 text-[0.8rem] text-mist">
              <li>1 — You get a unique booking reference.</li>
              <li>2 — Open your confirmation ticket instantly.</li>
              <li>3 — Show the ticket reference at the entrance.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
