import mongoose, { Schema, Document } from "mongoose";
import type { LabOrder as ILabOrder } from "@/lib/types";

export interface LabOrderDocument extends Omit<ILabOrder, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabOrderSchema = new Schema<LabOrderDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    visitId: { type: String },
    phcId: { type: String, required: true, index: true },
    test: { type: String, required: true },
    status: {
      type: String,
      enum: ["ordered", "sample_collected", "result_ready", "delivered"],
      default: "ordered",
      index: true,
    },
    orderedAt: { type: String, required: true },
    orderedBy: { type: String, required: true },
    resultAt: { type: String },
    result: { type: String },
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

export const LabOrderModel =
  mongoose.models.LabOrder || mongoose.model<LabOrderDocument>("LabOrder", LabOrderSchema);

