export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  PatientModel,
  VisitModel,
  FollowUpModel,
  EmergencyModel,
  ReferralModel,
  LabOrderModel,
  StockoutReportModel,
  EarningModel,
  AppointmentModel,
  SmsModel,
  CallLogModel,
  IvrCallModel,
} from "@/lib/models";
import {
  PATIENTS,
  VISITS,
  FOLLOWUPS,
  EMERGENCIES,
  REFERRALS,
  LABS,
  STOCKOUTS,
  EARNINGS,
  APPOINTMENTS,
  SMS,
  CALLS,
} from "@/lib/seed";

export async function GET() {
  try {
    await connectDB();

    // Check if db has patients; if completely empty, perform initial idempotent seed
    const patientCount = await PatientModel.countDocuments();
    if (patientCount === 0) {
      console.log("[api/sync] Empty database detected. Seeding initial records...");
      await Promise.all([
        PatientModel.insertMany(PATIENTS),
        VisitModel.insertMany(VISITS),
        FollowUpModel.insertMany(FOLLOWUPS),
        EmergencyModel.insertMany(EMERGENCIES),
        ReferralModel.insertMany(REFERRALS),
        LabOrderModel.insertMany(LABS),
        StockoutReportModel.insertMany(STOCKOUTS),
        EarningModel.insertMany(EARNINGS),
        AppointmentModel.insertMany(APPOINTMENTS),
        SmsModel.insertMany(SMS),
        CallLogModel.insertMany(CALLS),
      ]);
    }

    const [
      patients,
      visits,
      followUps,
      emergencies,
      referrals,
      labs,
      stockouts,
      earnings,
      appointments,
      sms,
      calls,
      ivrCalls,
    ] = await Promise.all([
      PatientModel.find({}).sort({ updatedAt: -1 }),
      VisitModel.find({}).sort({ at: -1 }),
      FollowUpModel.find({}).sort({ dueDate: 1 }),
      EmergencyModel.find({}).sort({ at: -1 }),
      ReferralModel.find({}).sort({ at: -1 }),
      LabOrderModel.find({}).sort({ orderedAt: -1 }),
      StockoutReportModel.find({}).sort({ at: -1 }),
      EarningModel.find({}).sort({ date: -1 }),
      AppointmentModel.find({}).sort({ date: 1 }),
      SmsModel.find({}).sort({ at: -1 }),
      CallLogModel.find({}).sort({ startedAt: -1 }),
      IvrCallModel.find({}).sort({ scheduledFor: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      patients,
      visits,
      followUps,
      emergencies,
      referrals,
      labs,
      stockouts,
      earnings,
      appointments,
      sms,
      calls,
      ivrCalls,
    });
  } catch (error: any) {
    console.error("[api/sync] Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "Database error during sync",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

