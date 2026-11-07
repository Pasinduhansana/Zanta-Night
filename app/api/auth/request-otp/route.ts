import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/auth-service";


function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export async function POST(request: Request) {
  let body: { email?: unknown; purpose?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  if (typeof body.email !== "string" || body.email.length > 160) {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "email is required." },
      { status: 400 },
    );
  }
  if (body.purpose !== undefined && body.purpose !== "login" && body.purpose !== "booking") {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", error: "Invalid purpose." },
      { status: 400 },
    );
  }
  const purpose = body.purpose === "booking" ? "booking" : "login";

  try {
    const result = await requestOtp(body.email, clientIp(request), purpose);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.code,
          ...(result.retryAfter !== undefined ? { retryAfter: result.retryAfter } : {}),
        },
        { status: result.status },
      );
    }
    return NextResponse.json({ ok: true, retryAfter: result.retryAfter });
  } catch (err) {
    console.error("[zanta] request-otp route failed:", err);
    return NextResponse.json(
      { ok: false, code: "server", error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
