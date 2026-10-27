import mongoose, { Schema, Document } from "mongoose";
import type { Emergency as IEmergency } from "@/lib/types";

export interface EmergencyDocument extends Omit<IEmergency, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencySchema = new Schema<EmergencyDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    visitId: { type: String },
    raisedBy: { type: String, enum: ["asha", "doctor", "patient"], required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "escalated", "closed"],
      default: "open",
      index: true,
    },
    at: { type: String, required: true, index: true },
    destination: { type: String, required: true },
    acknowledgedAt: { type: String },
    escalatedAt: { type: String },
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

export const EmergencyModel =
  mongoose.models.Emergency || mongoose.model<EmergencyDocument>("Emergency", EmergencySchema);

