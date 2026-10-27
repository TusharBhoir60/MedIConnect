/**
 * GET/POST /api/ivr/voice
 *
 * Step 1 — Language select
 * - Says the prompt ONCE clearly
 * - Waits 10 seconds for input
 * - If no input → repeats prompt ONCE more (another 10s)
 * - If still no input → redirects to lang route (defaults to Marathi)
 *
 * 1 = English, 2 = Hindi, 3 = Marathi
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

function say(text: string, lang: string = "hi") {
  const langMap: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
  const twimlLang = langMap[lang] ?? "hi-IN";
  return `<Say language="${twimlLang}" voice="Polly.Aditi">${esc(text)}</Say>`;
}

export async function GET(req: NextRequest) { return handleVoice(req); }
export async function POST(req: NextRequest) { return handleVoice(req); }

async function handleVoice(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name      = searchParams.get("name")      ?? "";
  const asha      = searchParams.get("ashaName")  ?? "Sunita Pawar";
  const complaint = searchParams.get("complaint") ?? "";
  const sex       = searchParams.get("sex")       ?? "F";
  const visitId   = searchParams.get("visitId")   ?? "";
  const retry     = searchParams.get("retry")     ?? "0";

  // Capture patient's phone number from Twilio form POST at the very first step
  const form  = await req.formData().catch(() => new FormData());
  const from  = searchParams.get("patientPhone") ?? form.get("To")?.toString() ?? "";

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  const commonParams =
    `name=${eu(name)}&ashaName=${eu(asha)}&complaint=${eu(complaint)}&sex=${eu(sex)}&visitId=${eu(visitId)}&patientPhone=${eu(from)}`;

  const langUrl    = `${base}/api/ivr/voice/lang?${commonParams}`;
  const retryUrl   = `${base}/api/ivr/voice?${commonParams}&retry=1`;

  console.log("[ivr/voice] retry:", retry, "| base:", base);

  // After 2 retries with no input → default to Marathi
  if (retry === "2") {
    return xml(`<Redirect method="POST">${esc(langUrl)}</Redirect>`);
  }

  const prompt =
    "Namaskar. JanArogya JanVaani. " +
    "Bhasha nivadat sathi — " +
    "English saathi ek daba. " +
    "Hindi ke liye do dabaye. " +
    "Marathi saathi teen daba.";

  // One Gather with 10s timeout — on no input, redirect to retry
  return xml(`
    <Gather numDigits="1" action="${esc(langUrl)}" method="POST" timeout="10">
      ${say(prompt, "mr")}
    </Gather>
    <Redirect method="POST">${esc(retryUrl)}</Redirect>
  `);
}
