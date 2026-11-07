"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  LogIn,
  RefreshCw,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import type { BookingPublic, BookingStatus } from "@/lib/validation";

type Stats = {
  byStatus: Record<string, number>;
  totalBookings: number;
  activeQty: number;
  remaining: number;
  capacity: number;
};

const STATUS_FILTERS: (BookingStatus | "all")[] = [
  "all",
  "awaiting_verification",
  "pending",
  "confirmed",
  "checked_in",
  "rejected",
  "expired",
];

const STATUS_BADGE: Record<string, string> = {
  pending: "border-mist/40 text-mist",
  awaiting_verification: "border-[#ffc53d]/60 text-[#ffc53d]",
  confirmed: "border-acid/60 text-acid",
  checked_in: "border-volt/60 text-volt",
  rejected: "border-[#ff7a6b]/60 text-[#ff7a6b]",
  expired: "border-white/15 text-mist/60",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  awaiting_verification: "Slip in",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  rejected: "Rejected",
  expired: "Expired",
};

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [draftToken, setDraftToken] = useState("");
  const [bookings, setBookings] = useState<BookingPublic[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [slipView, setSlipView] = useState<{ ref: string; url: string } | null>(null);

  const load = useCallback(async (activeToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/bookings${filter === "all" ? "" : `?status=${filter}`}`,
        { headers: { "x-admin-token": activeToken }, cache: "no-store" },
      );
      const data = (await res.json()) as {
        ok: boolean;
        bookings?: BookingPublic[];
        stats?: Stats;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem("zanta-admin-token");
          setUnlocked(false);
        }
        setError(data.error ?? "Failed to load bookings.");
        return;
      }
      setBookings(data.bookings ?? []);
      setStats(data.stats ?? null);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const saved = sessionStorage.getItem("zanta-admin-token");
    if (!saved) return;
    const timer = window.setTimeout(() => {
      setToken(saved);
      setUnlocked(true);
      void load(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    const next = draftToken.trim();
    if (!next) return;
    sessionStorage.setItem("zanta-admin-token", next);
    setToken(next);
    setUnlocked(true);
    setDraftToken("");
    void load(next);
  };

  const doAction = async (ref: string, action: "confirm" | "reject" | "checkin") => {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Reason shown to the guest:", "Slip could not be verified.") ?? undefined;
      if (reason === null) return;
    }
    setActionBusy(`${ref}:${action}`);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ action, reason }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      await load(token);
    } catch {
      setError("Network error.");
    } finally {
      setActionBusy(null);
    }
  };

  const viewSlip = async (ref: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(ref)}/slip`, {
        headers: { "x-admin-token": token },
      });
      if (!res.ok) {
        setError("No slip found for this booking.");
        return;
      }
      const blob = await res.blob();
      setSlipView({ ref, url: URL.createObjectURL(blob) });
    } catch {
      setError("Could not load slip.");
    }
  };

  const exportCsv = () => {
    const header = [
      "Reference",
      "Name",
      "Email",
      "Phone",
      "Quantity",
      "Total",
      "Status",
      "Created",
      "Reject reason",
    ];
    const rows = bookings.map((b) =>
      [
        b.reference,
        b.fullName,
        b.email,
        b.phone,
        String(b.quantity),
        String(b.total),
        b.status,
        b.createdAt,
        b.rejectReason ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
    const csv = [header.map(csvEscape).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "zanta-night-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const visible = bookings.filter((b) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      b.reference.toLowerCase().includes(q) ||
      b.fullName.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q)
    );
  });

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-32">
        <form onSubmit={unlock} className="border border-white/12 bg-forest/50 p-7">
          <span className="kicker text-acid">Restricted</span>
          <h1 className="mt-3 text-4xl">ADMIN ACCESS</h1>
          <p className="mt-3 text-sm text-mist">
            Enter the admin token from <code className="text-acid">ADMIN_TOKEN</code> in{" "}
            <code className="text-acid">.env.local</code>.
          </p>
          <input
            type="password"
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder="Admin token"
            className="mt-5 w-full border border-white/15 bg-abyss/70 px-4 py-3.5 text-bone outline-none focus:border-acid"
          />
          {error && <p className="mt-3 text-sm text-[#ff7a6b]">{error}</p>}
          <button type="submit" className="btn-acid mt-5 w-full px-6 py-3.5 text-[0.7rem]">
            <LogIn className="h-4 w-4" />
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="kicker text-acid">ZANTA EVENTS</span>
          <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] leading-none">BOOKING CONTROL</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a href="/admin/scan" className="btn-acid px-4 py-2.5 text-[0.62rem]">
            <ScanLine className="h-3.5 w-3.5" />
            Scanner
          </a>
          <button type="button" onClick={() => load(token)} className="btn-ghost px-4 py-2.5 text-[0.62rem]">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
          <button type="button" onClick={exportCsv} className="btn-ghost px-4 py-2.5 text-[0.62rem]">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-white/10 bg-forest/40 p-4">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
            Capacity
          </p>
          <p className="mt-2 font-display text-3xl leading-none">
            {stats?.remaining ?? "—"}
            <span className="text-lg text-mist"> / {stats?.capacity ?? "—"}</span>
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-mist/70">
            tickets remaining
          </p>
        </div>
        <div className="border border-white/10 bg-forest/40 p-4">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
            Awaiting verification
          </p>
          <p className="mt-2 font-display text-3xl leading-none text-[#ffc53d]">
            {stats?.byStatus.awaiting_verification ?? 0}
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-mist/70">
            slips to review
          </p>
        </div>
        <div className="border border-white/10 bg-forest/40 p-4">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
            Confirmed
          </p>
          <p className="mt-2 font-display text-3xl leading-none text-acid">
            {stats?.byStatus.confirmed ?? 0}
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-mist/70">
            paid &amp; verified
          </p>
        </div>
        <div className="border border-white/10 bg-forest/40 p-4">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist">
            Checked in
          </p>
          <p className="mt-2 font-display text-3xl leading-none text-volt">
            {stats?.byStatus.checked_in ?? 0}
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-mist/70">
            through the door
          </p>
        </div>
      </div>

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`border px-3.5 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
              filter === f
                ? "border-acid bg-acid/10 text-acid"
                : "border-white/15 text-mist hover:border-white/40"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f] ?? f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 border border-white/15 bg-abyss/60 px-3.5 py-2">
          <Search className="h-3.5 w-3.5 text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, name, phone…"
            className="w-44 bg-transparent text-sm text-bone outline-none placeholder:text-mist/50 sm:w-56"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 border border-[#ff7a6b]/40 bg-[#ff7a6b]/10 px-4 py-3 text-sm text-[#ffb3aa]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* table */}
      <div className="mt-5 overflow-x-auto border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-forest/60">
            <tr className="text-[0.55rem] uppercase tracking-[0.24em] text-mist">
              <th className="px-4 py-3.5">Reference</th>
              <th className="px-4 py-3.5">Guest</th>
              <th className="px-4 py-3.5">Qty / Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Slip</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.reference} className="border-t border-white/8 hover:bg-forest/30">
                <td className="px-4 py-3.5">
                  <p className="font-bold tracking-wider text-acid">{b.reference}</p>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-mist/70">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium text-bone">{b.fullName}</p>
                  <p className="text-xs text-mist">
                    {b.email} · {b.phone}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-bone">
                    {b.quantity} × LKR {b.unitPrice}
                  </p>
                  <p className="font-display text-lg leading-none text-acid">
                    LKR {b.total.toLocaleString("en-US")}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block border px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.16em] ${
                      STATUS_BADGE[b.status] ?? "border-white/15 text-mist"
                    }`}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                  {b.rejectReason && (
                    <p className="mt-1 max-w-[160px] text-[0.62rem] text-[#ff7a6b]/85">
                      {b.rejectReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {b.slip ? (
                    <button
                      type="button"
                      onClick={() => viewSlip(b.reference)}
                      className="inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-acid hover:text-acid"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  ) : (
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mist/50">
                      none
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap justify-end gap-2">
                    {(b.status === "pending" ||
                      b.status === "awaiting_verification" ||
                      b.status === "rejected") && (
                      <>
                        <button
                          type="button"
                          disabled={actionBusy === `${b.reference}:confirm`}
                          onClick={() => doAction(b.reference, "confirm")}
                          className="inline-flex items-center gap-1.5 border border-acid/60 bg-acid/10 px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-acid transition-colors hover:bg-acid/20 disabled:opacity-50"
                        >
                          {actionBusy === `${b.reference}:confirm` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Confirm
                        </button>
                        {b.status !== "pending" || b.slip ? (
                          <button
                            type="button"
                            disabled={actionBusy === `${b.reference}:reject`}
                            onClick={() => doAction(b.reference, "reject")}
                            className="inline-flex items-center gap-1.5 border border-[#ff7a6b]/50 px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#ff7a6b] transition-colors hover:bg-[#ff7a6b]/10 disabled:opacity-50"
                          >
                            {actionBusy === `${b.reference}:reject` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            Reject
                          </button>
                        ) : null}
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={actionBusy === `${b.reference}:checkin`}
                        onClick={() => doAction(b.reference, "checkin")}
                        className="inline-flex items-center gap-1.5 border border-volt/60 bg-volt/10 px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-volt transition-colors hover:bg-volt/20 disabled:opacity-50"
                      >
                        {actionBusy === `${b.reference}:checkin` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LogIn className="h-3.5 w-3.5" />
                        )}
                        Check in
                      </button>
                    )}
                    {b.status === "checked_in" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-volt">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Done
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mist">
                  No bookings match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* slip modal */}
      {slipView && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-abyss/92 p-5 backdrop-blur-sm"
          onClick={() => {
            URL.revokeObjectURL(slipView.url);
            setSlipView(null);
          }}
        >
          <div
            className="max-h-[86vh] w-full max-w-2xl overflow-hidden border border-acid/40 bg-forest"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <span className="kicker text-acid">{slipView.ref}</span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(slipView.url);
                  setSlipView(null);
                }}
                className="text-mist transition-colors hover:text-acid"
                aria-label="Close slip"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* blob URLs cannot use next/image optimization */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slipView.url}
              alt={`Payment slip for ${slipView.ref}`}
              className="max-h-[74vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
