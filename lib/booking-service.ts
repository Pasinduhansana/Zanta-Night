import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { Booking } from "@/lib/models/Booking";
import { EVENT } from "@/lib/event-config";
import type { BookingInput, BookingPublic, BookingStatus, SlipInfo } from "@/lib/validation";

const MONGODB_URI = process.env.MONGODB_URI;

export const ACTIVE_STATUSES: BookingStatus[] = [
  "pending",
  "awaiting_verification",
  "confirmed",
  "checked_in",
];

const UPLOADABLE_STATUSES: BookingStatus[] = [
  "pending",
  "awaiting_verification",
  "rejected",
];

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "BookingError";
  }
}

/* ------------------------------------------------------------- connection */

type MongoCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose | null> | null };
const globalWithMongo = globalThis as typeof globalThis & { __zantaMongo?: MongoCache };
const cache: MongoCache = globalWithMongo.__zantaMongo ?? { conn: null, promise: null };
globalWithMongo.__zantaMongo = cache;

let warned = false;
function warnOnce(message: string) {
  if (!warned) {
    warned = true;
    console.warn(`[zanta] ${message}`);
  }
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    warnOnce("MONGODB_URI is not set — falling back to the in-memory store.");
    return null;
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        dbName: "zantanight",
      })
      .then((m) => m)
      .catch((err: unknown) => {
        warnOnce(
          `MongoDB connection failed (${err instanceof Error ? err.message : "unknown"}) — falling back to the in-memory store.`,
        );
        return null;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/* ----------------------------------------------------------- memory store */

type MemorySlip = SlipInfo & { data: Buffer; uploadedAt: string };
type MemoryRecord = BookingPublic & { slip?: MemorySlip | null };

type MemoryStore = Map<string, MemoryRecord>;
const globalWithStore = globalThis as typeof globalThis & { __zantaBookings?: MemoryStore };
const memoryStore: MemoryStore = globalWithStore.__zantaBookings ?? new Map();
globalWithStore.__zantaBookings = memoryStore;

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `ZN-${out}`;
}

function staleCutoff(): Date {
  return new Date(Date.now() - EVENT.payment.windowHours * 3600 * 1000);
}

async function expireStale(): Promise<void> {
  const cutoff = staleCutoff();
  const conn = await connectDB();
  if (conn) {
    try {
      await Booking.updateMany(
        { status: { $in: ["pending", "awaiting_verification", "rejected"] }, createdAt: { $lt: cutoff } },
        { $set: { status: "expired" } },
      );
      return;
    } catch (err) {
      warnOnce(`Expiry sweep failed (${err instanceof Error ? err.message : "unknown"})`);
      return;
    }
  }
  for (const rec of memoryStore.values()) {
    if (
      ["pending", "awaiting_verification", "rejected"].includes(rec.status) &&
      Date.parse(rec.createdAt) < cutoff.getTime()
    ) {
      rec.status = "expired";
    }
  }
}

/* ---------------------------------------------------------------- helpers */

function slipInfoFrom(record: {
  slip?: { fileName?: string; size?: number; contentType?: string; uploadedAt?: Date | string } | null;
}): SlipInfo | null {
  const s = record.slip;
  if (!s || !s.uploadedAt) return null;
  return {
    fileName: s.fileName ?? "slip",
    size: s.size ?? 0,
    contentType: s.contentType ?? "image/jpeg",
    uploadedAt: s.uploadedAt instanceof Date ? s.uploadedAt.toISOString() : String(s.uploadedAt),
  };
}

function isoOf(value: Date | string | undefined | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function toPublic(raw: Record<string, unknown>): BookingPublic {
  const slip = raw.slip as MemorySlip | undefined;
  return {
    reference: String(raw.reference),
    fullName: String(raw.fullName),
    email: String(raw.email),
    phone: String(raw.phone),
    quantity: Number(raw.quantity),
    unitPrice: Number(raw.unitPrice),
    total: Number(raw.total),
    ticketCategory: String(raw.ticketCategory),
    status: raw.status as BookingStatus,
    storage: (raw.storage as "mongo" | "memory") ?? "memory",
    createdAt: isoOf(raw.createdAt as Date | string) ?? new Date().toISOString(),
    rejectReason: (raw.rejectReason as string | null) ?? null,
    verifiedAt: isoOf(raw.verifiedAt as Date | string | null),
    checkedInAt: isoOf(raw.checkedInAt as Date | string | null),
    slip: slipInfoFrom({ slip }),
  };
}

function sanitize(input: BookingInput) {
  const unitPrice = EVENT.ticket.price;
  return {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    quantity: input.quantity,
    unitPrice,
    total: unitPrice * input.quantity,
    ticketCategory: EVENT.ticket.category,
    status: "pending" as BookingStatus,
  };
}

/* -------------------------------------------------------------- capacity */

export async function getCapacityState(): Promise<{
  capacity: number;
  booked: number;
  remaining: number;
}> {
  await expireStale();
  const capacity = EVENT.ticket.capacity;
  const conn = await connectDB();
  if (conn) {
    try {
      const rows = await Booking.aggregate<{ _id: null; qty: number }>([
        { $match: { status: { $in: ACTIVE_STATUSES } } },
        { $group: { _id: null, qty: { $sum: "$quantity" } } },
      ]);
      const booked = rows[0]?.qty ?? 0;
      return { capacity, booked, remaining: Math.max(0, capacity - booked) };
    } catch (err) {
      warnOnce(`Capacity query failed (${err instanceof Error ? err.message : "unknown"})`);
    }
  }
  let booked = 0;
  for (const rec of memoryStore.values()) {
    if (ACTIVE_STATUSES.includes(rec.status)) booked += rec.quantity;
  }
  return { capacity, booked, remaining: Math.max(0, capacity - booked) };
}

/* --------------------------------------------------------------- bookings */

export async function createBooking(input: BookingInput): Promise<BookingPublic> {
  const { remaining } = await getCapacityState();
  if (remaining < input.quantity) {
    throw new BookingError(
      `Only ${remaining} ticket${remaining === 1 ? "" : "s"} left — reduce your quantity.`,
      409,
    );
  }

  const base = sanitize(input);
  const reference = makeReference();
  const createdAt = new Date().toISOString();

  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.create({ reference, ...base, notes: input.notes || undefined });
      const obj = doc.toObject({ flattenObjectIds: true }) as Record<string, unknown>;
      obj.storage = "mongo";
      return toPublic(obj);
    } catch (err) {
      if (err instanceof BookingError) throw err;
      warnOnce(
        `Failed to persist booking (${err instanceof Error ? err.message : "unknown"}) — using the in-memory store.`,
      );
    }
  }

  const record: MemoryRecord = { ...base, reference, createdAt, storage: "memory", slip: null };
  memoryStore.set(reference, record);
  return toPublic(record);
}

