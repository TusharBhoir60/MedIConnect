export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { IvrCallModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const ivrCall = await IvrCallModel.findOne({ id: params.id });

    if (!ivrCall) {
      return NextResponse.json({ success: false, error: "IVR call not found" }, { status: 404 });
    }

    Object.assign(ivrCall, body);
    await ivrCall.save();
    return NextResponse.json({ success: true, data: ivrCall });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

