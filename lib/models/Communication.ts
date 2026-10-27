import mongoose, { Schema, Document } from "mongoose";
import type { Sms as ISms, CallLog as ICallLog } from "@/lib/types";

export interface SmsDocument extends Omit<ISms, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const SmsSchema = new Schema<SmsDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    to: { type: String, required: true },
    body: { type: String, required: true },
    at: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["appointment", "availability", "emergency", "followup", "referral", "lab"],
      default: "followup",
    },
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

export const SmsModel = mongoose.models.Sms || mongoose.model<SmsDocument>("Sms", SmsSchema);

export interface CallLogDocument extends Omit<ICallLog, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema = new Schema<CallLogDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    startedAt: { type: String, required: true, index: true },
    endedAt: { type: String },
    outcome: { type: String, default: "" },
    transcript: [
      {
        role: { type: String, enum: ["ai", "user"], required: true },
        text: { type: String, required: true },
      },
    ],
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

export const CallLogModel =
  mongoose.models.CallLog || mongoose.model<CallLogDocument>("CallLog", CallLogSchema);

