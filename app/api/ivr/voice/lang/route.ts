/**
 * POST /api/ivr/voice/lang
 *
 * Step 2 — Language chosen. Greet patient in their language,
 * ask how they are feeling now.
 *
 * Menu:
 *   1 = Still unwell / need doctor  → ask for time slot
 *   2 = Better, want PHC visit      → ask for time slot
 *   3 = Completely fine             → thank & hangup
 *
 * Retry logic:
 *   - Says menu once, waits 10s
 *   - On no-input → retries once more (retry=1)
 *   - After retry=1 with no-input → hangup politely
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

function honorific(name: string, sex: string, lang: string) {
  if (!name) return "";
  if (sex === "M") {
    return lang === "hi" ? ` ${name} bhai` : lang === "mr" ? ` ${name} dada` : ` ${name}`;
  }
  return lang === "hi" ? ` ${name} ji` : lang === "mr" ? ` ${name} tai` : ` ${name}`;
}

const SCRIPTS = {
  en: {
    greeting: (name: string, asha: string, complaint: string, sex: string) =>
      `Hello${honorific(name, sex, "en")}. I am calling from JanArogya JanVaani. ` +
      `ASHA worker ${asha || "Sunita Pawar"} visited your home recently. ` +
      `You had mentioned ${complaint || "a health concern"}. How are you feeling now?`,
    menu:    "Press 1 if you are still unwell and need to see a doctor. Press 2 if you are better and want to visit the PHC. Press 3 if you are completely fine.",
    noInput: "We did not receive your response. Please call again at your convenience. Thank you. Goodbye.",
  },
  hi: {
    greeting: (name: string, asha: string, complaint: string, sex: string) =>
      `Namaste${honorific(name, sex, "hi")}. Main JanArogya JanVaani se bol raha hoon. ` +
      `ASHA ${asha || "Sunita Pawar"} aapke ghar aayi thi. ` +
      `Aapne bataya tha ${complaint || "ek takleef ke baare mein"}. Ab aap kaisa feel kar rahe hain?`,
    menu:    "Ek dabaye agar abhi bhi takleef hai aur doctor se milna chahte hain. Do dabaye agar theek hain aur PHC jana chahte hain. Teen dabaye agar bilkul theek hain.",
    noInput: "Aapka jawab nahi mila. Baad mein dobara call karein. Dhanyavaad. Alvida.",
  },
  mr: {
    greeting: (name: string, asha: string, complaint: string, sex: string) =>
      `Namaskar${honorific(name, sex, "mr")}. Mi JanArogya JanVaani taraf un bolato aahe. ` +
      `ASHA ${asha || "Sunita Pawar"} tumchya ghara aali hoti. ` +
      `Tumhi sangitale hote ${complaint || "ek takrari baddal"}. Aata tumhala kasa vaatate?`,
    menu:    "Ek daba jari abhi takrar aahe ani doctor la janyache aahe. Don daba jari bare vaatate ani PHC bhet ghyaychi aahe. Teen daba jari sab theek aahe.",
    noInput: "Tumcha uttar mila nahi. Nantarch punha call kara. Dhanyavad. Namaskar.",
  },
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name      = searchParams.get("name")      ?? "";
  const asha      = searchParams.get("ashaName")  ?? "Sunita Pawar";
  const complaint = searchParams.get("complaint") ?? "";
  const sex       = searchParams.get("sex")       ?? "F";
  const visitId   = searchParams.get("visitId")   ?? "";
  const retry     = searchParams.get("retry")     ?? "0";
  const patientPhone = searchParams.get("patientPhone") ?? "";

  const form  = await req.formData().catch(() => new FormData());
  const digit = form.get("Digits")?.toString() ?? "";

  // 1 = en, 2 = hi, 3 (default/no-input) = mr
  // lang may be passed as a query param on retries
  const langParam = searchParams.get("lang");
  const lang = langParam
    ? langParam
    : digit === "1" ? "en" : digit === "2" ? "hi" : "mr";

  const s = SCRIPTS[lang as keyof typeof SCRIPTS] ?? SCRIPTS.mr;

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  const commonParams =
    `lang=${eu(lang)}&name=${eu(name)}&ashaName=${eu(asha)}&complaint=${eu(complaint)}&sex=${eu(sex)}&visitId=${eu(visitId)}&patientPhone=${eu(patientPhone)}`;

  const answerUrl  = `${base}/api/ivr/voice/answer?${commonParams}`;
  const retryUrl   = `${base}/api/ivr/voice/lang?${commonParams}&retry=1`;
  const noInputUrl = `${base}/api/ivr/voice/lang?${commonParams}&retry=noresponse`;

  console.log("[ivr/voice/lang] lang:", lang, "retry:", retry);

  // After second timeout → polite goodbye
  if (retry === "noresponse") {
    return xml(say(s.noInput, lang) + "<Hangup/>");
  }

  const greetingText = s.greeting(name, asha, complaint, sex);

  return xml(`
    <Gather numDigits="1" action="${esc(answerUrl)}" method="POST" timeout="10">
      ${say(greetingText, lang)}
      ${say(s.menu, lang)}
    </Gather>
    <Redirect method="POST">${esc(retry === "1" ? noInputUrl : retryUrl)}</Redirect>
  `);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
