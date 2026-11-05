import { z } from "zod";
import { EVENT } from "@/lib/event-config";

export const bookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(120, "Email is too long"),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[0-9+()\-\s]+$/, "Only numbers, spaces and + ( ) - are allowed"),
  quantity: z.coerce
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Select at least 1 ticket")
    .max(EVENT.ticket.maxPerOrder, `Maximum ${EVENT.ticket.maxPerOrder} tickets per booking`),
  notes: z
    .string()
    .trim()
    .max(300, "Notes must be 300 characters or less")
    .optional()
    .or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingFormValues = z.input<typeof bookingSchema>;

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
