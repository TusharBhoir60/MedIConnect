import mongoose, { Schema, Document } from "mongoose";
import type { Referral as IReferral } from "@/lib/types";

export interface ReferralDocument extends Omit<IReferral, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<ReferralDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    visitId: { type: String },
    fromPhcId: { type: String, required: true, index: true },
    toFacility: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { type: String, enum: ["urgent", "routine"], default: "routine" },
    status: {
      type: String,
      enum: ["referred", "reached", "treated", "lost"],
      default: "referred",
      index: true,
    },
    at: { type: String, required: true, index: true },
    reachedAt: { type: String },
    outcome: { type: String },
    doctorId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ReferralModel =
  mongoose.models.Referral || mongoose.model<ReferralDocument>("Referral", ReferralSchema);

