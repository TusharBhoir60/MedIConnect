"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AudioPlay } from "@/components/VoiceRecorder";
import { RiskBadge } from "@/components/RiskBadge";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, Visit, VisitStatus, Referral, LabOrder, FollowUp, CareDue } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  MapPin,
  Mic,
  Phone,
  Plus,
  Send,
  Stethoscope,
  UserCheck,
} from "lucide-react";

/* ── helpers ── */
function visitStatusPill(status: VisitStatus, lang: Lang) {
  const label =
    status === "submitted" ? tx("vsSentToDoctor", lang)
    : status === "reviewed" ? tx("vsDoctorAdvice", lang)
    : status === "referred" ? tx("vsReferRhDh", lang)
    : tx("vsDraft", lang);
  const cls =
    status === "submitted" ? "bg-clay-100 text-clay-700"
    : status === "reviewed" ? "bg-forest-100 text-forest-700"
    : status === "referred" ? "bg-blue-100 text-blue-700"
    : "bg-sand-200 text-ink/55";
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${cls}`}>{label}</span>;
}

function refStatusPill(status: Referral["status"], lang: Lang) {
  const map: Record<string, string> = {
    referred: "bg-clay-100 text-clay-700",
    reached:  "bg-blue-100 text-blue-700",
    treated:  "bg-forest-100 text-forest-700",
    lost:     "bg-red-100 text-red-700",
  };
  const labelMap: Record<string, string> = {
    referred: tx("refSt_referred", lang),
    reached:  tx("refSt_reached", lang),
    treated:  tx("refSt_treated", lang),
    lost:     tx("refSt_lost", lang),
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-sand-100 text-ink/55"}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

function labStatusPill(status: LabOrder["status"], lang: Lang) {
  const map: Record<string, string> = {
    ordered:          "bg-sand-200 text-ink/55",
    sample_collected: "bg-blue-100 text-blue-700",
    result_ready:     "bg-forest-100 text-forest-700",
    delivered:        "bg-forest-50 text-forest-500",
  };
  const labelMap: Record<string, string> = {
    ordered:          tx("labSt_ordered", lang),
    sample_collected: tx("labSt_sample_collected", lang),
    result_ready:     tx("labSt_result_ready", lang),
    delivered:        tx("labSt_delivered", lang),
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? "bg-sand-100 text-ink/55"}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

/* ── collapsible visit card ── */
function VisitCard({ visit: v, lang, index }: { visit: Visit; lang: Lang; index: number }) {
  const [open, setOpen] = React.useState(index === 0);

  return (
    <div className={`rounded-2xl border bg-white transition-all ${open ? "border-forest-900/15" : "border-sand-200"}`}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-900/7 text-forest-700">
          <Stethoscope size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {new Date(v.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {visitStatusPill(v.status, lang)}
            {v.urgency && v.urgency !== "routine" && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.urgency === "emergency" ? "bg-clay-500 text-white" : "bg-clay-100 text-clay-700"}`}>
                {v.urgency}
              </span>
            )}
          </div>
          {!open && (
            <p className="mt-0.5 truncate text-xs text-ink/55">{v.place} · {v.notes.slice(0, 60)}{v.notes.length > 60 ? "…" : ""}</p>
          )}
        </div>
        <div className="shrink-0 text-ink/30">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-sand-100 px-4 py-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-ink/45">
            <MapPin size={11} className="shrink-0" />
            {v.place} · {new Date(v.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>

          <p className="text-sm text-ink/80">{v.notes}</p>

          {v.voiceNotes.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                <Mic size={11} /> {v.voiceNotes.length} {tx("voice", lang)} {v.voiceNotes.length === 1 ? tx("voiceNoteCountSingle", lang) : tx("voiceNoteCountPlural", lang)}
              </p>
              {v.voiceNotes.map((n) => (
                <div key={n.id} className="rounded-xl bg-sand-50 p-2.5">
                  <AudioPlay dataUrl={n.dataUrl} label={`${n.durationSec}s · ${tx("listen", lang)}`} />
                  {n.transcript && (
                    <p className="mt-1.5 text-[11px] italic text-ink/55">{n.transcript}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {v.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {v.attachments.map((a) => (
                <img key={a.id} src={a.dataUrl} alt={a.name} className="h-20 w-20 rounded-xl object-cover border border-sand-200" />
              ))}
            </div>
          )}

          {v.doctorAdvice && (
            <div className="rounded-xl bg-forest-900/6 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">
                {tx("doctorLabel", lang)}
              </p>
              <p className="mt-0.5 text-sm text-forest-900">{v.doctorAdvice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── care chip ── */
function CareChip({ item }: { item: CareDue }) {
  const isOverdue = new Date(item.dueDate) < new Date();
  const kindColor =
    item.kind === "anc"           ? "bg-pink-50 text-pink-700 ring-pink-200"
    : item.kind === "immunisation" ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
    : "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 ${isOverdue ? "bg-red-50 ring-red-200" : kindColor} ${item.done ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        {item.done
          ? <CheckCircle2 size={13} className="shrink-0 text-forest-600" />
          : <CalendarDays size={13} className="shrink-0" />}
        <p className={`text-sm ${item.done ? "line-through" : ""}`}>{item.label}</p>
      </div>
      <span className={`ml-2 shrink-0 text-xs font-medium ${isOverdue && !item.done ? "text-red-600" : "text-ink/45"}`}>
        {isOverdue && !item.done ? "⚠ " : ""}{item.dueDate}
      </span>
    </div>
  );
}

/* ── main page ── */
import React from "react";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patients, visits, followUps, referrals, labs, lang, markFollowUpDone, markCareDone } = useStore();

  const p = patients.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-ink/50">{tx("patientNotFound", lang)}</p>
        <Link href="/asha" className="text-sm font-medium text-forest-700">{tx("backToList", lang)}</Link>
      </div>
    );
  }

  const pVisits   = [...visits.filter((v) => v.patientId === p.id)].sort((a, b) => b.at.localeCompare(a.at));
  const pFollowUps = followUps.filter((f) => f.patientId === p.id);
  const pReferrals = referrals.filter((r) => r.patientId === p.id);
  const pLabs      = labs.filter((l) => l.patientId === p.id);
  const carePlan   = p.carePlan ?? [];

  const openFollowUps  = pFollowUps.filter((f) => !f.done);
  const openReferrals  = pReferrals.filter((r) => r.status === "referred" || r.status === "reached");
  const pendingLabs    = pLabs.filter((l) => l.status !== "delivered");
  const pendingCare    = carePlan.filter((c) => !c.done);

  const alertCount = openFollowUps.length + openReferrals.length + pendingCare.length;

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50">

      {/* ── Header ── */}
      <div className="bg-forest-900 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-sand-50 sm:px-6">
        <button
          onClick={() => router.back()}
          className="mb-2 flex items-center gap-1 text-[11px] text-sand-400 hover:text-sand-200"
        >
          ← {tx("backToList", lang)}
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-tight">{p.name}</h1>
            <p className="mt-0.5 text-xs text-sand-300">
              {p.age}{tx("yrs", lang)} ·{" "}
              {p.sex === "F" ? tx("sexFemale", lang) : p.sex === "M" ? tx("sexMale", lang) : tx("sexOther", lang)} ·{" "}
              {p.village}, {p.district}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-[11px] text-forest-300">ABHA {p.abhaId}</span>
              {p.phone && (
                <a href={`tel:${p.phone}`} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-sand-200 hover:bg-white/20">
                  <Phone size={10} /> {p.phone}
                </a>
              )}
            </div>
          </div>
          <RiskBadge risk={p.risk} lang={lang} />
        </div>

        {/* conditions pills */}
        {p.conditions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.conditions.map((c) => (
              <span key={c} className="rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] text-sand-100">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* alert strip */}
        {alertCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-clay-500/80 px-3 py-2 text-xs text-white">
            <AlertTriangle size={13} className="shrink-0" />
            {alertCount} {tx("pendingActions", lang)} —{" "}
            {openFollowUps.length > 0 && `${openFollowUps.length} ${tx("pendingFollowUpCount", lang)}`}
            {openReferrals.length > 0 && ` · ${openReferrals.length} ${tx("pendingReferralCount", lang)}`}
            {pendingCare.length > 0 && ` · ${pendingCare.length} ${tx("pendingCarePlanCount", lang)}`}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Link
            href={`/asha/visit?mode=existing&patientId=${p.id}`}
            className="flex items-center justify-between gap-2 rounded-2xl bg-forest-800 px-4 py-3 text-sand-50"
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium"><Plus size={15} /> {tx("newVisitBtn", lang)}</p>
              <p className="mt-0.5 text-[11px] text-sand-300">{tx("addHomeVisit", lang)}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 opacity-60" />
          </Link>
          <a
            href={`tel:${p.phone}`}
            className="flex items-center justify-between gap-2 rounded-2xl border border-forest-900/10 bg-white px-4 py-3 shadow-card"
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-forest-950"><Phone size={15} className="text-forest-700" /> {tx("callBtn", lang)}</p>
              <p className="mt-0.5 text-[11px] text-ink/50">{p.phone}</p>
            </div>
          </a>
          <Link
            href="/asha/tasks"
            className="flex items-center justify-between gap-2 rounded-2xl border border-forest-900/10 bg-white px-4 py-3 shadow-card sm:col-span-1 col-span-2"
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-forest-950"><ClipboardList size={15} className="text-forest-700" /> {tx("tasksTitle", lang)}</p>
              <p className="mt-0.5 text-[11px] text-ink/50">{alertCount} {tx("openCount", lang)}</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-8 pt-5 sm:px-6">

        {/* ── Care plan ── */}
        {carePlan.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">
              <BadgeCheck size={13} /> {tx("carePlan", lang)} · {pendingCare.length} {tx("carePlanPending", lang)}
            </h2>
            <div className="space-y-1.5">
              {carePlan.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <CareChip item={item} />
                  </div>
                  {!item.done && (
                    <button
                      onClick={() => markCareDone(p.id, item.id)}
                      className="shrink-0 rounded-xl bg-forest-800 px-3 py-2 text-[11px] font-medium text-white hover:bg-forest-700"
                    >
                      {tx("doneBtn", lang)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Follow-ups ── */}
        {pFollowUps.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">
              <UserCheck size={13} /> {tx("followUps", lang)} · {openFollowUps.length} {tx("openCount", lang)}
            </h2>
            <div className="space-y-2">
              {pFollowUps.map((f) => (
                <div
                  key={f.id}
                  className={`rounded-2xl bg-white px-4 py-3 shadow-card ${f.done ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.from === "doctor" ? "bg-forest-100 text-forest-700" : "bg-blue-100 text-blue-700"}`}>
                          {f.from === "doctor" ? tx("fromDoctor", lang) : tx("fromPhc", lang)}
                        </span>
                        <span className={`text-[11px] ${new Date(f.dueDate) < new Date() && !f.done ? "font-semibold text-clay-600" : "text-ink/40"}`}>
                          {new Date(f.dueDate) < new Date() && !f.done ? "⚠ " : ""}{f.dueDate}
                        </span>
                      </div>
                      <p className="text-sm text-ink/80">{f.message}</p>
                    </div>
                    {!f.done && (
                      <button
                        onClick={() => markFollowUpDone(f.id)}
                        className="shrink-0 rounded-xl bg-forest-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-forest-700"
                      >
                        {tx("markDone", lang)}
                      </button>
                    )}
                  </div>
                  {f.done && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-forest-600">
                      <CheckCircle2 size={11} /> {tx("doneBtn", lang)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Referrals ── */}
        {pReferrals.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">
              <Send size={13} /> {tx("navReferrals", lang)} · {pReferrals.length}
            </h2>
            <div className="space-y-2">
              {pReferrals.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white px-4 py-3 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-forest-950">
                        <MapPin size={12} className="text-forest-700 shrink-0" />
                        {r.toFacility}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/60">{r.reason}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {refStatusPill(r.status, lang)}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.priority === "urgent" ? "bg-clay-100 text-clay-700" : "bg-sand-100 text-ink/55"}`}>
                        {r.priority === "urgent" ? tx("prioUrgent", lang) : tx("prioRoutine", lang)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink/40">
                    {tx("referredLabel", lang)} {r.at.slice(0, 10)}
                    {r.reachedAt ? ` · ${tx("reachedLabel", lang)} ${r.reachedAt.slice(0, 10)}` : ""}
                  </p>
                  {r.outcome && (
                    <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-800">
                      {tx("outcomeLabel", lang)} {r.outcome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Lab orders ── */}
        {pLabs.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">
              <FlaskConical size={13} /> {tx("labsTitle", lang)} · {pendingLabs.length} {tx("labsPending", lang)}
            </h2>
            <div className="space-y-2">
              {pLabs.map((l) => (
                <div key={l.id} className="rounded-2xl bg-white px-4 py-3 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-forest-950">{l.test}</p>
                    {labStatusPill(l.status, lang)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink/40">
                    {tx("orderedLabel", lang)} {l.orderedAt.slice(0, 10)}
                    {l.resultAt ? ` · ${tx("resultAtLabel", lang)} ${l.resultAt.slice(0, 10)}` : ""}
                  </p>
                  {l.result && (
                    <p className="mt-1.5 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-800">
                      {l.result}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Visit history ── */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">
            <Stethoscope size={13} /> {tx("visits", lang)} · {pVisits.length}
          </h2>

          {pVisits.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-8 text-center text-sm text-ink/45">
              {tx("noVisitYet", lang)}
            </p>
          ) : (
            <div className="space-y-2">
              {pVisits.map((v, i) => (
                <VisitCard key={v.id} visit={v} lang={lang} index={i} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
