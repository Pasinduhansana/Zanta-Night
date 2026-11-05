import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { EVENT } from "@/lib/event-config";
import { getCapacityState } from "@/lib/booking-service";

export async function GET() {
  await headers(); // opt into dynamic rendering — capacity changes at runtime

  const state = await getCapacityState();
  const paymentConfigured = Boolean(
    EVENT.payment.bank.accountNumber || EVENT.payment.wallets.length,
  );

  return NextResponse.json({
    ok: true,
    capacity: state.capacity,
    booked: state.booked,
    remaining: state.remaining,
    price: EVENT.ticket.price,
    currency: EVENT.ticket.currency,
    maxPerOrder: EVENT.ticket.maxPerOrder,
    windowHours: EVENT.payment.windowHours,
    paymentConfigured,
    payment: EVENT.payment,
  });
}
