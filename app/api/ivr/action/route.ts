/**
 * POST /api/ivr/action  (fallback only)
 *
 * Real DTMF handling is in twilio-ivr/server.js  →  POST /handle-input
 *
 * This is a Next.js fallback for when the Express IVR server is
 * not running. Handles digits 1-4, 0.
 */

import { NextRequest, NextResponse } from "next/server";

const PHC = {
  name      : "PHC Armori",
  open      : "08:00",
  close     : "16:00",
  doctors   : ["Dr. Anjali Deshmukh", "Dr. Rahul Kulkarni"],
  medicines : {
    available  : ["IFA", "ORS", "Paracetamol 500mg", "Metformin 500mg"],
    outOfStock : ["Amoxicillin"],
  },
  slots: ["09:00–09:20", "10:00–10:20", "11:00–11:20"],
};

const SCRIPTS = {
  mr: {
    opt1   : () => `${PHC.name} aaj ${PHC.open} te ${PHC.close} paryant suru aahe. Duty var: ${PHC.doctors.join(" aani ")}.`,
    opt2   : () => `Upalabdh: ${PHC.medicines.available.join(", ")}. Stockout: ${PHC.medicines.outOfStock.join(", ")}.`,
    opt4   : () => `Aapla referral ${PHC.name} kade register aahe. ASHA karyakarta update deil. Tatkal: 108.`,
    slots  : "Teen daba — Uddya 9 vajata. Chaar daba — Uddya 10 vajata. Paach daba — Uddya 11 vajata.",
    bye    : "JanArogya JanVaani. Dhanyavad aani nirogi raha.",
    invalid: "Chukicha option. Punha try kara.",
  },
  hi: {
    opt1   : () => `${PHC.name} aaj ${PHC.open} se ${PHC.close} tak khula hai. Duty par: ${PHC.doctors.join(" aur ")}.`,
    opt2   : () => `Upalabdh: ${PHC.medicines.available.join(", ")}. Stock nahi: ${PHC.medicines.outOfStock.join(", ")}.`,
    opt4   : () => `Aapka referral ${PHC.name} mein register hai. ASHA worker update denge. Zaroorat par: 108.`,
    slots  : "Teen dabaye — Kal 9 baje. Chaar dabaye — Kal 10 baje. Paanch dabaye — Kal 11 baje.",
    bye    : "JanArogya JanVaani. Dhanyavaad aur swasth rahiye.",
    invalid: "Galat option. Dobara try karein.",
  },
  en: {
    opt1   : () => `${PHC.name} open ${PHC.open}–${PHC.close}. On duty: ${PHC.doctors.join(" and ")}.`,
    opt2   : () => `Available: ${PHC.medicines.available.join(", ")}. Out of stock: ${PHC.medicines.outOfStock.join(", ")}.`,
    opt4   : () => `Your referral is registered at ${PHC.name}. ASHA will update you. Emergency: 108.`,
    slots  : "Press 3 for 9 AM. Press 4 for 10 AM. Press 5 for 11 AM.",
    bye    : "JanArogya JanVaani. Thank you and stay healthy.",
    invalid: "Invalid option. Please try again.",
  },
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") ?? "mr") as keyof typeof SCRIPTS;
  const name = searchParams.get("name") ?? "";

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;

  const form  = await req.formData();
  const digit = form.get("Digits")?.toString() ?? "";

  const s         = SCRIPTS[lang] ?? SCRIPTS.mr;
  const twimlLang = lang === "hi" ? "hi-IN" : lang === "en" ? "en-IN" : "mr-IN";
  const say       = (t: string) => `<Say language="${twimlLang}" voice="Polly.Aditi">${esc(t)}</Say>`;
  const voiceUrl  = `${base}/api/ivr/voice?lang=${lang}&name=${encodeURIComponent(name)}`;
  const bookUrl   = `${base}/api/ivr/book?lang=${lang}&name=${encodeURIComponent(name)}`;

  let body = "";

  if (digit === "1") {
    body = say(s.opt1()) + say(s.bye) + "<Hangup/>";
  } else if (digit === "2") {
    body = say(s.opt2()) + say(s.bye) + "<Hangup/>";
  } else if (digit === "3") {
    body = `<Gather numDigits="1" action="${esc(bookUrl)}" method="POST" timeout="8">
      ${say(s.slots)}
    </Gather>${say(s.bye)}<Hangup/>`;
  } else if (digit === "4") {
    body = say(s.opt4()) + say(s.bye) + "<Hangup/>";
  } else if (digit === "0") {
    body = `<Redirect method="POST">${esc(voiceUrl)}</Redirect>`;
  } else {
    body = say(s.invalid) + `<Redirect method="POST">${esc(voiceUrl)}</Redirect>`;
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}

export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
