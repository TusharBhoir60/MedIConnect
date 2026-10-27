export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CallLogModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const calls = await CallLogModel.find({}).sort({ startedAt: -1 });
    return NextResponse.json({ success: true, count: calls.length, data: calls });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const id = body.id || uid("call");
    const call = await CallLogModel.create({
      ...body,
      id,
    });

    return NextResponse.json({ success: true, data: call }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

