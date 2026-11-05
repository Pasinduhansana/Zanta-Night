import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { applyAction, BookingError, type AdminAction } from "@/lib/booking-service";

const ACTIONS: AdminAction[] = ["confirm", "reject", "checkin"];

export async function POST(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !ACTIONS.includes(body.action as AdminAction)) {
    return NextResponse.json(
      { ok: false, error: `Action must be one of: ${ACTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const booking = await applyAction(ref, body.action as AdminAction, body.reason);
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    console.error("[zanta] admin action failed:", err);
    return NextResponse.json({ ok: false, error: "Action failed." }, { status: 500 });
  }
}
