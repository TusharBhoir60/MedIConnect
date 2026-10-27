export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ReferralModel } from "@/lib/models";
import { ReferralSchemaValidator } from "@/lib/validators";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    await connectDB();
    const referrals = await ReferralModel.find({}).sort({ at: -1 });
    return NextResponse.json({ success: true, count: referrals.length, data: referrals });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = ReferralSchemaValidator.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const id = body.id || uid("ref");
    const at = body.at || new Date().toISOString();

    const referral = await ReferralModel.create({
      ...parsed.data,
      id,
      at,
      status: body.status || "referred",
    });

    return NextResponse.json({ success: true, data: referral }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

