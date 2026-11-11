import { NextResponse } from "next/server";
import { readSessionToken, resolveSession } from "@/lib/auth-service";
import { recordBookingDownload, recordTicketDownload } from "@/lib/tickets";

const FORMATS = ["png", "jpg", "pdf"] as const;

export async function POST(request: Request) {
  const session = await resolveSession(readSessionToken(request));
  if (!session) return NextResponse.json({ ok: false, code: "unauth" }, { status: 401 });

  let body: { ticketId?: unknown; bookingRef?: unknown; format?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  if (
    typeof body.format !== "string" ||
    (typeof body.ticketId !== "string" && typeof body.bookingRef !== "string") ||
    !FORMATS.includes(body.format as (typeof FORMATS)[number])
  ) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const recorded =
    typeof body.ticketId === "string"
      ? await recordTicketDownload(session.email, body.ticketId, body.format as (typeof FORMATS)[number])
      : await recordBookingDownload(
          session.email,
          body.bookingRef as string,
          body.format as (typeof FORMATS)[number],
        );
  if (!recorded) return NextResponse.json({ ok: false, code: "notFound" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
