/**
 * GET /api/ivr/health
 *
 * Sanity-check endpoint — Twilio aur tum dono verify kar sakte ho
 * ki IVR server publicly reachable hai.
 *
 * Browser ya curl se check karo:
 *   curl https://<ngrok-url>/api/ivr/health
 *
 * Expected response: { "ok": true, "url": "https://..." }
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  return NextResponse.json({
    ok         : true,
    url        : base,
    voiceUrl   : `${base}/api/ivr/voice`,
    configuredEnv: !!process.env.NEXT_PUBLIC_BASE_URL,
    twilioCreds: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    timestamp  : new Date().toISOString(),
  });
}
