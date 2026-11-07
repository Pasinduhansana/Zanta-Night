import { Schema, model, models, type Model } from "mongoose";

export type OtpCodeAttrs = {
  email: string;
  /** HMAC-SHA256 of (email + code) with a server-side secret — never the code itself. */
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
};

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const OtpCodeSchema = new Schema<OtpCodeAttrs>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0, min: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Mongo removes expired codes automatically; explicit checks still guard verification.
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode: Model<OtpCodeAttrs> =
  (models.OtpCode as Model<OtpCodeAttrs>) || model<OtpCodeAttrs>("OtpCode", OtpCodeSchema);
