import { Schema, model, models, type Model } from "mongoose";

export type TicketScanRecord = {
  at: Date;
  method: string;
};

export type TicketDownloadRecord = {
  at: Date;
  format: "png" | "jpg" | "pdf";
};

export type TicketAttrs = {
  ticketId: string;
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  seatIndex: number;
  status: "unused" | "used";
  issuedAt: Date;
  usedAt?: Date;
  scans: TicketScanRecord[];
  downloadCount: number;
  downloadHistory: TicketDownloadRecord[];
};

const TicketSchema = new Schema<TicketAttrs>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    bookingRef: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true, lowercase: true, trim: true },
    seatIndex: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["unused", "used"],
      default: "unused",
      index: true,
    },
    issuedAt: { type: Date, required: true },
    usedAt: { type: Date },
    scans: [{ at: { type: Date, required: true }, method: { type: String, required: true } }],
    downloadCount: { type: Number, required: true, default: 0, min: 0 },
    downloadHistory: [
      {
        at: { type: Date, required: true },
        format: { type: String, enum: ["png", "jpg", "pdf"], required: true },
      },
    ],
  },
  { timestamps: true },
);

// One seat position per booking — doubles as the duplicate-issuance backstop.
TicketSchema.index({ bookingRef: 1, seatIndex: 1 }, { unique: true });

export const Ticket: Model<TicketAttrs> =
  (models.Ticket as Model<TicketAttrs>) || model<TicketAttrs>("Ticket", TicketSchema);
