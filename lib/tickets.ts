import { randomBytes } from "crypto";
import { Ticket, type TicketAttrs } from "@/lib/models/Ticket";
import { Booking } from "@/lib/models/Booking";
import { connectDB } from "@/lib/booking-service";
import { sendTicketEmail } from "@/lib/mailer";

const TICKET_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TICKET_ID_RE = /^ZNT-[A-Z0-9]{6,20}$/;

export type ScanMethod = "camera" | "manual";

export type ScanOutcome = "valid" | "used" | "invalid" | "unavailable";

export type ScanStats = { total: number; used: number; remaining: number };

export type ScanTicket = {
  ticketId: string;
  bookingRef: string;
  guestName: string;
  seatIndex: number;
  status: string;
  issuedAt: string;
  usedAt: string | null;
};

export type ScanResponse = {
  outcome: ScanOutcome;
  ticket?: ScanTicket;
  stats?: ScanStats;
};

function makeTicketId(): string {
  const bytes = randomBytes(12);
  let id = "";
  for (let i = 0; i < 12; i++) id += TICKET_ALPHABET[bytes[i] % TICKET_ALPHABET.length];
  return `ZNT-${id}`;
}

/** Uppercase, drop whitespace, tolerate a missing dash after the prefix. */
export function normalizeTicketId(raw: string): string {
  let value = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (value.startsWith("ZNT") && !value.startsWith("ZNT-")) {
    value = `ZNT-${value.slice(3)}`;
  }
  return value;
}

function toPublicTicket(doc: {
  ticketId: string;
  bookingRef: string;
  guestName: string;
  seatIndex: number;
  status: string;
  issuedAt: Date | string;
  usedAt?: Date | string | null;
}): ScanTicket {
  return {
    ticketId: doc.ticketId,
    bookingRef: doc.bookingRef,
    guestName: doc.guestName,
    seatIndex: doc.seatIndex,
    status: doc.status,
    issuedAt: new Date(doc.issuedAt).toISOString(),
    usedAt: doc.usedAt ? new Date(doc.usedAt).toISOString() : null,
  };
}

export async function getScanStats(): Promise<ScanStats | null> {
  const conn = await connectDB();
  if (!conn) return null;
  try {
    const [total, used] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "used" }),
    ]);
    return { total, used, remaining: Math.max(0, total - used) };
  } catch (err) {
    console.error("[zanta] scan stats failed:", err);
    return null;
  }
}

export type MyTicket = {
  ticketId: string;
  bookingRef: string;
  seatIndex: number;
  status: string;
  issuedAt: string;
  usedAt: string | null;
};

/** Tickets belonging to one guest email — the My Tickets dashboard source. */
export async function listTicketsForEmail(email: string): Promise<MyTicket[] | null> {
  const target = email.trim().toLowerCase();
  if (!target) return [];
  const conn = await connectDB();
  if (!conn) return null;
  try {
    const docs = await Ticket.find({ guestEmail: target })
      .sort({ bookingRef: 1, seatIndex: 1 })
      .limit(500)
      .lean();
    return docs.map((d) => ({
      ticketId: d.ticketId,
      bookingRef: d.bookingRef,
      seatIndex: d.seatIndex,
      status: d.status,
      issuedAt: new Date(d.issuedAt).toISOString(),
      usedAt: d.usedAt ? new Date(d.usedAt).toISOString() : null,
    }));
  } catch (err) {
    console.error("[zanta] ticket list failed:", err);
    return null;
  }
}

/**
 * Atomically claim a ticket for first-time use.
 * The `status: "unused"` filter makes the transition race-free — simultaneous
 * scans from multiple devices resolve to exactly one "valid".
 */
export async function claimTicket(rawId: string, method: ScanMethod): Promise<ScanResponse> {
  const ticketId = normalizeTicketId(rawId);
  if (!TICKET_ID_RE.test(ticketId)) {
    const stats = await getScanStats();
    return stats ? { outcome: "invalid", stats } : { outcome: "unavailable" };
  }

  const stats = await getScanStats();
  if (!stats) return { outcome: "unavailable" };

  const now = new Date();
  try {
    const claimed = await Ticket.findOneAndUpdate(
      { ticketId, status: "unused" },
      {
        $set: { status: "used", usedAt: now },
        $push: { scans: { at: now, method } },
      },
      { new: true },
    );
    if (claimed) {
      return { outcome: "valid", ticket: toPublicTicket(claimed), stats };
    }

    const existing = await Ticket.findOne({ ticketId }).lean();
    if (!existing) return { outcome: "invalid", stats };
    return { outcome: "used", ticket: toPublicTicket(existing), stats };
  } catch (err) {
    console.error("[zanta] ticket scan failed:", err);
    return { outcome: "unavailable" };
  }
}

export type IssueTarget = {
  reference: string;
  quantity: number;
  fullName: string;
  email: string;
};

/**
 * Issues one ticket per seat for an approved booking, exactly once, then
 * emails them to the guest. Idempotent: guarded by an atomic flag on the
 * booking document plus a unique (bookingRef, seatIndex) index.
 */
export async function issueTickets(target: IssueTarget): Promise<boolean> {
  const conn = await connectDB();
  if (!conn) {
    console.warn("[zanta] ticket issuance skipped — no database connection");
    return false;
  }

  const existing = await Ticket.countDocuments({ bookingRef: target.reference });
  if (existing >= target.quantity) return false;

  const flagged = await Booking.findOneAndUpdate(
    { reference: target.reference, ticketsIssued: { $ne: true } },
    { $set: { ticketsIssued: true } },
    { new: true },
  );
  if (!flagged) {
    const doc = await Booking.findOne({ reference: target.reference })
      .select("ticketsIssued")
      .lean();
    // Booking exists and was already flagged by a concurrent call.
    if (doc?.ticketsIssued) return false;
    // No booking document (in-memory booking) — the unique index below
    // still prevents duplicates.
  }

  const now = new Date();
  const docs: TicketAttrs[] = Array.from({ length: target.quantity }, (_, i) => ({
    ticketId: makeTicketId(),
    bookingRef: target.reference,
    guestName: target.fullName,
    guestEmail: target.email,
    seatIndex: i + 1,
    status: "unused",
    issuedAt: now,
    scans: [],
  }));

  try {
    await Ticket.insertMany(docs, { ordered: false });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 11000) {
      // Release the flag so a future attempt is not silently blocked.
      await Booking.updateOne(
        { reference: target.reference },
        { $set: { ticketsIssued: false } },
      ).catch(() => undefined);
      throw err;
    }
    const count = await Ticket.countDocuments({ bookingRef: target.reference });
    if (count < target.quantity) throw err;
  }

  try {
    const emailed = await sendTicketEmail({
      to: target.email,
      name: target.fullName,
      reference: target.reference,
      tickets: docs.map((d) => ({ ticketId: d.ticketId, seatIndex: d.seatIndex })),
    });
    if (emailed) {
      await Booking.updateOne(
        { reference: target.reference },
        { $set: { ticketsSentAt: new Date() } },
      ).catch(() => undefined);
    }
  } catch (err) {
    console.error("[zanta] ticket email failed:", err);
  }

  return true;
}
