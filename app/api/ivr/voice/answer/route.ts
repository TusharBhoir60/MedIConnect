/**
 * POST /api/ivr/voice/answer
 *
 * Step 3 — Patient pressed 1, 2, or 3.
 *
 * 1 = Still unwell → ask preferred time slot for appointment
 * 2 = Better, want PHC visit → ask preferred time slot
 * 3 = Completely fine → thank & hangup
 *
 * Invalid / no input → retry once, then hangup
 *
 * Time slots offered:
 *   1 = 9:00 AM – 10:00 AM
 *   2 = 10:00 AM – 11:00 AM
 *   3 = 11:00 AM – 12:00 PM
 */

import { NextRequest, NextResponse } from "next/server";

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

const SCRIPTS = {
  en: {
    fine:        "Wonderful! Stay healthy. Your ASHA worker will follow up if needed. Thank you. JanArogya JanVaani. Goodbye.",
    slotIntro:   "We will book your appointment at PHC Armori.",
    slotMenu:    "Press 1 for 9 AM to 10 AM. Press 2 for 10 AM to 11 AM. Press 3 for 11 AM to 12 noon.",
    answerMenu:  "Press 1 if you are still unwell. Press 2 if you want a PHC visit. Press 3 if you are completely fine.",
    invalid:     "Invalid choice. Please try again.",
    noInput:     "We did not receive your response. Please call again. Thank you. Goodbye.",
  },
  hi: {
    fine:        "Bahut achha! Swasth rahiye. Zaroorat par ASHA phir aayenge. Dhanyavaad. JanArogya JanVaani. Alvida.",
    slotIntro:   "Hum PHC Armori mein aapki appointment book karenge.",
    slotMenu:    "Subah 9 baje se 10 baje ke liye 1 dabaye. 10 baje se 11 baje ke liye 2 dabaye. 11 baje se dopahar 12 baje ke liye 3 dabaye.",
    answerMenu:  "Abhi bhi takleef hai to 1 dabaye. PHC jana chahte hain to 2 dabaye. Bilkul theek hain to 3 dabaye.",
    invalid:     "Galat input. Dobara try karein.",
    noInput:     "Koi jawab nahi mila. Dobara call karein. Dhanyavaad. Alvida.",
  },
  mr: {
    fine:        "Khoop chhaan! Nirogi raha. Parat kaahi lavale tar ASHA yetil. Dhanyavad. JanArogya JanVaani. Namaskar.",
    slotIntro:   "Aamhi PHC Armori madhe tumchi appointment book kartoy.",
    slotMenu:    "Sakali 9 te 10 saathi 1 daba. 10 te 11 saathi 2 daba. 11 te dopahari 12 saathi 3 daba.",
    answerMenu:  "Abhi takrar aahe tar 1 daba. PHC la jayche aahe tar 2 daba. Sab theek aahe tar 3 daba.",
    invalid:     "Chukicha input. Punha try kara.",
    noInput:     "Uttar mila nahi. Punha call kara. Dhanyavad. Namaskar.",
  },
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang      = (searchParams.get("lang")      ?? "mr") as keyof typeof SCRIPTS;
  const name      = searchParams.get("name")       ?? "";
  const asha      = searchParams.get("ashaName")   ?? "Sunita Pawar";
  const complaint = searchParams.get("complaint")  ?? "";
  const sex       = searchParams.get("sex")        ?? "F";
  const visitId   = searchParams.get("visitId")    ?? "";
  const retry     = searchParams.get("retry")      ?? "0";
  const patientPhone = searchParams.get("patientPhone") ?? "";

  const s = SCRIPTS[lang] ?? SCRIPTS.mr;

  const form  = await req.formData().catch(() => new FormData());
  const digit = form.get("Digits")?.toString() ?? "";

  console.log(`[IVR answer] lang:${lang} digit:${digit} retry:${retry} name:${name}`);

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  const commonParams =
    `lang=${eu(lang)}&name=${eu(name)}&ashaName=${eu(asha)}&complaint=${eu(complaint)}&sex=${eu(sex)}&visitId=${eu(visitId)}&patientPhone=${eu(patientPhone)}`;

  // Option 3 — patient is fine
  if (digit === "3") {
    return xml(say(s.fine, lang) + "<Hangup/>");
  }

  // Options 1 or 2 — need appointment → ask for time slot
  if (digit === "1" || digit === "2") {
    const slotUrl      = `${base}/api/ivr/voice/slot?${commonParams}`;
    const slotRetryUrl = `${base}/api/ivr/voice/slot?${commonParams}&retry=1`;

    return xml(`
      <Gather numDigits="1" action="${esc(slotUrl)}" method="POST" timeout="10">
        ${say(s.slotIntro, lang)}
        ${say(s.slotMenu, lang)}
      </Gather>
      <Redirect method="POST">${esc(slotRetryUrl)}</Redirect>
    `);
  }

  // No input or invalid
  if (retry === "1") {
    // Second timeout — hangup
    return xml(say(s.noInput, lang) + "<Hangup/>");
  }

  // First invalid/no-input → repeat the health-status menu once
  const answerRetryUrl = `${base}/api/ivr/voice/answer?${commonParams}&retry=1`;
  const langUrl        = `${base}/api/ivr/voice/lang?${commonParams}`;

  return xml(`
    <Gather numDigits="1" action="${esc(answerRetryUrl)}" method="POST" timeout="10">
      ${say(s.invalid, lang)}
      ${say(s.answerMenu, lang)}
    </Gather>
    <Redirect method="POST">${esc(langUrl)}</Redirect>
  `);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
