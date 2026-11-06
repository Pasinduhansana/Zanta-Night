import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { getSlipSource } from "@/lib/booking-service";
import { getSlipObject } from "@/lib/r2";

export async function GET(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  try {
    const source = await getSlipSource(ref);
    if (!source) {
      return NextResponse.json({ ok: false, error: "No slip uploaded." }, { status: 404 });
    }

    let bytes: Uint8Array<ArrayBuffer>;
    let contentType: string;
    if (source.kind === "buffer") {
      bytes = new Uint8Array(source.data);
      contentType = source.contentType;
    } else {
      const object = await getSlipObject(source.key);
      if (!object) {
        console.error(`[zanta] R2 object missing or unreachable for ${ref}: ${source.key}`);
        return NextResponse.json({ ok: false, error: "Could not load slip." }, { status: 500 });
      }
      bytes = object.data;
      contentType = object.contentType;
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[zanta] slip fetch failed:", err);
    return NextResponse.json({ ok: false, error: "Could not load slip." }, { status: 500 });
  }
}
