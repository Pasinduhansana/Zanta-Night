import { Schema, model, models, type Model } from "mongoose";

export type AuthSessionAttrs = {
  email: string;
  /** SHA-256 of the opaque session token — a database leak cannot forge cookies. */
  tokenHash: string;
  expiresAt: Date;
};

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const AuthSessionSchema = new Schema<AuthSessionAttrs>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSession: Model<AuthSessionAttrs> =
  (models.AuthSession as Model<AuthSessionAttrs>) ||
  model<AuthSessionAttrs>("AuthSession", AuthSessionSchema);
