export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FollowUpModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const followUp = await FollowUpModel.findOne({ id: params.id });

    if (!followUp) {
      return NextResponse.json({ success: false, error: "Follow-up not found" }, { status: 404 });
    }

    if (body.action === "markDone" || body.done !== undefined) {
      followUp.done = body.done ?? true;
    } else {
      Object.assign(followUp, body);
    }

    await followUp.save();
    return NextResponse.json({ success: true, data: followUp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

