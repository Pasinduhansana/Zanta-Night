import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { connectDB, hasBookingForEmail } from "@/lib/booking-service";
import { sendOtpEmail } from "@/lib/auth-email";
import { AuthSession, SESSION_TTL_MS } from "@/lib/models/AuthSession";
import {
  OtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@/lib/models/OtpCode";

export const SESSION_COOKIE = "zanta_session";

/* --------------------------------------------------------------- hashing */

function otpSecret(): string {
  return process.env.OTP_HASH_SECRET || process.env.ADMIN_TOKEN || "zanta-dev-otp-secret";
}

function hashOtp(email: string, code: string): string {
  return createHmac("sha256", otpSecret()).update(`${email}:${code}`).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function validEmail(email: string): boolean {
  return (
    email.length <= 120 &&
    email.length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

/* -------------------------------------------------------- rate limiting */

type HitList = number[];
const globalWithAuthHits = globalThis as typeof globalThis & {
  __zantaAuthHits?: Map<string, HitList>;
};
const authHits: Map<string, HitList> =
  globalWithAuthHits.__zantaAuthHits ?? new Map<string, HitList>();
globalWithAuthHits.__zantaAuthHits = authHits;

function ipAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (authHits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    authHits.set(key, list);
    return false;
  }
  list.push(now);
  authHits.set(key, list);
  if (authHits.size > 5_000) {
    for (const [k, v] of authHits) {
      if (v.every((t) => now - t >= windowMs)) authHits.delete(k);
    }
  }
  return true;
}

/* ------------------------------------------------------------ OTP issue */

export type OtpRequestOk = { ok: true; retryAfter: number };

export type OtpRequestFail = {
  ok: false;
  code:
    | "invalidEmail"
    | "noBookings"
    | "cooldown"
    | "rateLimited"
    | "sendFailed"
    | "unavailable";
  status: number;
  retryAfter?: number;
};

export type OtpRequestResult = OtpRequestOk | OtpRequestFail;

/**
 * `login` requires an existing booking (My Tickets sign-in);
 * `booking` is pre-submit verification for a booking that does not exist yet.
 */
export type OtpPurpose = "login" | "booking";

export async function requestOtp(
  rawEmail: string,
  ip: string,
  purpose: OtpPurpose = "login",
): Promise<OtpRequestResult> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) {
    return { ok: false, code: "invalidEmail", status: 400 };
  }
  if (!ipAllow(`otp:${ip}`, 10, 10 * 60 * 1000)) {
    return { ok: false, code: "rateLimited", status: 429 };
  }

  const conn = await connectDB();
  if (!conn) {
    return { ok: false, code: "unavailable", status: 503 };
  }

  try {
    if (purpose === "login") {
      const hasBooking = await hasBookingForEmail(email);
      if (!hasBooking) {
        return { ok: false, code: "noBookings", status: 404 };
      }
    }

    const now = Date.now();
    const existing = await OtpCode.findOne({ email }).lean();
    if (existing?.lastSentAt) {
      const elapsed = now - new Date(existing.lastSentAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        return {
          ok: false,
          code: "cooldown",
          status: 429,
          retryAfter: Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000)),
        };
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await OtpCode.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          codeHash: hashOtp(email, code),
          expiresAt: new Date(now + OTP_TTL_MS),
          attempts: 0,
          lastSentAt: new Date(now),
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      // Don't leave a cooldown lock behind when the send failed.
      await OtpCode.deleteOne({ email }).catch(() => undefined);
      console.error("[zanta] OTP email failed:", err);
      return { ok: false, code: "sendFailed", status: 502 };
    }

    return { ok: true, retryAfter: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000) };
  } catch (err) {
    console.error("[zanta] request-otp failed:", err);
    return { ok: false, code: "unavailable", status: 503 };
  }
}

/* ------------------------------------------------------------- OTP verify */

export type OtpVerifyOk = { ok: true; email: string; token: string };

export type OtpVerifyFail = {
  ok: false;
  code: "invalidEmail" | "notFound" | "expired" | "invalid" | "tooMany" | "unavailable";
  status: number;
  attemptsLeft?: number;
};

export type OtpVerifyResult = OtpVerifyOk | OtpVerifyFail;

export async function verifyOtp(rawEmail: string, rawCode: string): Promise<OtpVerifyResult> {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode ?? "").trim();
  if (!validEmail(email)) {
    return { ok: false, code: "invalidEmail", status: 400 };
  }
  if (!code || code.length > 12) {
    return { ok: false, code: "invalid", status: 400, attemptsLeft: OTP_MAX_ATTEMPTS };
  }

  const conn = await connectDB();
  if (!conn) {
    return { ok: false, code: "unavailable", status: 503 };
  }

  try {
    const doc = await OtpCode.findOne({ email }).lean();
    if (!doc) {
      return { ok: false, code: "notFound", status: 404 };
    }
    if (new Date(doc.expiresAt).getTime() <= Date.now()) {
      // Keep the document so its lastSentAt still enforces the resend cooldown.
      return { ok: false, code: "expired", status: 400 };
    }
    if (doc.attempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, code: "tooMany", status: 429 };
    }

    const match = safeEqualHex(doc.codeHash, hashOtp(email, code));
    if (!match) {
      const updated = await OtpCode.findOneAndUpdate(
        { email, attempts: { $lt: OTP_MAX_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean();
      const attempts = updated?.attempts ?? OTP_MAX_ATTEMPTS;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        return { ok: false, code: "tooMany", status: 429 };
      }
      return {
        ok: false,
        code: "invalid",
        status: 400,
        attemptsLeft: OTP_MAX_ATTEMPTS - attempts,
      };
    }

    // Consume the code — a verified OTP can never be replayed.
    await OtpCode.deleteOne({ email, codeHash: doc.codeHash }).catch(() => undefined);
    const token = await createSession(email);
    return { ok: true, email, token };
  } catch (err) {
    console.error("[zanta] verify-otp failed:", err);
    return { ok: false, code: "unavailable", status: 503 };
  }
}

/* -------------------------------------------------------------- sessions */

async function createSession(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await AuthSession.create({
    email,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function resolveSession(token: string | null): Promise<{ email: string } | null> {
  if (!token) return null;
  const conn = await connectDB();
  if (!conn) return null;
  try {
    const doc = await AuthSession.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    })
      .select("email")
      .lean();
    return doc ? { email: doc.email } : null;
  } catch (err) {
    console.error("[zanta] session lookup failed:", err);
    return null;
  }
}

export async function revokeSession(token: string | null): Promise<void> {
  if (!token) return;
  const conn = await connectDB();
  if (!conn) return;
  try {
    await AuthSession.deleteOne({ tokenHash: hashToken(token) });
  } catch (err) {
    console.error("[zanta] session revoke failed:", err);
  }
}

/* --------------------------------------------------------------- cookies */

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const match = header.match(/(?:^|;\s*)zanta_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isHttpsRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function buildSessionCookie(token: string, secure: boolean): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    secure ? "; Secure" : ""
  }`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    secure ? "; Secure" : ""
  }`;
}

export function verifyRateAllow(ip: string): boolean {
  return ipAllow(`verify:${ip}`, 30, 10 * 60 * 1000);
}
