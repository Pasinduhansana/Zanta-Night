import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { getStats, listBookings } from "@/lib/booking-service";
import type { BookingStatus } from "@/lib/validation";

const VALID: BookingStatus[] = [
  "pending",
  "awaiting_verification",
  "confirmed",
  "checked_in",
  "rejected",
  "expired",
];

export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam && VALID.includes(statusParam as BookingStatus)
      ? (statusParam as BookingStatus)
      : undefined;

    const [bookings, stats] = await Promise.all([listBookings(status), getStats()]);
    return NextResponse.json({ ok: true, bookings, stats });
  } catch (err) {
    console.error("[zanta] admin list failed:", err);
    return NextResponse.json({ ok: false, error: "Could not load bookings." }, { status: 500 });
  }
}
