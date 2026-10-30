/**
 * POST /api/ivr/book  (fallback only)
 *
 * Real appointment booking from IVR is in twilio-ivr/server.js  →  POST /book-slot
 *
 * This Next.js fallback handles slot confirmation + SMS when
 * the Express IVR server is not running.
 */

import { NextRequest, NextResponse } from "next/server";

const SLOTS = ["09:00–09:20", "10:00–10:20", "11:00–11:20"];

type ConfirmFn = (slot: string, date: string, name: string) => string;

const CONFIRM: Record<string, ConfirmFn> = {
  mr: (slot, date, name) =>
    `${name ? name + " tai, " : ""}aapli appointment ${date} la ${slot} la PHC Armori madhe book jhali. SMS yenar. Veles ya. Dhanyavad.`,
  hi: (slot, date, name) =>
    `${name ? name + " ji, " : ""}aapki appointment ${date} ko ${slot} par PHC Armori mein book ho gayi. SMS aayega. Samay par aayein. Dhanyavaad.`,
  en: (slot, date, name) =>
    `${name ? name + ", " : ""}your appointment at PHC Armori is booked for ${date} at ${slot}. SMS sent. Please attend. Thank you.`,
};

const SMS_BODY: Record<string, ConfirmFn> = {
  mr: (slot, date, name) =>
    `JanArogya: ${name ? name + " tai, " : ""}PHC Armori appointment ${date} la ${slot} la book jhali. JanVaani IVR. Veles ya.`,
  hi: (slot, date, name) =>
    `JanArogya: ${name ? name + " ji, " : ""}PHC Armori appointment ${date} ko ${slot} par book ho gayi. JanVaani IVR. Samay par aayein.`,
  en: (slot, date, name) =>
    `JanArogya: PHC Armori appointment on ${date} at ${slot}${name ? " for " + name : ""}. JanVaani IVR. Please attend.`,
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") ?? "mr") as string;
  const name = searchParams.get("name") ?? "";

  const form  = await req.formData();
  const digit = form.get("Digits")?.toString() ?? "1";
  const from  = form.get("From")?.toString()   ?? "";

  const slotIdx  = Math.max(0, Math.min(parseInt(digit, 10) - 1, SLOTS.length - 1));
  const slot     = SLOTS[slotIdx];
  const date     = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const twimlLang = lang === "hi" ? "hi-IN" : lang === "en" ? "en-IN" : "mr-IN";

  const confirmFn = CONFIRM[lang] ?? CONFIRM.mr;
  const text      = confirmFn(slot, date, name);

  // Send SMS
  await sendSms(from, lang, slot, date, name);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twimlLang}" voice="Polly.Aditi">${esc(text)}</Say>
  <Hangup/>
</Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}

async function sendSms(to: string, lang: string, slot: string, date: string, name: string) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from || !to) {
    const bodyFn = SMS_BODY[lang] ?? SMS_BODY.mr;
    console.log(`[SMS demo] ${bodyFn(slot, date, name)}`);
    return;
  }

  const bodyFn = SMS_BODY[lang] ?? SMS_BODY.mr;
  const body   = bodyFn(slot, date, name);
  const url    = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  try {
    await fetch(url, {
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
  } catch (err) {
    console.error("SMS error:", err);
  }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
