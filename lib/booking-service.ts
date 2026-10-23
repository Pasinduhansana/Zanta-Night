import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { Booking } from "@/lib/models/Booking";
import { EVENT } from "@/lib/event-config";
import type { BookingInput, BookingPublic } from "@/lib/validation";

const MONGODB_URI = process.env.MONGODB_URI;

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

/** Returns a live mongoose connection, or null when Mongo is not reachable. */
export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    warnOnce("MONGODB_URI is not set — falling back to the in-memory store.");
    return null;
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 4000 })
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

type MemoryStore = Map<string, BookingPublic>;
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

function sanitize(input: BookingInput): Omit<BookingPublic, "reference" | "storage" | "createdAt"> {
  const unitPrice = EVENT.ticket.price;
  const quantity = input.quantity;
  return {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    quantity,
    unitPrice,
    total: unitPrice * quantity,
    ticketCategory: EVENT.ticket.category,
    status: "confirmed",
  };
}

export async function createBooking(input: BookingInput): Promise<BookingPublic> {
  const base = sanitize(input);
  const reference = makeReference();
  const createdAt = new Date().toISOString();

  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.create({ reference, ...base, notes: input.notes || undefined });
      const obj = doc.toObject({ flattenObjectIds: true }) as Record<string, unknown>;
      delete obj._id;
      delete obj.__v;
      delete obj.updatedAt;
      delete obj.createdAt;
      delete obj.reference;
      delete obj.storage;
      return { ...base, reference, createdAt, storage: "mongo", ...obj } as BookingPublic;
    } catch (err) {
      warnOnce(
        `Failed to persist booking (${err instanceof Error ? err.message : "unknown"}) — using the in-memory store.`,
      );
    }
  }

  const record: BookingPublic = { ...base, reference, createdAt, storage: "memory" };
  memoryStore.set(reference, record);
  return record;
}

export async function findBooking(reference: string): Promise<BookingPublic | null> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return null;

  const conn = await connectDB();
  if (conn) {
    try {
      const doc = await Booking.findOne({ reference: ref }).lean();
      if (doc) {
        const rest = { ...(doc as Record<string, unknown>) };
        delete rest._id;
        delete rest.__v;
        delete rest.updatedAt;
        const createdAtRaw = rest.createdAt;
        delete rest.createdAt;
        delete rest.reference;
        delete rest.storage;
        return {
          ...rest,
          reference: ref,
          storage: "mongo",
          createdAt:
            createdAtRaw instanceof Date
              ? createdAtRaw.toISOString()
              : String(createdAtRaw ?? new Date().toISOString()),
        } as BookingPublic;
      }
    } catch (err) {
      warnOnce(`Failed to read booking (${err instanceof Error ? err.message : "unknown"}) — using the in-memory store.`);
    }
  }

  return memoryStore.get(ref) ?? null;
}
