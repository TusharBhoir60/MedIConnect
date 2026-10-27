export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PatientModel } from "@/lib/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const patient = await PatientModel.findOne({ id: params.id });
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if this is a markCareDone request
    if (body.action === "markCareDone" && body.careId) {
      const patient = await PatientModel.findOne({ id: params.id });
      if (!patient) {
        return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
      }

      patient.carePlan = (patient.carePlan || []).map((c: any) =>
        c.id === body.careId ? { ...c, done: true } : c
      );
      await patient.save();
      return NextResponse.json({ success: true, data: patient });
    }

    const updated = await PatientModel.findOneAndUpdate(
      { id: params.id },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