export async function findBooking(reference: string): Promise<BookingPublic | null> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return null;
  await expireStale();

  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.findOne({ reference: ref }).lean();
      if (doc) return toPublic({ ...doc, storage: "mongo" });
    } catch (err) {
      warnOnce(`Failed to read booking (${err instanceof Error ? err.message : "unknown"})`);
    }
  }
  const rec = memoryStore.get(ref);
  return rec ? toPublic(rec) : null;
}

export async function listBookings(status?: BookingStatus): Promise<BookingPublic[]> {
  await expireStale();
  const conn = await connectDB();
  if (conn) {
    try {
      const docs = await Booking.find(status ? { status } : {})
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
      return docs.map((d) => toPublic({ ...d, storage: "mongo" as const }));
    } catch (err) {
      warnOnce(`Failed to list bookings (${err instanceof Error ? err.message : "unknown"})`);
    }
  }
  return [...memoryStore.values()]
    .map((r) => toPublic(r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------------------------------------------------------- slips */

export async function uploadSlip(
  reference: string,
  file: { buffer: Buffer; contentType: string; fileName: string },
): Promise<BookingPublic> {
  const ref = reference.trim().toUpperCase();

  let processed = file.buffer;
  let contentType = file.contentType;
  try {
    const sharp = (await import("sharp")).default;
    processed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    contentType = "image/jpeg";
  } catch {
    // sharp unavailable — store the original upload as-is
  }

  const slip = {
    data: processed,
    contentType,
    fileName: file.fileName.slice(0, 120),
    size: processed.length,
    uploadedAt: new Date(),
  };

  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.findOneAndUpdate(
        { reference: ref, status: { $in: UPLOADABLE_STATUSES } },
        {
          $set: { slip, status: "awaiting_verification" },
          $unset: { rejectReason: "" },
        },
        { new: true },
      ).lean();
      if (!doc) {
        const exists = await Booking.findOne({ reference: ref }).lean();
        if (!exists) throw new BookingError("Booking not found.", 404);
        throw new BookingError(
          "This booking can no longer accept a slip. Contact the organizer.",
          409,
        );
      }
      return toPublic({ ...doc, storage: "mongo" });
    } catch (err) {
      if (err instanceof BookingError) throw err;
      warnOnce(`Slip upload failed (${err instanceof Error ? err.message : "unknown"})`);
    }
  }

  const rec = memoryStore.get(ref);
  if (!rec) throw new BookingError("Booking not found.", 404);
  if (!UPLOADABLE_STATUSES.includes(rec.status)) {
    throw new BookingError("This booking can no longer accept a slip. Contact the organizer.", 409);
  }
  rec.status = "awaiting_verification";
  rec.rejectReason = null;
  rec.slip = {
    data: slip.data,
    contentType: slip.contentType,
    fileName: slip.fileName,
    size: slip.size,
    uploadedAt: slip.uploadedAt.toISOString(),
  };
  return toPublic(rec);
}

export async function getSlip(
  reference: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  const ref = reference.trim().toUpperCase();
  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.findOne({ reference: ref }).select("+slip.data").lean();
      const data = doc?.slip?.data as Buffer | undefined;
      if (doc && data) {
        return { data, contentType: doc.slip?.contentType ?? "image/jpeg" };
      }
      return null;
    } catch (err) {
      warnOnce(`Slip read failed (${err instanceof Error ? err.message : "unknown"})`);
    }
  }
  const rec = memoryStore.get(ref);
  if (rec?.slip?.data) {
    return { data: rec.slip.data, contentType: rec.slip.contentType };
  }
  return null;
}

