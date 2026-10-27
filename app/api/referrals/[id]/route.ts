export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ReferralModel, FollowUpModel } from "@/lib/models";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const referral = await ReferralModel.findOne({ id: params.id });

    if (!referral) {
      return NextResponse.json({ success: false, error: "Referral not found" }, { status: 404 });
    }

    const { status, outcome } = body;
    if (status) {
      referral.status = status;
      if (status === "reached" && !referral.reachedAt) {
        referral.reachedAt = new Date().toISOString();
      }
      if (outcome !== undefined) {
        referral.outcome = outcome;
      }

      // If marked lost, auto-create follow-up
      if (status === "lost") {
        await FollowUpModel.create({
          id: uid("f"),
          patientId: referral.patientId,
          visitId: referral.visitId || "",
          from: "phc",
          message:
            "Referral not reached — visit home, counsel family, arrange travel & re-refer.",
          dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          done: false,
        });
      }
    } else {
      Object.assign(referral, body);
    }

    await referral.save();
    return NextResponse.json({ success: true, data: referral });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

