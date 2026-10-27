export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StockoutReportModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const stockout = await StockoutReportModel.findOne({ id: params.id });

    if (!stockout) {
      return NextResponse.json({ success: false, error: "Stockout report not found" }, { status: 404 });
    }

    if (body.status) {
      stockout.status = body.status;
    } else {
      Object.assign(stockout, body);
    }

    await stockout.save();
    return NextResponse.json({ success: true, data: stockout });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

