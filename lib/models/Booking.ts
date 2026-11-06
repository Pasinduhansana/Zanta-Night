import { Schema, model, models, type Model } from "mongoose";

export type BookingStatus =
  | "pending"
  | "awaiting_verification"
  | "confirmed"
  | "checked_in"
  | "rejected"
  | "expired";

export type BookingAttrs = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketCategory: string;
  status: BookingStatus;
  notes?: string;
  rejectReason?: string;
  slip?: {
    /** R2 object key — set when the slip is stored in Cloudflare R2. */
    key?: string;
    /** Raw image bytes — only for the non-R2 fallback store. */
    data?: Buffer;
    contentType: string;
    fileName: string;
    size: number;
    uploadedAt: Date;
  };
  verifiedAt?: Date;
  checkedInAt?: Date;
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
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_verification",
        "confirmed",
        "checked_in",
        "rejected",
        "expired",
      ],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true },
    rejectReason: { type: String, trim: true },
    slip: {
      key: { type: String },
      data: { type: Buffer, select: false },
      contentType: { type: String },
      fileName: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    verifiedAt: { type: Date },
    checkedInAt: { type: Date },
  },
  { timestamps: true },
);

BookingSchema.index({ status: 1, createdAt: 1 });

export const Booking: Model<BookingAttrs> =
  (models.Booking as Model<BookingAttrs>) || model<BookingAttrs>("Booking", BookingSchema);
