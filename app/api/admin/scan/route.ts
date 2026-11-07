import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { claimTicket, getScanStats } from "@/lib/tickets";

function serverError(err: unknown) {
  console.error("[zanta] scan request failed:", err);
  return NextResponse.json({ ok: false, error: "Scanner request failed." }, { status: 500 });
}

export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;
  try {
    const stats = await getScanStats();
    if (!stats) {
      return NextResponse.json(
        { ok: false, error: "Ticket store unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  let body: { ticketId?: unknown; method?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.ticketId !== "string" || !body.ticketId.trim()) {
    return NextResponse.json({ ok: false, error: "ticketId is required." }, { status: 400 });
  }
  if (body.ticketId.length > 64) {
    return NextResponse.json({ ok: false, error: "ticketId is too long." }, { status: 400 });
  }

  try {
    const method = body.method === "manual" ? "manual" : "camera";
    const result = await claimTicket(body.ticketId, method);
    if (result.outcome === "unavailable") {
      return NextResponse.json(
        { ok: false, error: "Ticket store unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      outcome: result.outcome,
      ticket: result.ticket ?? null,
      stats: result.stats,
    });
  } catch (err) {
    return serverError(err);
  }
}
