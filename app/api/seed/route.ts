export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
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
  PhcModel,
  DoctorModel,
  AshaModel,
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
  PHCS,
  DOCTORS,
  ASHA,
} from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { reset = false, confirm = false } = body;

    // Safety check: protect production databases from accidental reset
    if (reset) {
      if (process.env.NODE_ENV === "production" && !confirm) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Destructive reset blocked in production. Provide confirm: true if intentional.",
          },
          { status: 403 }
        );
      }

      console.log("[api/seed] Clearing existing collections for reset...");
      await Promise.all([
        PatientModel.deleteMany({}),
        VisitModel.deleteMany({}),
        FollowUpModel.deleteMany({}),
        EmergencyModel.deleteMany({}),
        ReferralModel.deleteMany({}),
        LabOrderModel.deleteMany({}),
        StockoutReportModel.deleteMany({}),
        EarningModel.deleteMany({}),
        AppointmentModel.deleteMany({}),
        SmsModel.deleteMany({}),
        CallLogModel.deleteMany({}),
        PhcModel.deleteMany({}),
        DoctorModel.deleteMany({}),
        AshaModel.deleteMany({}),
      ]);
    }

    // Idempotent upsert operations
    console.log("[api/seed] Performing idempotent upsert of seed dataset...");

    const ops = [
      ...PATIENTS.map((p) =>
        PatientModel.updateOne({ id: p.id }, { $set: p }, { upsert: true })
      ),
      ...VISITS.map((v) =>
        VisitModel.updateOne({ id: v.id }, { $set: v }, { upsert: true })
      ),
      ...FOLLOWUPS.map((f) =>
        FollowUpModel.updateOne({ id: f.id }, { $set: f }, { upsert: true })
      ),
      ...EMERGENCIES.map((e) =>
        EmergencyModel.updateOne({ id: e.id }, { $set: e }, { upsert: true })
      ),
      ...REFERRALS.map((r) =>
        ReferralModel.updateOne({ id: r.id }, { $set: r }, { upsert: true })
      ),
      ...LABS.map((l) =>
        LabOrderModel.updateOne({ id: l.id }, { $set: l }, { upsert: true })
      ),
      ...STOCKOUTS.map((s) =>
        StockoutReportModel.updateOne({ id: s.id }, { $set: s }, { upsert: true })
      ),
      ...EARNINGS.map((e) =>
        EarningModel.updateOne({ id: e.id }, { $set: e }, { upsert: true })
      ),
      ...APPOINTMENTS.map((a) =>
        AppointmentModel.updateOne({ id: a.id }, { $set: a }, { upsert: true })
      ),
      ...SMS.map((s) =>
        SmsModel.updateOne({ id: s.id }, { $set: s }, { upsert: true })
      ),
      ...CALLS.map((c) =>
        CallLogModel.updateOne({ id: c.id }, { $set: c }, { upsert: true })
      ),
      ...PHCS.map((phc) =>
        PhcModel.updateOne({ id: phc.id }, { $set: phc }, { upsert: true })
      ),
      ...DOCTORS.map((d) =>
        DoctorModel.updateOne({ id: d.id }, { $set: d }, { upsert: true })
      ),
      AshaModel.updateOne({ id: ASHA.id }, { $set: ASHA }, { upsert: true }),
    ];

    await Promise.all(ops);

    const counts = {
      patients: await PatientModel.countDocuments(),
      visits: await VisitModel.countDocuments(),
      followUps: await FollowUpModel.countDocuments(),
      emergencies: await EmergencyModel.countDocuments(),
      referrals: await ReferralModel.countDocuments(),
      labs: await LabOrderModel.countDocuments(),
      stockouts: await StockoutReportModel.countDocuments(),
      earnings: await EarningModel.countDocuments(),
      appointments: await AppointmentModel.countDocuments(),
    };

    return NextResponse.json({
      success: true,
      message: reset ? "Database successfully reset and seeded" : "Database successfully seeded (idempotent)",
      counts,
    });
  } catch (error: any) {
    console.error("[api/seed] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

