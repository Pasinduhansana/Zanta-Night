import { NextResponse } from "next/server";
import { BookingError, uploadSlip } from "@/lib/booking-service";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "Missing payment slip file." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Only JPG, PNG or WebP images are accepted." },
      { status: 415 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: "File is too large — maximum 5 MB." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const booking = await uploadSlip(ref, {
      buffer,
      contentType: file.type,
      fileName: file.name || "payment-slip.jpg",
    });
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    console.error("[zanta] slip upload failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not store your slip. Please try again." },
      { status: 500 },
    );
  }
}
