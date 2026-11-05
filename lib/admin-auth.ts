import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Returns a NextResponse when access is denied, or null when the caller is authorized. */
export function checkAdmin(req: Request): NextResponse | null {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Admin access is not configured (ADMIN_TOKEN is missing)." },
      { status: 503 },
    );
  }
  const provided = req.headers.get("x-admin-token") ?? "";
  if (!provided || !timingSafeEqual(digest(provided), digest(token))) {
    return NextResponse.json({ ok: false, error: "Invalid admin token." }, { status: 401 });
  }
  return null;
}
