import mongoose, { Schema, Document } from "mongoose";
import type { IvrCall as IIvrCall } from "@/lib/types";

export interface IvrCallDocument extends Omit<IIvrCall, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const IvrCallSchema = new Schema<IvrCallDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    visitId: { type: String, default: "" },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: "" },
    patientPhone: { type: String, required: true },
    patientLang: { type: String, default: "mr" },
    visitNotes: { type: String, default: "" },
    complaint: { type: String, default: "" },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
    },
    type: { type: String, enum: ["followup", "general"], default: "followup" },
    status: {
      type: String,
      enum: ["scheduled", "triggered", "completed", "failed", "no_answer"],
      default: "scheduled",
      index: true,
    },
    scheduledFor: { type: String, required: true, index: true },
    triggeredAt: { type: String },
    completedAt: { type: String },
    patientResponse: { type: String, enum: ["1", "2", "3", null], default: null },
    responseLabel: { type: String },
    callSid: { type: String, index: true },
    duration: { type: String },
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

export const IvrCallModel =
  mongoose.models.IvrCall || mongoose.model<IvrCallDocument>("IvrCall", IvrCallSchema);

