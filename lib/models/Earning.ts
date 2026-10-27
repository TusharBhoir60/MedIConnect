import mongoose, { Schema, Document } from "mongoose";
import type { Earning as IEarning } from "@/lib/types";

export interface EarningDocument extends Omit<IEarning, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const EarningSchema = new Schema<EarningDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ashaId: { type: String, required: true, index: true },
    activity: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "paid"],
      default: "pending",
      index: true,
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

export const EarningModel =
  mongoose.models.Earning || mongoose.model<EarningDocument>("Earning", EarningSchema);

