"use client";

/**
 * CallScheduledModal
 *
 * Shown immediately after ASHA submits a non-emergency visit.
 * – Counts down 24 seconds (demo of the real 24-hour delay)
 * – At T=0 fires POST /api/ivr/call and shows "Call triggered!"
 * – ASHA can cancel the call before T=0, or go to dashboard any time
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { tx } from "@/lib/i18n";
import type { Lang, Urgency } from "@/lib/types";

const DEMO_SECONDS = 24;

export interface CallScheduledModalProps {
  patientName:  string;
  patientPhone: string;
  patientLang:  Lang;
  patientSex:   string;   // "F" | "M" | "O"
  urgency:      Urgency;
  visitNotes:   string;
  complaint:    string;
  scheduledFor: string;   // ISO – actual (6h/24h) scheduled time
  ivrCallId:    string;   // id in store — used to update status
  lang:         Lang;     // UI language
  onCancel:     () => void;
  onTriggered:  (ivrCallId: string) => void;
}

type Phase = "countdown" | "triggering" | "triggered" | "failed" | "cancelled";

export function CallScheduledModal({
  patientName,
  patientPhone,
  patientLang,
  patientSex,
  urgency,
  visitNotes,
  complaint,
  scheduledFor,
  ivrCallId,
  lang,
  onCancel,
  onTriggered,
}: CallScheduledModalProps) {
  const router = useRouter();
  const [phase, setPhase]           = useState<Phase>("countdown");
  const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS);
  const [demoResult, setDemoResult] = useState<{ scriptPreview?: string; message?: string; demo?: boolean } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef    = useRef(false);

  /* ── countdown ── */
  useEffect(() => {
    if (phase !== "countdown") return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          fireCall();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function fireCall() {
    if (firedRef.current) return;
    firedRef.current = true;
    setPhase("triggering");

    try {
      const res = await fetch("/api/ivr/call", {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({
          to        : patientPhone,
          name      : patientName,
          lang      : patientLang,
          sex       : patientSex,
          urgency,
          visitNotes,
          complaint,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDemoResult(data);
        setPhase("triggered");
        onTriggered(ivrCallId);
      } else {
        setPhase("failed");
      }
    } catch {
      setPhase("failed");
    }
  }

  function handleCancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("cancelled");
    onCancel();
  }

  function goHome() {
    router.push("/asha");
  }

  /* ── urgency styles ── */
  const urgencyColor =
    urgency === "urgent"
      ? { ring: "ring-orange-400", pill: "bg-orange-100 text-orange-700", icon: "text-orange-500" }
      : { ring: "ring-forest-700", pill: "bg-forest-100 text-forest-700", icon: "text-forest-700" };

  const urgencyLabel =
    urgency === "urgent"
      ? tx("urgUrgent", lang)
      : tx("urgRoutine", lang);

  /* ── scheduled time label ── */
  const scheduledLabel = new Date(scheduledFor).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  const delayLabel =
    urgency === "urgent"
      ? tx("callUrgentDelay", lang)
      : tx("callRoutineDelay", lang);

  /* ── progress ring ── */
  const radius   = 38;
  const circ     = 2 * Math.PI * radius;
  const progress = (secondsLeft / DEMO_SECONDS) * circ;

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={`w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-2 ${urgencyColor.ring} transition-all duration-300`}
      >
        {/* ── header bar ── */}
        <div className={`flex items-center justify-between px-5 py-4 ${
          urgency === "urgent" ? "bg-orange-500" : "bg-forest-900"
        }`}>
          <div className="flex items-center gap-2 text-white">
            <Phone size={18} />
            <span className="text-sm font-semibold">{tx("callScheduledTitle", lang)}</span>
          </div>
          {(phase === "triggered" || phase === "cancelled" || phase === "failed") && (
            <button
              onClick={goHome}
              className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
              aria-label="close"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="space-y-4 px-5 py-5">

          {/* ── PHASE: countdown ── */}
          {phase === "countdown" && (
            <>
              <p className="text-xs text-ink/55">{tx("callScheduledSub", lang)}</p>

              {/* info grid */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sand-50 p-3 text-xs">
                <div>
                  <p className="text-ink/40 uppercase tracking-wide text-[10px]">{tx("callPatientLabel", lang)}</p>
                  <p className="mt-0.5 font-semibold text-forest-950">{patientName}</p>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-wide text-[10px]">{tx("callPhoneLabel", lang)}</p>
                  <p className="mt-0.5 font-mono font-semibold text-forest-950">{patientPhone}</p>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-wide text-[10px]">{tx("callUrgencyLabel", lang)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyColor.pill}`}>
                    {urgencyLabel}
                  </span>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-wide text-[10px]">{tx("callScheduledFor", lang)}</p>
                  <p className="mt-0.5 text-[11px] text-ink/70">{scheduledLabel}</p>
                </div>
              </div>

              {/* countdown ring */}
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="relative">
                  <svg width={96} height={96} className="-rotate-90">
                    <circle cx={48} cy={48} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={6} />
                    <circle
                      cx={48} cy={48} r={radius}
                      fill="none"
                      stroke={urgency === "urgent" ? "#f97316" : "#1a3c34"}
                      strokeWidth={6}
                      strokeDasharray={circ}
                      strokeDashoffset={circ - progress}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.9s linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold tabular-nums ${urgencyColor.icon}`}>
                      {secondsLeft}
                    </span>
                    <span className="text-[10px] text-ink/40">{tx("callSeconds", lang)}</span>
                  </div>
                </div>
                <p className="text-center text-[11px] text-ink/50">
                  {tx("callWillTriggerIn", lang)}
                </p>
                <p className="rounded-full bg-amber-50 px-3 py-1 text-center text-[11px] text-amber-700">
                  {tx("callDemoNote", lang)}
                </p>
              </div>

              {/* real scheduled time */}
              <div className="flex items-start gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <Clock size={13} className="mt-0.5 shrink-0 text-ink/40" />
                <div>
                  <p className="text-[11px] font-medium text-ink/60">{delayLabel}</p>
                  <p className="text-xs font-semibold text-forest-950">{scheduledLabel}</p>
                </div>
              </div>

              {/* actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancel}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sand-300 bg-white py-3 text-sm font-medium text-ink/60 hover:border-red-200 hover:text-red-600"
                >
                  <PhoneOff size={15} /> {tx("callCancelBtn", lang)}
                </button>
                <button
                  onClick={goHome}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white ${
                    urgency === "urgent" ? "bg-orange-500" : "bg-forest-900"
                  }`}
                >
                  {tx("callGoHome", lang)}
                </button>
              </div>
            </>
          )}

          {/* ── PHASE: triggering ── */}
          {phase === "triggering" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-forest-100">
                <Phone size={28} className="text-forest-700" />
              </div>
              <p className="text-sm font-medium text-ink/70">{tx("callTriggering", lang)}</p>
              <p className="text-xs text-ink/40">{patientName} · {patientPhone}</p>
            </div>
          )}

          {/* ── PHASE: triggered ── */}
          {phase === "triggered" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
                <CheckCircle2 size={32} className="text-forest-700" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-forest-900">{tx("callTriggered", lang)}</p>
                <p className="mt-1 text-xs text-ink/55">{tx("callTriggeredSub", lang)}</p>
              </div>

              {demoResult?.scriptPreview && (
                <div className="w-full rounded-xl border border-forest-900/10 bg-sand-50 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("ivrScriptPreview", lang)}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink/70 italic">
                    "{demoResult.scriptPreview}"
                  </p>
                </div>
              )}

              {demoResult?.demo && (
                <p className="rounded-full bg-amber-50 px-3 py-1 text-center text-[11px] text-amber-700">
                  {tx("callDemoNote", lang)}
                </p>
              )}

              <button
                onClick={goHome}
                className="w-full rounded-2xl bg-forest-900 py-3 text-sm font-semibold text-white"
              >
                {tx("callGoHome", lang)}
              </button>
            </div>
          )}

          {/* ── PHASE: failed ── */}
          {phase === "failed" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-100">
                <AlertCircle size={32} className="text-clay-500" />
              </div>
              <p className="text-sm font-medium text-ink/70">{tx("callTriggerFailed", lang)}</p>
              <div className="flex w-full gap-2">
                <button
                  onClick={() => { firedRef.current = false; fireCall(); }}
                  className="flex-1 rounded-2xl bg-forest-900 py-3 text-sm font-semibold text-white"
                >
                  {tx("callRetryBtn", lang)}
                </button>
                <button
                  onClick={goHome}
                  className="flex-1 rounded-2xl border border-sand-300 py-3 text-sm text-ink/60"
                >
                  {tx("callGoHome", lang)}
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE: cancelled ── */}
          {phase === "cancelled" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <PhoneOff size={28} className="text-ink/30" />
              <p className="text-sm text-ink/55">{tx("callCancelledBody", lang)}</p>
              <button
                onClick={goHome}
                className="w-full rounded-2xl bg-forest-900 py-3 text-sm font-semibold text-white"
              >
                {tx("callGoHome", lang)}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
