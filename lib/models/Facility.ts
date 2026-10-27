import mongoose, { Schema, Document } from "mongoose";
import type { Phc as IPhc, Doctor as IDoctor, Asha as IAsha } from "@/lib/types";

export interface PhcDocument extends Omit<IPhc, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhcSchema = new Schema<PhcDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    village: { type: String, required: true },
    district: { type: String, required: true },
    open: { type: String, default: "08:00" },
    close: { type: String, default: "16:00" },
    todayOpen: { type: Boolean, default: true },
    doctorsOnDuty: [{ type: String }],
    queueMinutes: { type: Number, default: 15 },
    medicines: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    diagnostics: [
      {
        name: { type: String, required: true },
        available: { type: Boolean, default: true },
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

export const PhcModel = mongoose.models.Phc || mongoose.model<PhcDocument>("Phc", PhcSchema);

export interface DoctorDocument extends Omit<IDoctor, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<DoctorDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    phcId: { type: String, required: true, index: true },
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

export const DoctorModel =
  mongoose.models.Doctor || mongoose.model<DoctorDocument>("Doctor", DoctorSchema);

export interface AshaDocument extends Omit<IAsha, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const AshaSchema = new Schema<AshaDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phcId: { type: String, required: true, index: true },
    village: { type: String, required: true },
    phone: { type: String, required: true },
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

export const AshaModel = mongoose.models.Asha || mongoose.model<AshaDocument>("Asha", AshaSchema);

