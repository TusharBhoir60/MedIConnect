import mongoose, { Schema, Document } from "mongoose";
import type { StockoutReport as IStockoutReport } from "@/lib/types";

export interface StockoutReportDocument extends Omit<IStockoutReport, "id">, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockoutReportSchema = new Schema<StockoutReportDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    phcId: { type: String, required: true, index: true },
    medicine: { type: String, required: true },
    reportedBy: { type: String, required: true },
    patientId: { type: String },
    note: { type: String },
    at: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["reported", "acknowledged", "restocked"],
      default: "reported",
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

export const StockoutReportModel =
  mongoose.models.StockoutReport ||
  mongoose.model<StockoutReportDocument>("StockoutReport", StockoutReportSchema);