/* ------------------------------------------------------------ admin ops */

export type AdminAction = "confirm" | "reject" | "checkin";

export async function applyAction(
  reference: string,
  action: AdminAction,
  reason?: string,
): Promise<BookingPublic> {
  const ref = reference.trim().toUpperCase();
  const now = new Date();

  const allowed: Record<AdminAction, BookingStatus[]> = {
    confirm: ["pending", "awaiting_verification", "rejected"],
    reject: ["pending", "awaiting_verification"],
    checkin: ["confirmed"],
  };
  const fail = (msg: string): never => {
    throw new BookingError(msg, 409);
  };

  const conn = await connectDB();
  if (conn) {
    try {
      const current = await Booking.findOne({ reference: ref }).lean();
      if (!current) throw new BookingError("Booking not found.", 404);
      if (!allowed[action].includes(current.status)) {
        fail(
          `Cannot ${action} a booking in status "${current.status}".`,
        );
      }

      const update: Record<string, unknown> = {};
      if (action === "confirm") {
        update.status = "confirmed";
        update.verifiedAt = now;
        update.rejectReason = "";
      } else if (action === "reject") {
        update.status = "rejected";
        update.rejectReason = (reason ?? "").slice(0, 200) || "Slip could not be verified.";
      } else {
        update.status = "checked_in";
        update.checkedInAt = now;
      }

      const doc = await Booking.findOneAndUpdate(
        { reference: ref, status: { $in: allowed[action] } },
        { $set: update },
        { new: true },
      ).lean();
      if (!doc) fail(`Cannot ${action} a booking in status "${current.status}".`);
      return toPublic({ ...(doc as NonNullable<typeof doc>), storage: "mongo" });
    } catch (err) {
      if (err instanceof BookingError) throw err;
      warnOnce(`Action failed (${err instanceof Error ? err.message : "unknown"})`);
    }
  }

  const rec = memoryStore.get(ref);
  if (!rec) throw new BookingError("Booking not found.", 404);
  if (!allowed[action].includes(rec.status)) {
    throw new BookingError(`Cannot ${action} a booking in status "${rec.status}".`, 409);
  }
  if (action === "confirm") {
    rec.status = "confirmed";
    rec.verifiedAt = now.toISOString();
    rec.rejectReason = null;
  } else if (action === "reject") {
    rec.status = "rejected";
    rec.rejectReason = (reason ?? "").slice(0, 200) || "Slip could not be verified.";
  } else {
    rec.status = "checked_in";
    rec.checkedInAt = now.toISOString();
  }
  return toPublic(rec);
}

export async function getStats(): Promise<{
  byStatus: Record<string, number>;
  totalBookings: number;
  activeQty: number;
  remaining: number;
  capacity: number;
}> {
  const { capacity, booked, remaining } = await getCapacityState();
  const all = await listBookings();
  const byStatus: Record<string, number> = {};
  for (const b of all) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
  return {
    byStatus,
    totalBookings: all.length,
    activeQty: booked,
    remaining,
    capacity,
  };
}
