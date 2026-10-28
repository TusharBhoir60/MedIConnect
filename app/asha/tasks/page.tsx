"use client";

import Link from "next/link";
import { ASHA, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { CareKind, Lang } from "@/lib/types";
import { Baby, Check, FlaskConical, HeartPulse, Send, Stethoscope } from "lucide-react";

export default function TasksPage() {
  const { followUps, patients, labs, referrals, markFollowUpDone, setLabStatus, markCareDone, lang } =
    useStore();

  const mine = new Set(patients.filter((p) => p.ashaId === ASHA.id).map((p) => p.id));
  const dueFollow = followUps.filter((f) => mine.has(f.patientId) && !f.done);
  const dueLabs = labs.filter((l) => mine.has(l.patientId) && l.status === "ordered");
  const careDue = patients
    .filter((p) => p.ashaId === ASHA.id && p.carePlan?.some((c) => !c.done))
    .flatMap((p) => (p.carePlan ?? []).filter((c) => !c.done).map((c) => ({ patient: p, care: c })))
    .sort((a, b) => a.care.dueDate.localeCompare(b.care.dueDate));
  const traceRefs = referrals.filter((r) => mine.has(r.patientId) && r.status === "referred");
  const openCount = dueFollow.length + dueLabs.length + careDue.length + traceRefs.length;

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-forest-950">{tx("tasksTitle", lang)}</h1>
        <p className="text-xs text-ink/50">{tx("tasksSub", lang)}</p>

        {openCount === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-10 text-center text-sm text-ink/45">
            {tx("noTasks", lang)}
          </p>
        )}

        {/* Follow-ups */}
        {dueFollow.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <Stethoscope size={12} /> {tx("followUpTitle", lang)} · {dueFollow.length}
            </h2>
            <div className="mt-2 space-y-2">
              {dueFollow.map((f) => {
                const p = patients.find((x) => x.id === f.patientId);
                return (
                  <div key={f.id} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
                    <p className="text-xs text-clay-500">
                      {f.from === "doctor" ? tx("fromDoctor", lang) : tx("fromPhc", lang)} · {tx("careDueLabel", lang)} {f.dueDate}
                    </p>
                    <p className="font-medium">{p?.name}</p>
                    <p className="mt-1 text-sm text-ink/70">{f.message}</p>
                    <button
                      onClick={() => markFollowUpDone(f.id)}
                      className="mt-3 flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs text-white"
                    >
                      <Check size={12} /> {tx("markDone", lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lab samples to collect at patient's home */}
        {dueLabs.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <FlaskConical size={12} /> {tx("labTasks", lang)} · {dueLabs.length}
            </h2>
            <div className="mt-2 space-y-2">
              {dueLabs.map((l) => {
                const p = patients.find((x) => x.id === l.patientId);
                return (
                  <div key={l.id} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
                    <p className="text-xs text-clay-500">{tx("labSt_ordered", lang)} · {l.orderedAt.slice(0, 10)}</p>
                    <p className="font-medium">{p?.name} — {l.test}</p>
                    <p className="mt-1 text-xs text-ink/50">{tx("labSt_ordered", lang)} → {tx("labSt_sample_collected", lang)}</p>
                    <button
                      onClick={() => setLabStatus(l.id, "sample_collected")}
                      className="mt-3 flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs text-white"
                    >
                      <Check size={12} /> {tx("markSampleCollected", lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Care plan due — ANC / immunisation / NCD */}
        {careDue.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <HeartPulse size={12} /> {tx("carePlan", lang)} · {careDue.length}
            </h2>
            <div className="mt-2 space-y-2">
              {careDue.map(({ patient, care }) => (
                <div key={care.id} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{patient.name} — {care.label}</p>
                      <p className="mt-1 text-xs text-ink/50">{tx("careDueLabel", lang)} {care.dueDate}</p>
                    </div>
                    <CareChip kind={care.kind} lang={lang} />
                  </div>
                  <button
                    onClick={() => markCareDone(patient.id, care.id)}
                    className="mt-3 flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs text-white"
                  >
                    <Check size={12} /> {tx("markDone", lang)}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Referral arrivals to confirm */}
        {traceRefs.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <Send size={12} /> {tx("referralsTitle", lang)} · {traceRefs.length}
            </h2>
            <div className="mt-2 space-y-2">
              {traceRefs.map((r) => {
                const p = patients.find((x) => x.id === r.patientId);
                return (
                  <Link
                    key={r.id}
                    href="/asha/referrals"
                    className="block rounded-2xl border border-clay-300 bg-white p-4 shadow-card"
                  >
                    <p className="font-medium">{p?.name} → {r.toFacility}</p>
                    <p className="mt-1 text-xs text-clay-500">{tx("confirmArrival", lang)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function CareChip({ kind, lang }: { kind: CareKind; lang: Lang }) {
  const label = kind === "anc" ? tx("careAnc", lang) : kind === "immunisation" ? tx("careImm", lang) : tx("careNcd", lang);
  const cls =
    kind === "anc"
      ? "bg-clay-100 text-clay-700"
      : kind === "immunisation"
        ? "bg-forest-100 text-forest-700"
        : "bg-sand-200 text-ink/60";
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {kind === "immunisation" && <Baby size={11} />}
      {label}
    </span>
  );
}
