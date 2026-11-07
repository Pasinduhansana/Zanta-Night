import { NextResponse } from "next/server";
import { listBookingsForEmail } from "@/lib/booking-service";
import { readSessionToken, resolveSession } from "@/lib/auth-service";
import { listTicketsForEmail } from "@/lib/tickets";


/**
 * Bookings + tickets for the signed-in email only. The email comes from the
 * session cookie — no request parameter can widen the scope.
 */
export async function GET(request: Request) {
  try {
    const session = await resolveSession(readSessionToken(request));
    if (!session) {
      return NextResponse.json({ ok: false, code: "unauth" }, { status: 401 });
    }

    const [bookings, tickets] = await Promise.all([
      listBookingsForEmail(session.email),
      listTicketsForEmail(session.email),
    ]);
    if (tickets === null) {
      return NextResponse.json(
        { ok: false, code: "unavailable", error: "Ticket store unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      email: session.email,
      bookings,
      tickets,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      "digest" in err &&
      (err as { digest?: unknown }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw err;
    }
    console.error("[zanta] my-tickets route failed:", err);
    return NextResponse.json(
      { ok: false, code: "server", error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
