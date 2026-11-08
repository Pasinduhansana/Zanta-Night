import { NextResponse } from "next/server";
import { readSessionToken, resolveSession } from "@/lib/auth-service";


export async function GET(request: Request) {
  try {
    const session = await resolveSession(readSessionToken(request));
    if (!session) {
      // 200 {ok:false}: "not signed in" is a normal state for public pages,
      // and every caller already branches on the ok flag.
      return NextResponse.json({ ok: false, code: "unauth" });
    }
    return NextResponse.json({ ok: true, email: session.email });
  } catch (err) {
    if (
      err instanceof Error &&
      "digest" in err &&
      (err as { digest?: unknown }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw err;
    }
    console.error("[zanta] session route failed:", err);
    return NextResponse.json({ ok: false, code: "server" }, { status: 500 });
  }
}
