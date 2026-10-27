export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AppointmentModel } from "@/lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const appointment = await AppointmentModel.findOne({ id: params.id });

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    if (body.action === "cancel" || body.status === "cancelled") {
      appointment.status = "cancelled";
    } else {
      Object.assign(appointment, body);
    }

    await appointment.save();
    return NextResponse.json({ success: true, data: appointment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

