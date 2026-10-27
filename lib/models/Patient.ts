import mongoose, { Schema, Document } from "mongoose";
import type { Patient as IPatient, CareDue } from "@/lib/types";

const CareDueSchema = new Schema<CareDue>(
  {
    id: { type: String, required: true },
    kind: { type: String, enum: ["anc", "immunisation", "ncd"], required: true },
    label: { type: String, required: true },
    dueDate: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

export interface PatientDocument extends Omit<IPatient, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<PatientDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    abhaId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    village: { type: String, required: true, trim: true, index: true },
    taluka: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    sex: { type: String, enum: ["F", "M", "O"], required: true },
    phone: { type: String, required: true, index: true },
    language: { type: String, enum: ["en", "hi", "mr"], default: "mr" },
    risk: {
      type: String,
      enum: ["routine", "maternal", "child", "chronic", "emergency"],
      default: "routine",
      index: true,
    },
    conditions: [{ type: String, trim: true }],
    ashaId: { type: String, required: true, index: true },
    carePlan: [CareDueSchema],
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

export const PatientModel =
  mongoose.models.Patient || mongoose.model<PatientDocument>("Patient", PatientSchema);

