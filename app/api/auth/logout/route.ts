import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  isHttpsRequest,
  readSessionToken,
  revokeSession,
} from "@/lib/auth-service";


export async function POST(request: Request) {
  try {
    await revokeSession(readSessionToken(request));
    const response = NextResponse.json({ ok: true });
    response.headers.set("set-cookie", clearSessionCookie(isHttpsRequest(request)));
    return response;
  } catch (err) {
    console.error("[zanta] logout route failed:", err);
    return NextResponse.json({ ok: false, code: "server" }, { status: 500 });
  }
}
