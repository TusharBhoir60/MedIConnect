import mongoose, { Schema, Document } from "mongoose";
import type { Appointment as IAppointment } from "@/lib/types";

export interface AppointmentDocument extends Omit<IAppointment, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    phcId: { type: String, required: true, index: true },
    doctorId: { type: String },
    date: { type: String, required: true, index: true },
    slot: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["booked", "confirmed", "completed", "cancelled", "no_show"],
      default: "booked",
      index: true,
    },
    source: {
      type: String,
      enum: ["patient", "asha", "ai_call"],
      default: "patient",
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

export const AppointmentModel =
  mongoose.models.Appointment ||
  mongoose.model<AppointmentDocument>("Appointment", AppointmentSchema);

