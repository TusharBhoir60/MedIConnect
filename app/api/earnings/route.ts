export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EarningModel } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();
    const earnings = await EarningModel.find({}).sort({ date: -1 });
    return NextResponse.json({ success: true, count: earnings.length, data: earnings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

