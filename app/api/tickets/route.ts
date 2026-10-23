import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { createBooking } from "@/lib/booking-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const booking = await createBooking(parsed.data);
    return NextResponse.json({ ok: true, booking }, { status: 201 });
  } catch (err) {
    console.error("[zanta] booking creation failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not create your booking. Please try again." },
      { status: 500 },
    );
  }
}
