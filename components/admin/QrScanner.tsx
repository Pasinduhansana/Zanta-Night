"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  AlertTriangle,
  Ban,
  Camera,
  CheckCircle2,
  KeyRound,
  Lock,
  ScanLine,
  StopCircle,
} from "lucide-react";

type Stats = { total: number; used: number; remaining: number };
type Ticket = {
  ticketId: string;
  bookingRef: string;
  guestName: string;
  seatIndex: number;
  status: string;
  issuedAt: string;
  usedAt: string | null;
};
type Outcome = { kind: "valid" | "used" | "invalid"; ticket?: Ticket | null };

const KIND_STYLE: Record<Outcome["kind"], { border: string; text: string; label: string }> = {
  valid: { border: "border-acid", text: "text-acid", label: "VALID" },
  used: { border: "border-[#ffc53d]", text: "text-[#ffc53d]", label: "ALREADY USED" },
  invalid: { border: "border-[#ff7a6b]", text: "text-[#ff7a6b]", label: "INVALID" },
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function QrScanner() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [draftToken, setDraftToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const busyRef = useRef(false);

  const loadStats = useCallback(async (activeToken: string) => {
    try {
      const res = await fetch("/api/admin/scan", {
        headers: { "x-admin-token": activeToken },
        cache: "no-store",
      });
      const data = (await res.json()) as { ok: boolean; stats?: Stats };
      if (res.status === 401) {
        sessionStorage.removeItem("zanta-admin-token");
        setUnlocked(false);
        return;
      }
      if (res.ok && data.ok && data.stats) setStats(data.stats);
    } catch {
      setError("Could not load scanner stats.");
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("zanta-admin-token");
    if (!saved) return;
    const timer = window.setTimeout(() => {
      setToken(saved);
      setUnlocked(true);
      void loadStats(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  const stopCamera = () => {
    pausedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => {
    return () => {
      pausedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    const next = draftToken.trim();
    if (!next) return;
    sessionStorage.setItem("zanta-admin-token", next);
    setToken(next);
    setUnlocked(true);
    setDraftToken("");
    void loadStats(next);
  };

  const relock = () => {
    stopCamera();
    sessionStorage.removeItem("zanta-admin-token");
    setToken("");
    setUnlocked(false);
    setOutcome(null);
    setStats(null);
    setError(null);
  };

  const submit = async (rawId: string, method: "camera" | "manual") => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    pausedRef.current = true;
    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ticketId: rawId, method }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        outcome?: Outcome["kind"];
        ticket?: Ticket | null;
        stats?: Stats;
        error?: string;
      };
      if (res.status === 401) {
        relock();
        return;
      }
      if (!res.ok || !data.ok || !data.outcome) {
        setError(data.error ?? "Scan failed — try again.");
        pausedRef.current = false;
        if (videoRef.current && streamRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
        return;
      }
      setOutcome({ kind: data.outcome, ticket: data.ticket ?? null });
      if (data.stats) setStats(data.stats);
      if (data.outcome !== "invalid") setManualId("");
    } catch {
      setError("Network error — try again.");
      pausedRef.current = false;
      if (videoRef.current && streamRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const tick = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || pausedRef.current) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const canvas = canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const code = jsQR(frame.data, w, h, { inversionAttempts: "attemptBoth" });
      if (code?.data) {
        void submit(code.data, "camera");
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    setCameraError(null);
    setOutcome(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraOn(true);
      pausedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError("Camera unavailable — allow camera access or use manual entry.");
    }
  };

  const resume = () => {
    setOutcome(null);
    if (streamRef.current && videoRef.current) {
      pausedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
        <form onSubmit={unlock} className="border border-white/12 bg-forest/50 p-7">
          <span className="kicker text-acid">Restricted</span>
          <h1 className="mt-3 text-4xl">ENTRY SCANNER</h1>
          <p className="mt-3 text-sm text-mist">
            Enter the admin token from <code className="text-acid">ADMIN_TOKEN</code>.
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
            <KeyRound className="h-4 w-4" />
            Unlock scanner
          </button>
        </form>
      </div>
    );
  }

  const style = outcome ? KIND_STYLE[outcome.kind] : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6">
      {/* header + remaining counter */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="kicker text-acid">ZANTA EVENTS</span>
          <h1 className="mt-1.5 text-2xl leading-none">ENTRY SCANNER</h1>
        </div>
        <button
          type="button"
          onClick={relock}
          className="btn-ghost px-3 py-2 text-[0.6rem]"
          aria-label="Lock scanner"
        >
          <Lock className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-px border border-white/10 bg-white/10 text-center">
        <div className="bg-forest/70 px-2 py-3">
          <p className="font-display text-3xl leading-none text-acid tabular-nums">
            {stats ? stats.remaining : "—"}
          </p>
          <p className="mt-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-mist">
            Left to scan
          </p>
        </div>
        <div className="bg-forest/70 px-2 py-3">
          <p className="font-display text-3xl leading-none tabular-nums">
            {stats ? stats.used : "—"}
          </p>
          <p className="mt-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-mist">
            Scanned
          </p>
        </div>
        <div className="bg-forest/70 px-2 py-3">
          <p className="font-display text-3xl leading-none tabular-nums">
            {stats ? stats.total : "—"}
          </p>
          <p className="mt-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-mist">
            Issued
          </p>
        </div>
      </div>

      {/* result or viewfinder */}
      <div className="mt-4">
        {outcome && style ? (
          <div className={`border-2 ${style.border} bg-forest/60 p-6 text-center`}>
            {outcome.kind === "valid" && (
              <CheckCircle2 className={`mx-auto h-14 w-14 ${style.text}`} />
            )}
            {outcome.kind === "used" && (
              <AlertTriangle className={`mx-auto h-14 w-14 ${style.text}`} />
            )}
            {outcome.kind === "invalid" && <Ban className={`mx-auto h-14 w-14 ${style.text}`} />}
            <p className={`mt-3 font-display text-[clamp(2rem,9vw,3rem)] leading-none ${style.text}`}>
              {style.label}
            </p>
            {outcome.ticket && (
              <div className="mt-5 space-y-2 text-left">
                <Row label="Ticket" value={outcome.ticket.ticketId} mono />
                <Row label="Guest" value={outcome.ticket.guestName} />
                <Row label="Booking" value={outcome.ticket.bookingRef} mono />
                <Row label="Seat" value={`${outcome.ticket.seatIndex}`} />
                {outcome.kind === "used" && (
                  <>
                    <Row label="First scanned" value={formatTime(outcome.ticket.usedAt)} />
                    <Row label="Issued" value={formatTime(outcome.ticket.issuedAt)} />
                  </>
                )}
                {outcome.kind === "valid" && (
                  <Row label="Scanned" value={formatTime(new Date().toISOString())} />
                )}
              </div>
            )}
            {outcome.kind === "invalid" && (
              <p className="mt-4 text-sm text-mist">
                Ticket does not exist or is not approved.
              </p>
            )}
            <button
              type="button"
              onClick={resume}
              className="btn-acid mt-6 w-full px-6 py-4 text-[0.7rem]"
            >
              <ScanLine className="h-4 w-4" />
              {outcome.kind === "invalid" ? "Try again" : "Scan next"}
            </button>
          </div>
        ) : (
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover ${cameraOn ? "" : "opacity-0"}`}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <Camera className="h-10 w-10 text-mist/60" />
                <p className="px-6 text-sm text-mist">
                  Start the camera to scan a ticket QR code, or enter the ID manually below.
                </p>
              </div>
            )}
            {cameraOn && (
              <div className="pointer-events-none absolute inset-6 border border-acid/40" />
            )}
          </div>
        )}
      </div>

      {cameraError && <p className="mt-3 text-sm text-[#ffc53d]">{cameraError}</p>}
      {error && <p className="mt-3 text-sm text-[#ff7a6b]">{error}</p>}

      {/* camera toggle */}
      {!outcome && (
        <button
          type="button"
          onClick={() => (cameraOn ? stopCamera() : void startCamera())}
          className={`mt-3 w-full px-6 py-4 text-[0.7rem] ${cameraOn ? "btn-ghost" : "btn-acid"}`}
        >
          {cameraOn ? (
            <>
              <StopCircle className="h-4 w-4" />
              Stop camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Start scanner
            </>
          )}
        </button>
      )}

      {/* manual entry */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = manualId.trim();
          if (!value || busy) return;
          void submit(value, "manual");
        }}
        className="mt-4 border border-white/10 bg-forest/40 p-4"
      >
        <label
          htmlFor="manual-ticket-id"
          className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-mist"
        >
          Manual ticket ID
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="manual-ticket-id"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="ZNT-XXXXXXXXXXXX"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 border border-white/15 bg-abyss/70 px-3 py-3 font-mono text-sm uppercase text-bone outline-none focus:border-acid"
          />
          <button
            type="submit"
            disabled={busy || !manualId.trim()}
            className="btn-acid shrink-0 px-5 py-3 text-[0.65rem] disabled:opacity-50"
          >
            {busy ? "…" : "Validate"}
          </button>
        </div>
      </form>

      <p className="mt-auto pt-6 text-center text-[0.55rem] uppercase tracking-[0.24em] text-mist/50">
        One ticket · one person · one scan
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-white/10 pb-1.5">
      <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-mist">
        {label}
      </span>
      <span
        className={`text-sm text-bone ${mono ? "font-mono tracking-wide" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
