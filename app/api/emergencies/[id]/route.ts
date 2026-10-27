export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmergencyModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const emergency = await EmergencyModel.findOne({ id: params.id });

    if (!emergency) {
      return NextResponse.json({ success: false, error: "Emergency not found" }, { status: 404 });
    }

    if (body.action === "close") {
      emergency.status = "closed";
    } else if (body.action === "acknowledge") {
      emergency.acknowledgedAt = new Date().toISOString();
    } else if (body.action === "escalate") {
      emergency.status = "escalated";
      emergency.escalatedAt = new Date().toISOString();
    } else {
      Object.assign(emergency, body);
    }

    await emergency.save();
    return NextResponse.json({ success: true, data: emergency });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

