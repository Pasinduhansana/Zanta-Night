import { NextResponse } from "next/server";
import { BookingError, findBookingForEmail, uploadSlip } from "@/lib/booking-service";
import { readSessionToken, resolveSession } from "@/lib/auth-service";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

export async function POST(request: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;
  const session = await resolveSession(readSessionToken(request));
  if (!session) {
    return NextResponse.json({ ok: false, code: "notFound", error: "Booking not found." }, { status: 404 });
  }
  const ownedBooking = await findBookingForEmail(ref, session.email);
  if (!ownedBooking) {
    return NextResponse.json({ ok: false, code: "notFound", error: "Booking not found." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "generic", error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { ok: false, code: "generic", error: "Missing payment slip file." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, code: "type", error: "Only JPG, PNG or WebP images are accepted." },
      { status: 415 },
    );
  }
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { ok: false, code: "type", error: "File must be a .jpg, .png or .webp image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, code: "size", error: "File is too large — maximum 5 MB." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const booking = await uploadSlip(ref, {
      buffer,
      contentType: file.type,
      fileName: file.name || "payment-slip.jpg",
    }, session.email);
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code, data: err.data },
        { status: err.status },
      );
    }
    console.error("[zanta] slip upload failed:", err);
    return NextResponse.json(
      { ok: false, code: "server", error: "Could not store your slip. Please try again." },
      { status: 500 },
    );
  }
}
