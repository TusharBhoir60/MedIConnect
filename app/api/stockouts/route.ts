export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StockoutReportModel } from "@/lib/models";
import { StockoutReportSchemaValidator } from "@/lib/validators";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const stockouts = await StockoutReportModel.find({}).sort({ at: -1 });
    return NextResponse.json({ success: true, count: stockouts.length, data: stockouts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = StockoutReportSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("st");
    const at = body.at || new Date().toISOString();

    const stockout = await StockoutReportModel.create({
      ...parsed.data,
      id,
      at,
      status: body.status || "reported",
    });

    return NextResponse.json({ success: true, data: stockout }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

