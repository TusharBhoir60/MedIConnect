/**
 * POST /api/ivr/voice/slot
 *
 * Step 4 — Patient chose a time slot.
 *
 * 1 = 9:00 AM – 10:00 AM
 * 2 = 10:00 AM – 11:00 AM
 * 3 = 11:00 AM – 12:00 PM
 *
 * After slot selection:
 *   - Speaks confirmation in patient's language
 *   - Sends SMS with full appointment details
 *   - Hangs up
 *
 * On no input / invalid → repeats slot menu once, then hangs up
 */

import { NextRequest, NextResponse } from "next/server";
import { saveAppointment } from "@/lib/ivrStore";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function eu(s: string) {
  return esc(encodeURIComponent(String(s ?? "")));
}

function xml(body: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}

function say(text: string, lang: string = "mr") {
  const langMap: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
  const twimlLang = langMap[lang] ?? "hi-IN";
  return `<Say language="${twimlLang}" voice="Polly.Aditi">${esc(text)}</Say>`;
}

// Tomorrow's date formatted as DD/MM/YYYY
function tomorrowDate(): string {
  const d = new Date(Date.now() + 86_400_000);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const SLOTS: Record<string, { label: Record<string, string>; spoken: Record<string, string> }> = {
  "1": {
    label:  { en: "9:00 AM – 10:00 AM", hi: "9:00 AM – 10:00 AM", mr: "9:00 AM – 10:00 AM" },
    spoken: { en: "9 AM to 10 AM",      hi: "subah 9 baje se 10 baje", mr: "sakali 9 te 10" },
  },
  "2": {
    label:  { en: "10:00 AM – 11:00 AM", hi: "10:00 AM – 11:00 AM", mr: "10:00 AM – 11:00 AM" },
    spoken: { en: "10 AM to 11 AM",      hi: "subah 10 baje se 11 baje", mr: "sakali 10 te 11" },
  },
  "3": {
    label:  { en: "11:00 AM – 12:00 PM", hi: "11:00 AM – 12:00 PM", mr: "11:00 AM – 12:00 PM" },
    spoken: { en: "11 AM to 12 noon",    hi: "11 baje se dopahar 12 baje", mr: "11 te dopahari 12" },
  },
};

const CONFIRM_SPEECH: Record<string, (name: string, slot: string, date: string, sex: string) => string> = {
  en: (name, slot, date) =>
    `Your appointment at PHC Armori has been booked for ${date} between ${slot}. ` +
    `You will receive an SMS with all the details. Please arrive on time. ` +
    `Thank you. JanArogya JanVaani. Goodbye.`,
  hi: (name, slot, date, sex) =>
    `${name ? (sex === "M" ? name + " bhai," : name + " ji,") : ""} ` +
    `aapki appointment PHC Armori mein ${date} ko ${slot} par book ho gayi hai. ` +
    `Aapko SMS par puri jaankari milegi. Samay par aayein. ` +
    `Dhanyavaad. JanArogya JanVaani. Alvida.`,
  mr: (name, slot, date, sex) =>
    `${name ? (sex === "M" ? name + " dada," : name + " tai,") : ""} ` +
    `PHC Armori madhe tumchi appointment ${date} roji ${slot} la book jhali aahe. ` +
    `Tumhala SMS var sari mahiti milel. Veles ya. ` +
    `Dhanyavad. JanArogya JanVaani. Namaskar.`,
};

const SMS_TEXT: Record<string, (name: string, slot: string, date: string) => string> = {
  en: (name, slot, date) =>
    `JanArogya JanVaani: Dear ${name || "Patient"}, your appointment at PHC Armori is confirmed for ${date} at ${slot}. Please bring your health card. Helpline: 108.`,
  hi: (name, slot, date) =>
    `JanArogya JanVaani: ${name || "Mahodaya"}, PHC Armori mein aapki appointment ${date} ko ${slot} par confirm hai. Health card saath laayein. Helpline: 108.`,
  mr: (name, slot, date) =>
    `JanArogya JanVaani: ${name || "Rao"}, PHC Armori madhe tumchi appointment ${date} roji ${slot} la confirm aahe. Health card saath aana. Helpline: 108.`,
};

const SLOT_MENU: Record<string, string> = {
  en: "Press 1 for 9 AM to 10 AM. Press 2 for 10 AM to 11 AM. Press 3 for 11 AM to 12 noon.",
  hi: "Subah 9 baje se 10 baje ke liye 1 dabaye. 10 baje se 11 baje ke liye 2 dabaye. 11 baje se dopahar 12 baje ke liye 3 dabaye.",
  mr: "Sakali 9 te 10 saathi 1 daba. 10 te 11 saathi 2 daba. 11 te dopahari 12 saathi 3 daba.",
};

const NO_INPUT: Record<string, string> = {
  en: "We did not receive your slot preference. Please call again to book your appointment. Thank you. Goodbye.",
  hi: "Aapki slot pasand nahi mili. Appointment book karne ke liye dobara call karein. Dhanyavaad. Alvida.",
  mr: "Tumchi slot milali nahi. Appointment book karayla punha call kara. Dhanyavad. Namaskar.",
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang    = (searchParams.get("lang")      ?? "mr") as string;
  const name    = searchParams.get("name")       ?? "";
  const asha    = searchParams.get("ashaName")   ?? "Sunita Pawar";
  const complaint = searchParams.get("complaint") ?? "";
  const sex     = searchParams.get("sex")        ?? "F";
  const visitId = searchParams.get("visitId")    ?? "";
  const retry   = searchParams.get("retry")      ?? "0";
  const patientPhone = searchParams.get("patientPhone") ?? "";

  const form    = await req.formData().catch(() => new FormData());
  const digit   = form.get("Digits")?.toString()  ?? "";
  const callSid = form.get("CallSid")?.toString() ?? "";

  // patientPhone comes in as digits only (e.g. "918384041061") — add + prefix
  // Fallback to Twilio's To/Called fields if missing
  const rawPhone = patientPhone || form.get("To")?.toString() || form.get("Called")?.toString() || "";
  const from = rawPhone
    ? rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`
    : "";

  console.log(`[IVR slot] lang:${lang} digit:${digit} retry:${retry} name:${name} smsTo:${from}`);

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  const commonParams =
    `lang=${eu(lang)}&name=${eu(name)}&ashaName=${eu(asha)}&complaint=${eu(complaint)}&sex=${eu(sex)}&visitId=${eu(visitId)}&patientPhone=${eu(from)}`;

  // Valid slot chosen
  const slotData = SLOTS[digit];
  if (slotData) {
    const date        = tomorrowDate();
    const slotLabel   = slotData.label[lang]  ?? slotData.label.en;
    const slotSpoken  = slotData.spoken[lang] ?? slotData.spoken.en;

    const confirmFn  = CONFIRM_SPEECH[lang] ?? CONFIRM_SPEECH.mr;
    const speechText = confirmFn(name, slotSpoken, date, sex);

    // Log — SMS will be sent after call ends via StatusCallback
    console.log(`[IVR slot] Booked: ${name} | ${date} | ${slotLabel} | will SMS to: ${from || "demo"} after hangup`);

    // Save to store so StatusCallback can send SMS after call ends (paid accounts)
    if (callSid) {
      saveAppointment(callSid, {
        patientPhone : from,
        name,
        lang,
        sex,
        slotLabel,
        date,
        bookedAt     : Date.now(),
      });
    }

    // Trial accounts: StatusCallback not supported — send SMS directly after slot
    if (process.env.TWILIO_TRIAL_ACCOUNT === "true") {
      const smsFn  = SMS_TEXT[lang] ?? SMS_TEXT.mr;
      const smsBody = smsFn(name, slotLabel, date);
      sendSms(from, smsBody).catch(console.error);
      console.log(`[IVR slot] Trial mode — sending SMS immediately to: ${from}`);
    }

    // Redirect to a completion URL that carries slot info for StatusCallback SMS
    // We must return TwiML from this route, so we speak confirmation then hangup.
    // The StatusCallback (/api/ivr/complete) will fire after Twilio sees call=completed.
    return xml(say(speechText, lang) + "<Hangup/>");
  }

  // No input / invalid
  if (retry === "1") {
    // Already retried once — hangup with no-input message
    return xml(say(NO_INPUT[lang] ?? NO_INPUT.mr, lang) + "<Hangup/>");
  }

  // First miss — repeat slot menu
  const slotRetryUrl = `${base}/api/ivr/voice/slot?${commonParams}&retry=1`;

  return xml(`
    <Gather numDigits="1" action="${esc(slotRetryUrl)}" method="POST" timeout="10">
      ${say(SLOT_MENU[lang] ?? SLOT_MENU.mr, lang)}
    </Gather>
    <Redirect method="POST">${esc(slotRetryUrl)}</Redirect>
  `);
}

export async function GET(req: NextRequest) {
  return POST(req);
}

/* ── SMS helper (used in trial mode) ── */
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
    console.log(`[SMS] Sent to: ${to}`);
  }
}
