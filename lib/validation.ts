import { z } from "zod";
import { EVENT } from "@/lib/event-config";
import type { Dict } from "@/lib/i18n/en";

export type BookingMessages = Dict["booking"]["errors"];

const defaultMessages: BookingMessages = {
  nameRequired: "Please enter your full name",
  nameTooLong: "Name is too long",
  emailRequired: "Email is required",
  emailInvalid: "Enter a valid email address",
  emailTooLong: "Email is too long",
  phoneInvalid: "Enter a valid phone number",
  phoneTooLong: "Phone number is too long",
  phoneChars: "Only numbers, spaces and + ( ) - are allowed",
  qtyRequired: "Quantity is required",
  qtyInt: "Quantity must be a whole number",
  qtyMin: "Select at least 1 ticket",
  qtyMax: (max: number) => `Maximum ${max} tickets per booking`,
  notesTooLong: "Notes must be 300 characters or less",
};

export function bookingSchema(messages?: BookingMessages) {
  const m = messages ?? defaultMessages;
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, m.nameRequired)
      .max(80, m.nameTooLong),
    email: z
      .string()
      .trim()
      .min(1, m.emailRequired)
      .email(m.emailInvalid)
      .max(120, m.emailTooLong),
    phone: z
      .string()
      .trim()
      .min(9, m.phoneInvalid)
      .max(20, m.phoneTooLong)
      .regex(/^[0-9+()\-\s]+$/, m.phoneChars),
    quantity: z.coerce
      .number({ message: m.qtyRequired })
      .int(m.qtyInt)
      .min(1, m.qtyMin)
      .max(EVENT.ticket.maxPerOrder, m.qtyMax(EVENT.ticket.maxPerOrder)),
    notes: z
      .string()
      .trim()
      .max(300, m.notesTooLong)
      .optional()
      .or(z.literal("")),
  });
}

export type BookingSchema = ReturnType<typeof bookingSchema>;
export type BookingInput = z.infer<BookingSchema>;
export type BookingFormValues = z.input<BookingSchema>;

export type BookingStatus =
  | "pending"
  | "awaiting_verification"
  | "confirmed"
  | "checked_in"
  | "rejected"
  | "expired";

export type SlipInfo = {
  fileName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
};

export type BookingPublic = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketCategory: string;
  status: BookingStatus;
  storage: "mongo" | "memory";
  createdAt: string;
  rejectReason?: string | null;
  verifiedAt?: string | null;
  checkedInAt?: string | null;
  slip?: SlipInfo | null;
};
