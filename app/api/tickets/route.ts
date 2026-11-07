import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { BookingError, createBooking } from "@/lib/booking-service";
import { readSessionToken, resolveSession } from "@/lib/auth-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation",
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Email ownership must be proven via OTP before a booking is accepted.
  // The verified email lives in the session cookie — never in request params.
  const session = await resolveSession(readSessionToken(request));
  if (!session) {
    return NextResponse.json(
      { ok: false, code: "emailVerification", error: "Verify your email before submitting." },
      { status: 403 },
    );
  }
  if (session.email !== parsed.data.email.trim().toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        code: "emailMismatch",
        error: "The booking email must match the verified email.",
      },
      { status: 403 },
    );
  }

  try {
    const booking = await createBooking(parsed.data);
    return NextResponse.json({ ok: true, booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code, data: err.data },
        { status: err.status },
      );
    }
    console.error("[zanta] booking creation failed:", err);
    return NextResponse.json(
      { ok: false, code: "server", error: "Could not create your booking. Please try again." },
      { status: 500 },
    );
  }
}
