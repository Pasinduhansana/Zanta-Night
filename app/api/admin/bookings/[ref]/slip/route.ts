import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { getSlip } from "@/lib/booking-service";

export async function GET(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  try {
    const slip = await getSlip(ref);
    if (!slip) {
      return NextResponse.json({ ok: false, error: "No slip uploaded." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(slip.data), {
      headers: {
        "Content-Type": slip.contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[zanta] slip fetch failed:", err);
    return NextResponse.json({ ok: false, error: "Could not load slip." }, { status: 500 });
  }
}
