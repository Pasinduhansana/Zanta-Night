import { Schema, model, models, type Model } from "mongoose";

export type BookingAttrs = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketCategory: string;
  status: "confirmed" | "pending";
  notes?: string;
};

const BookingSchema = new Schema<BookingAttrs>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    ticketCategory: { type: String, required: true },
    status: { type: String, enum: ["confirmed", "pending"], default: "confirmed" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Booking: Model<BookingAttrs> =
  (models.Booking as Model<BookingAttrs>) || model<BookingAttrs>("Booking", BookingSchema);
