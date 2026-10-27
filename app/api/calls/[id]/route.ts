export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CallLogModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const call = await CallLogModel.findOne({ id: params.id });

    if (!call) {
      return NextResponse.json({ success: false, error: "Call log not found" }, { status: 404 });
    }

    Object.assign(call, body);
    await call.save();
    return NextResponse.json({ success: true, data: call });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

