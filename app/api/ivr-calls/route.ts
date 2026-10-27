export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { IvrCallModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const calls = await IvrCallModel.find({}).sort({ scheduledFor: -1 });
    return NextResponse.json({ success: true, count: calls.length, data: calls });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const id = body.id || uid("ivr");
    const delayMs = body.urgency === "urgent" ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const scheduledFor = body.scheduledFor || new Date(Date.now() + delayMs).toISOString();

    const ivrCall = await IvrCallModel.create({
      ...body,
      id,
      status: body.status || "scheduled",
      scheduledFor,
    });

    return NextResponse.json({ success: true, data: ivrCall }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

