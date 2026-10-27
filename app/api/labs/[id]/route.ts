export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { LabOrderModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const lab = await LabOrderModel.findOne({ id: params.id });

    if (!lab) {
      return NextResponse.json({ success: false, error: "Lab order not found" }, { status: 404 });
    }

    const { status, result } = body;
    if (status) {
      lab.status = status;
      if (result !== undefined) lab.result = result;
      if (status === "result_ready" && !lab.resultAt) {
        lab.resultAt = new Date().toISOString();
      }
    } else {
      Object.assign(lab, body);
    }

    await lab.save();
    return NextResponse.json({ success: true, data: lab });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

