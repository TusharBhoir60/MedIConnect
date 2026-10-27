export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { LabOrderModel } from "@/lib/models";
import { LabOrderSchemaValidator } from "@/lib/validators";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const labs = await LabOrderModel.find({}).sort({ orderedAt: -1 });
    return NextResponse.json({ success: true, count: labs.length, data: labs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = LabOrderSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("lab");
    const orderedAt = body.orderedAt || new Date().toISOString();

    const lab = await LabOrderModel.create({
      ...parsed.data,
      id,
      status: body.status || "ordered",
      orderedAt,
    });

    return NextResponse.json({ success: true, data: lab }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

