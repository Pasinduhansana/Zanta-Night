import mongoose from "mongoose";
import sharp from "sharp";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3100";
const EMAIL = "qa-otp@example.com";
const REF_RE = /^ZN-[A-Z0-9]{6}$/;

function loadEnv() {
  const out = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const env = loadEnv();
const ADMIN_TOKEN = env.ADMIN_TOKEN;
const SECRET = env.OTP_HASH_SECRET || env.ADMIN_TOKEN;

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.log(`FAIL  ${name}  ${extra}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = "GET", body, headers = {}, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, data, setCookie: res.headers.get("set-cookie") };
}

function recoverCode(email, codeHash) {
  for (let i = 0; i < 1_000_000; i++) {
    const code = String(i).padStart(6, "0");
    const h = createHmac("sha256", SECRET).update(`${email}:${code}`).digest("hex");
    if (h === codeHash) return code;
  }
  return null;
}

async function requestOtpFresh() {
  for (let i = 0; i < 5; i++) {
    const r = await api("/api/auth/request-otp", {
      method: "POST",
      body: { email: EMAIL },
    });
    if (r.status === 200) return r;
    if (r.data?.code === "cooldown" && r.data.retryAfter) {
      console.log(`      ...cooldown ${r.data.retryAfter}s`);
      await sleep((r.data.retryAfter + 1) * 1000);
      continue;
    }
    return r;
  }
  throw new Error("cooldown loop exhausted");
}

/* ============================================================ Phase A: tickets */
async function phaseA(ticketCol) {
  console.log("\n--- Phase A: booking → slip → confirm → ticket issuance → scan API");

  let r = await api("/api/event");
  check(
    "A0 clean state (500/500)",
    r.data?.ok && r.data.remaining === 500 && r.data.booked === 0,
    JSON.stringify(r.data),
  );

  r = await api("/api/tickets", {
    method: "POST",
    body: {
      fullName: "<script>alert(1)</script>QA Guest",
      email: EMAIL,
      phone: "0771234567",
      quantity: 3,
    },
  });
  const ref = r.data?.booking?.reference;
  check("A1 booking created", r.status === 200 && REF_RE.test(ref ?? ""), JSON.stringify(r.data));
  check(
    "A1b XSS stripped from stored name",
    r.data?.booking?.fullName === "alert(1)QA Guest",
    r.data?.booking?.fullName,
  );
  if (!ref) throw new Error("no reference — aborting");

  const png = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 10, g: 40, b: 30 } },
  })
    .png()
    .toBuffer();
  const fd = new FormData();
  fd.append("file", new File([png], "slip.png", { type: "image/png" }));
  const slipRes = await fetch(`${BASE}/api/tickets/${encodeURIComponent(ref)}/slip`, {
    method: "POST",
    body: fd,
  });
  const slipData = await slipRes.json().catch(() => null);
  check(
    "A2 slip uploaded → awaiting_verification",
    slipRes.status === 200 && slipData?.booking?.status === "awaiting_verification",
    JSON.stringify(slipData),
  );

  r = await api(`/api/admin/bookings/${ref}`, {
    method: "POST",
    headers: { "x-admin-token": ADMIN_TOKEN },
    body: { action: "confirm" },
  });
  check(
    "A3 admin confirm",
    r.status === 200 && r.data?.ok && r.data.booking?.status === "confirmed",
    JSON.stringify(r.data),
  );

  r = await api("/api/admin/scan", { headers: { "x-admin-token": ADMIN_TOKEN } });
  check(
    "A4 issuance: 3 tickets, 0 used",
    r.status === 200 &&
      r.data?.stats?.total === 3 &&
      r.data?.stats?.used === 0 &&
      r.data?.stats?.remaining === 3,
    JSON.stringify(r.data),
  );

  const tks = await ticketCol.find({ bookingRef: ref }).sort({ seatIndex: 1 }).lean();
  check("A5 three ticket docs", tks.length === 3, `got ${tks.length}`);
  if (tks.length !== 3) return ref;
  const [t1, t2, t3] = tks.map((t) => t.ticketId);

  const scan = (ticketId, method = "camera") =>
    api("/api/admin/scan", {
      method: "POST",
      headers: { "x-admin-token": ADMIN_TOKEN },
      body: { ticketId, method },
    });

  const [s1, s2] = await Promise.all([scan(t1), scan(t1)]);
  const outcomes = [s1.data?.outcome, s2.data?.outcome].sort().join(",");
  check("A6 race: exactly one valid", outcomes === "used,valid", outcomes);

  let s = await scan(t2);
  check("A7 first scan valid", s.data?.outcome === "valid", JSON.stringify(s.data));
  s = await scan(t2);
  check("A7b rescan → used", s.data?.outcome === "used", JSON.stringify(s.data));

  const messy = `  znt${t3.slice(4).toLowerCase()}  `; // lowercase, spaces, missing dash
  s = await scan(messy);
  check("A8 normalization (case/space/dash)", s.data?.outcome === "valid", `${messy} → ${s.data?.outcome}`);

  s = await scan("hello");
  check("A9 bad format → invalid", s.data?.outcome === "invalid", JSON.stringify(s.data));
  s = await scan("ZNT-ZZZZZZ9999");
  check("A9b unknown id → invalid", s.data?.outcome === "invalid", JSON.stringify(s.data));

  r = await api("/api/admin/scan", { headers: { "x-admin-token": ADMIN_TOKEN } });
  check(
    "A10 final stats 3/3/0",
    r.data?.stats?.total === 3 && r.data?.stats?.used === 3 && r.data?.stats?.remaining === 0,
    JSON.stringify(r.data),
  );

  return ref;
}

/* ============================================================= Phase B: OTP auth */
async function phaseB(otpCol, ref) {
  console.log("\n--- Phase B: OTP request/cooldown/lockout/expiry/verify/session");

  let r = await api("/api/auth/request-otp", {
    method: "POST",
    body: { email: "nobody@example.com" },
  });
  check(
    "B1 unknown email → noBookings 404",
    r.status === 404 && r.data?.code === "noBookings",
    JSON.stringify(r.data),
  );

  r = await api("/api/auth/request-otp", { method: "POST", body: { email: EMAIL } });
  check(
    "B2 live OTP request accepted (SMTP)",
    r.status === 200 && r.data?.ok === true && r.data?.retryAfter === 60,
    JSON.stringify(r.data),
  );

  r = await api("/api/auth/request-otp", { method: "POST", body: { email: EMAIL } });
  check(
    "B3 60s resend cooldown",
    r.status === 429 &&
      r.data?.code === "cooldown" &&
      r.data.retryAfter >= 1 &&
      r.data.retryAfter <= 60,
    JSON.stringify(r.data),
  );

  const doc1 = await otpCol.findOne({ email: EMAIL }).lean();
  check("B4 OTP stored hashed (no plaintext code in doc)", !!doc1 && !("code" in (doc1 ?? {})) && typeof doc1?.codeHash === "string", JSON.stringify(Object.keys(doc1 ?? {})));
  const real1 = doc1 ? recoverCode(EMAIL, doc1.codeHash) : null;
  check("B4b code recoverable from hash+secret (QA side)", !!real1, String(real1));
  const wrong = real1 === "123456" ? "123457" : "123456";

  for (let i = 1; i <= 5; i++) {
    r = await api("/api/auth/verify-otp", {
      method: "POST",
      body: { email: EMAIL, code: wrong },
    });
    if (i < 5) {
      check(
        `B5 wrong attempt ${i} → ${5 - i} left`,
        r.status === 400 && r.data?.code === "invalid" && r.data?.attemptsLeft === 5 - i,
        JSON.stringify(r.data),
      );
    } else {
      check(
        "B5e 5th wrong attempt → locked (tooMany)",
        r.status === 429 && r.data?.code === "tooMany",
        JSON.stringify(r.data),
      );
    }
  }

  r = await api("/api/auth/session");
  check("B6 session without cookie → 401", r.status === 401, String(r.status));
  r = await api("/api/my/tickets");
  check("B6b my/tickets without cookie → 401", r.status === 401, String(r.status));

  // fresh code (waits out the cooldown; resets the attempt counter)
  r = await requestOtpFresh();
  check("B7 fresh code after lockout", r.status === 200 && r.data?.ok === true, JSON.stringify(r.data));
  const doc2 = await otpCol.findOne({ email: EMAIL }).lean();
  const real2 = doc2 ? recoverCode(EMAIL, doc2.codeHash) : null;
  check("B7b code recovered", !!real2);

  await otpCol.updateOne({ email: EMAIL }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  r = await api("/api/auth/verify-otp", {
    method: "POST",
    body: { email: EMAIL, code: real2 },
  });
  check(
    "B8 expired code rejected even with correct digits",
    r.status === 400 && r.data?.code === "expired",
    JSON.stringify(r.data),
  );

  // login for real
  r = await requestOtpFresh();
  check("B9 login code requested", r.status === 200 && r.data?.ok === true, JSON.stringify(r.data));
  const doc3 = await otpCol.findOne({ email: EMAIL }).lean();
  const real3 = doc3 ? recoverCode(EMAIL, doc3.codeHash) : null;
  check("B9b code recovered", !!real3);
  if (!real3) return;

  r = await api("/api/auth/verify-otp", {
    method: "POST",
    body: { email: EMAIL, code: real3 },
  });
  check(
    "B10 verify ok + session cookie",
    r.status === 200 && r.data?.ok === true && (r.setCookie ?? "").includes("zanta_session="),
    JSON.stringify({ status: r.status, data: r.data, cookie: r.setCookie }),
  );
  const cookie = (r.setCookie ?? "").split(";")[0];
  if (!cookie.startsWith("zanta_session=")) return;

  r = await api("/api/auth/verify-otp", {
    method: "POST",
    body: { email: EMAIL, code: real3 },
  });
  check(
    "B11 OTP reuse blocked after success",
    r.status === 404 && r.data?.code === "notFound",
    JSON.stringify(r.data),
  );

  r = await api("/api/auth/session", { cookie });
  check("B12 session resolves", r.status === 200 && r.data?.email === EMAIL, JSON.stringify(r.data));

  r = await api("/api/my/tickets", { cookie });
  const bks = r.data?.bookings ?? [];
  const tss = r.data?.tickets ?? [];
  check(
    "B13 my/tickets: own booking + 3 tickets",
    r.status === 200 &&
      r.data?.email === EMAIL &&
      bks.length === 1 &&
      bks[0].reference === ref &&
      tss.length === 3 &&
      tss.every((t) => t.bookingRef === ref),
    JSON.stringify({ status: r.status, bks: bks.length, tss: tss.length }),
  );

  r = await api(`/api/my/tickets?email=someone-else@example.com&ref=ZN-ABCDEF`, { cookie });
  check(
    "B14 request params cannot widen scope",
    r.status === 200 && r.data?.email === EMAIL && r.data?.bookings?.length === 1,
    JSON.stringify(r.data?.email),
  );

  r = await api("/api/auth/logout", { method: "POST", cookie });
  check(
    "B15 logout clears session",
    r.status === 200 && (r.setCookie ?? "").includes("zanta_session=;"),
    JSON.stringify(r.data),
  );
  r = await api("/api/my/tickets", { cookie });
  check("B15b old cookie dead after logout", r.status === 401, String(r.status));
}

/* ==================================================================== main */
async function main() {
  await mongoose.connect(env.MONGODB_URI, { dbName: "zantanight" });
  const ticketCol = mongoose.model(
    "QaTicket",
    new mongoose.Schema({}, { strict: false }),
    "tickets",
  );
  const otpCol = mongoose.model(
    "QaOtp",
    new mongoose.Schema({}, { strict: false }),
    "otpcodes",
  );

  const ref = await phaseA(ticketCol);
  await phaseB(otpCol, ref);

  console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURES`}`);
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("QA script crashed:", err);
  process.exit(2);
});
