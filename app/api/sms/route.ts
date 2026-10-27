export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SmsModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const sms = await SmsModel.find({}).sort({ at: -1 });
    return NextResponse.json({ success: true, count: sms.length, data: sms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const id = body.id || uid("sms");
    const at = body.at || new Date().toISOString();

    const sms = await SmsModel.create({
      ...body,
      id,
      at,
    });

    return NextResponse.json({ success: true, data: sms }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

