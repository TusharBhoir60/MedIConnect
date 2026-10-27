export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VisitModel, FollowUpModel, EmergencyModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const visit = await VisitModel.findOne({ id: params.id });
    if (!visit) {
      return NextResponse.json({ success: false, error: "Visit not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: visit });
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
    const visit = await VisitModel.findOne({ id: params.id });

    if (!visit) {
      return NextResponse.json({ success: false, error: "Visit not found" }, { status: 404 });
    }

    if (body.action === "submit") {
      visit.status = "submitted";
      visit.submittedAt = new Date().toISOString();
      visit.offlineQueued = false;
      await visit.save();
      return NextResponse.json({ success: true, data: visit });
    }

    if (body.action === "markOffline") {
      visit.offlineQueued = true;
      await visit.save();
      return NextResponse.json({ success: true, data: visit });
    }

    if (body.action === "setUrgency") {
      visit.urgency = body.urgency;
      await visit.save();
      return NextResponse.json({ success: true, data: visit });
    }

    if (body.action === "addVoice") {
      visit.voiceNotes.push({
        ...body.note,
        id: body.note.id || uid("vn"),
      });
      await visit.save();
      return NextResponse.json({ success: true, data: visit });
    }

    if (body.action === "addAttachment") {
      visit.attachments.push({
        ...body.attachment,
        id: body.attachment.id || uid("att"),
      });
      await visit.save();
      return NextResponse.json({ success: true, data: visit });
    }

    if (body.action === "review") {
      const { triage, advice, doctorId } = body;
      visit.triage = triage;
      visit.doctorAdvice = advice;
      visit.doctorId = doctorId;
      visit.reviewedAt = new Date().toISOString();
      visit.status = triage === "refer_dh" ? "referred" : "reviewed";
      await visit.save();

      // Automatically create follow-up if advice given
      if (advice) {
        await FollowUpModel.create({
          id: uid("f"),
          patientId: visit.patientId,
          visitId: visit.id,
          from: "doctor",
          message: advice,
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
          done: false,
        });
      }

      // Automatically create emergency escalation if marked emergency
      if (triage === "emergency") {
        await EmergencyModel.create({
          id: uid("e"),
          patientId: visit.patientId,
          visitId: visit.id,
          raisedBy: "doctor",
          reason: advice || "Doctor marked emergency",
          status: "escalated",
          at: new Date().toISOString(),
          destination: "Rural Hospital / 108",
        });
      }

      return NextResponse.json({ success: true, data: visit });
    }

    // Default patch
    Object.assign(visit, body);
    await visit.save();
    return NextResponse.json({ success: true, data: visit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

