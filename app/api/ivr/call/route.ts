/**
 * POST /api/ivr/call
 * Triggers an outbound JanVaani call to a patient.
 *
 * Body:
 *   to          string   – patient phone (required)
 *   name        string   – patient name (optional)
 *   lang        "mr"|"hi"|"en"  (default "mr")
 *   urgency     "routine"|"urgent"|"emergency"  (default "routine")
 *   visitNotes  string   – ASHA notes for personalised IVR script
 *   complaint   string   – chief complaint
 *
 * Env vars required for live calls:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER
 *   TWILIO_IVR_BASE_URL  – public URL of the Express IVR server (ngrok URL)
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      name       = "",
      lang       = "mr",
      sex        = "F",
      urgency    = "routine",
      visitNotes = "",
      complaint  = "",
    } = body as {
      to: string;
      name?: string;
      lang?: string;
      sex?: string;
      urgency?: "routine" | "urgent" | "emergency";
      visitNotes?: string;
      complaint?: string;
    };

    if (!to) {
      return NextResponse.json({ error: "to (phone number) is required" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_FROM_NUMBER;

    /* ── Demo mode — no Twilio credentials ── */
    if (!accountSid || !authToken || !from) {
      // Gender-aware honorific
      const honorific = (n: string) =>
        sex === "M"
          ? lang === "mr" ? ` ${n} dada` : lang === "hi" ? ` ${n} bhai` : ` ${n}`
          : lang === "mr" ? ` ${n} tai`  : lang === "hi" ? ` ${n} ji`   : ` ${n}`;

      const greeting =
        lang === "hi"
          ? `Namaste${name ? honorific(name) : ""}. ASHA Sunita Pawar aapke ghar aayi thi. Aapne bataya tha — ${complaint || "takleef"}. Ab kaisa feel ho raha hai?`
          : lang === "en"
            ? `Hello${name ? " " + name : ""}. ASHA worker Sunita Pawar visited your home. You mentioned — ${complaint || "health concern"}. How are you feeling now?`
            : `Namaskar${name ? honorific(name) : ""}. ASHA Sunita Pawar tumchya ghara aali hoti. Tumhi sangitale hote — ${complaint || "takrar"}. Aata kasa vatate?`;

      const menu =
        lang === "hi"
          ? "Ek dabaye — abhi takleef hai. Do dabaye — theek hai, PHC jana hai. Teen dabaye — sab theek hai."
          : lang === "en"
            ? "Press 1 — still unwell. Press 2 — better, want PHC visit. Press 3 — all fine."
            : "Ek daba — abhi takrar aahe. Don daba — bare aahe, PHC bhet. Teen daba — sab theek aahe.";

      return NextResponse.json({
        success      : true,
        demo         : true,
        to, name, lang, sex, urgency, complaint,
        scriptPreview: `${greeting} ${menu}`,
        message:
          `Demo mode — would call ${to} for ${name || "patient"} (${urgency}). ` +
          `Set TWILIO_* and TWILIO_IVR_BASE_URL in .env.local to enable live calls.`,
      });
    }

    /* ── Live mode ── */
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const base  = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

    // Guard: localhost URLs won't work with Twilio — reject early with a clear message
    if (base.includes("localhost") || base.includes("127.0.0.1")) {
      console.error("[ivr/call] voiceUrl is localhost — Twilio cannot reach it. Set NEXT_PUBLIC_BASE_URL to your ngrok URL.");
      return NextResponse.json(
        {
          error  : "TwiML server not publicly reachable",
          detail :
            "NEXT_PUBLIC_BASE_URL is set to localhost. " +
            "Twilio needs a public HTTPS URL. " +
            "Run `ngrok http 3000`, copy the URL, update NEXT_PUBLIC_BASE_URL in .env.local, then restart the dev server.",
          fix    : "https://<your-ngrok-subdomain>.ngrok-free.app",
        },
        { status: 400 },
      );
    }

    const toNumber = to.startsWith("+") ? to : `+91${to}`;
    // Strip + for URL safety — slot route will re-add +91 prefix
    const toDigits = toNumber.replace(/^\+/, "");

    const voiceUrl =
      `${base}/api/ivr/voice` +
      `?name=${encodeURIComponent(name)}` +
      `&ashaName=${encodeURIComponent("Sunita Pawar")}` +
      `&complaint=${encodeURIComponent(complaint)}` +
      `&sex=${encodeURIComponent(sex)}` +
      `&patientPhone=${toDigits}`;

    // Health check — warning only, does NOT block the call.
    // Reason: Next.js calling itself through the public ngrok URL can fail
    // due to timing, DNS, or ngrok quirks — but Twilio may still reach it fine.
    try {
      const healthCheck = await fetch(`${base}/api/ivr/health`, {
        method : "GET",
        signal : AbortSignal.timeout(4000),           // 4-second timeout
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (healthCheck.ok) {
        console.log("[ivr/call] Health check OK — server is publicly reachable at:", base);
      } else {
        console.warn("[ivr/call] Health check returned non-OK status:", healthCheck.status, "— proceeding anyway.");
      }
    } catch (e) {
      // Self-reachability check failed — log and continue.
      // The actual reachability is from Twilio's servers, not from ourselves.
      console.warn("[ivr/call] Health check could not reach self:", base, "— proceeding with call anyway. Error:", (e as Error).message);
    }

    const statusCallbackUrl = `${base}/api/ivr/complete`;

    // Trial Twilio accounts don't support StatusCallback — detect and skip
    // If TWILIO_TRIAL_ACCOUNT=true in .env.local, we skip StatusCallback
    const isTrial = process.env.TWILIO_TRIAL_ACCOUNT === "true";

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const callParams: Record<string, string> = {
      To   : toNumber,
      From : from,
      Url  : voiceUrl,
    };

    if (!isTrial) {
      callParams.StatusCallback       = statusCallbackUrl;
      callParams.StatusCallbackMethod = "POST";
      callParams.StatusCallbackEvent  = "completed";
    }

    const params = new URLSearchParams(callParams);

    console.log("[ivr/call] Firing Twilio call:", {
      To  : params.get("To"),
      From: params.get("From"),
      Url : voiceUrl,
    });

    const response = await fetch(twilioUrl, {
      method  : "POST",
      headers : {
        "Content-Type" : "application/x-www-form-urlencoded",
        Authorization  : `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ivr/call] Twilio error:", errText);
      // Parse for a readable message
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.message ?? errText;
        console.error("[ivr/call] Twilio code:", parsed.code, "| msg:", parsed.message);
      } catch { /* raw text */ }
      return NextResponse.json({ error: "Twilio API error", detail }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      success  : true,
      callSid  : data.sid,
      status   : data.status,
      urgency,
      name,
      to,
    });

  } catch (err) {
    console.error("/api/ivr/call error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
