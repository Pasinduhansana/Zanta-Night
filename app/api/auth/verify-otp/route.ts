import { NextResponse } from "next/server";
import {
  buildSessionCookie,
  isHttpsRequest,
  verifyRateAllow,
  verifyOtp,
} from "@/lib/auth-service";


function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  if (typeof body.email !== "string" || typeof body.code !== "string") {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "email and code are required." },
      { status: 400 },
    );
  }
  if (body.email.length > 160 || body.code.length > 12) {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "Invalid payload." },
      { status: 400 },
    );
  }

  if (!verifyRateAllow(clientIp(request))) {
    return NextResponse.json(
      { ok: false, code: "rateLimited", error: "Too many attempts." },
      { status: 429 },
    );
  }

  try {
    const result = await verifyOtp(body.email, body.code);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.code,
          ...(result.attemptsLeft !== undefined
            ? { attemptsLeft: result.attemptsLeft }
            : {}),
        },
        { status: result.status },
      );
    }
    const response = NextResponse.json({
      ok: true,
      email: result.email,
      redirect: "/tickets",
    });
    response.headers.set(
      "set-cookie",
      buildSessionCookie(result.token, isHttpsRequest(request)),
    );
    return response;
  } catch (err) {
    console.error("[zanta] verify-otp route failed:", err);
    return NextResponse.json(
      { ok: false, code: "server", error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
