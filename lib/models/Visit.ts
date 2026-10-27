import mongoose, { Schema, Document } from "mongoose";
import type { Visit as IVisit, VoiceNote, Attachment } from "@/lib/types";

const VoiceNoteSchema = new Schema<VoiceNote>(
  {
    id: { type: String, required: true },
    createdAt: { type: String, required: true },
    durationSec: { type: Number, required: true, min: 0 },
    dataUrl: { type: String },
    transcript: { type: String, default: "" },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<Attachment>(
  {
    id: { type: String, required: true },
    kind: { type: String, enum: ["prescription", "photo", "report"], required: true },
    name: { type: String, required: true },
    dataUrl: { type: String, required: true },
  },
  { _id: false }
);

export interface VisitDocument extends Omit<IVisit, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<VisitDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    ashaId: { type: String, required: true, index: true },
    at: { type: String, required: true, index: true },
    place: { type: String, required: true },
    notes: { type: String, default: "" },
    voiceNotes: [VoiceNoteSchema],
    attachments: [AttachmentSchema],
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed", "referred"],
      default: "draft",
      index: true,
    },
    triage: {
      type: String,
      enum: ["pending", "not_emergency", "emergency", "refer_dh"],
      default: "pending",
      index: true,
    },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
      index: true,
    },
    offlineQueued: { type: Boolean, default: false },
    submittedAt: { type: String },
    doctorAdvice: { type: String },
    doctorId: { type: String },
    reviewedAt: { type: String },
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

export const VisitModel =
  mongoose.models.Visit || mongoose.model<VisitDocument>("Visit", VisitSchema);

