import mongoose, { Schema, Document } from "mongoose";
import type { FollowUp as IFollowUp } from "@/lib/types";

export interface FollowUpDocument extends Omit<IFollowUp, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<FollowUpDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    visitId: { type: String, default: "" },
    from: { type: String, enum: ["doctor", "phc"], default: "doctor" },
    message: { type: String, required: true },
    dueDate: { type: String, required: true, index: true },
    done: { type: Boolean, default: false, index: true },
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

export const FollowUpModel =
  mongoose.models.FollowUp || mongoose.model<FollowUpDocument>("FollowUp", FollowUpSchema);

