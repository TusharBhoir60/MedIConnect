export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FollowUpModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const followUps = await FollowUpModel.find({}).sort({ dueDate: 1 });
    return NextResponse.json({ success: true, count: followUps.length, data: followUps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const id = body.id || uid("f");
    const followUp = await FollowUpModel.create({
      ...body,
      id,
      done: body.done || false,
    });

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

