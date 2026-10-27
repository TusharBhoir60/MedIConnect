/**
 * POST /api/ivr/complete
 *
 * Twilio StatusCallback — fires when a call ends (completed, failed, etc.)
 *
 * Set as StatusCallback when creating the call in /api/ivr/call.
 * When CallStatus === "completed", sends the appointment confirmation SMS.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAppointment, deleteAppointment } from "@/lib/ivrStore";

const SMS_TEXT: Record<string, (name: string, slot: string, date: string) => string> = {
  en: (name, slot, date) =>
    `JanArogya JanVaani: Dear ${name || "Patient"}, your appointment at PHC Armori is confirmed for ${date} at ${slot}. Please bring your health card. Helpline: 108.`,
  hi: (name, slot, date) =>
    `JanArogya JanVaani: ${name || "Mahodaya"}, PHC Armori mein aapki appointment ${date} ko ${slot} par confirm hai. Health card saath laayein. Helpline: 108.`,
  mr: (name, slot, date) =>
    `JanArogya JanVaani: ${name || "Rao"}, PHC Armori madhe tumchi appointment ${date} roji ${slot} la confirm aahe. Health card saath aana. Helpline: 108.`,
};

export async function POST(req: NextRequest) {
  const form       = await req.formData().catch(() => new FormData());
  const callSid    = form.get("CallSid")?.toString()    ?? "";
  const callStatus = form.get("CallStatus")?.toString() ?? "";

  console.log(`[ivr/complete] CallSid: ${callSid} | Status: ${callStatus}`);

  // Only send SMS when call actually completed
  if (callStatus !== "completed") {
    return NextResponse.json({ ok: true, skipped: true, callStatus });
  }

  const info = getAppointment(callSid);
  if (!info) {
    console.log(`[ivr/complete] No appointment found for CallSid: ${callSid} — patient may have pressed 3 (fine) or not chosen a slot.`);
    return NextResponse.json({ ok: true, skipped: true, reason: "no appointment stored" });
  }

  // Clean up store
  deleteAppointment(callSid);

  const { patientPhone, name, lang, slotLabel, date } = info;
  const smsFn = SMS_TEXT[lang] ?? SMS_TEXT.mr;
  const body  = smsFn(name, slotLabel, date);

  await sendSms(patientPhone, body);

  return NextResponse.json({ ok: true, smsSent: true, to: patientPhone });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

/* ── Twilio SMS helper ── */
async function sendSms(to: string, body: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from || !to) {
    console.log(`[SMS demo] To: ${to || "unknown"} | Body: ${body}`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const res = await fetch(url, {
    method  : "POST",
    headers : {
      "Content-Type" : "application/x-www-form-urlencoded",
      Authorization  : `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      To   : to.startsWith("+") ? to : `+91${to}`,
      From : from,
      Body : body,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[SMS] Twilio error:", err);
  } else {
    console.log(`[SMS] Sent to: ${to} | Body: ${body}`);
  }
}
