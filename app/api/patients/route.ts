export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PatientModel } from "@/lib/models";
import { PatientSchemaValidator } from "@/lib/validators";
import { ASHA } from "@/lib/seed";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    const filter: Record<string, any> = {};
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { village: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { abhaId: { $regex: query, $options: "i" } },
      ];
    }

    const patients = await PatientModel.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: patients.length, data: patients });
  } catch (error: any) {
    console.error("[api/patients GET] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = PatientSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("p");
    const abhaId =
      body.abhaId ||
      `12-3456-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ashaId = body.ashaId || ASHA.id;

    const patient = await PatientModel.create({
      ...parsed.data,
      id,
      abhaId,
      ashaId,
    });

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error: any) {
    console.error("[api/patients POST] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

