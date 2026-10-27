export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VisitModel } from "@/lib/models";
import { VisitSchemaValidator } from "@/lib/validators";
import { ASHA } from "@/lib/seed";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const filter: Record<string, any> = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const visits = await VisitModel.find(filter).sort({ at: -1 });
    return NextResponse.json({ success: true, count: visits.length, data: visits });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = VisitSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("v");
    const ashaId = body.ashaId || ASHA.id;
    const at = body.at || new Date().toISOString();

    const visit = await VisitModel.create({
      ...parsed.data,
      id,
      ashaId,
      at,
      status: body.status || "draft",
      triage: body.triage || "pending",
      voiceNotes: parsed.data.voiceNotes.map((vn: any) => ({
        ...vn,
        id: vn.id || uid("vn"),
      })),
      attachments: parsed.data.attachments.map((att: any) => ({
        ...att,
        id: att.id || uid("att"),
      })),
    });

    return NextResponse.json({ success: true, data: visit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

