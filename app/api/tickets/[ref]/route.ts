import { NextResponse } from "next/server";
import { findBooking } from "@/lib/booking-service";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  const { ref } = await ctx.params;
  if (!ref || ref.length > 24) {
    return NextResponse.json({ ok: false, error: "Invalid reference" }, { status: 400 });
  }

  try {
    const booking = await findBooking(ref);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    console.error("[zanta] booking lookup failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not load the booking" },
      { status: 500 },
    );
  }
}
