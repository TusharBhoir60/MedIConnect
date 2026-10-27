export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AppointmentModel } from "@/lib/models";
import { AppointmentSchemaValidator } from "@/lib/validators";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const appointments = await AppointmentModel.find({}).sort({ date: 1 });
    return NextResponse.json({ success: true, count: appointments.length, data: appointments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = AppointmentSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("a");
    const appointment = await AppointmentModel.create({
      ...parsed.data,
      id,
      status: body.status || "booked",
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

