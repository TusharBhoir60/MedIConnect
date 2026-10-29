"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AudioPlay } from "@/components/VoiceRecorder";
import { RiskBadge } from "@/components/RiskBadge";
import { useStore, PHCS } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, Triage, Urgency, Visit } from "@/lib/types";
import { ArrowLeft, Camera, FileText, FlaskConical, Mic, Send, Stethoscope } from "lucide-react";

const DOCTOR_ID = "doc-1";
const REFERRAL_FACILITIES = ["Rural Hospital Gadchiroli", "District Hospital Gadchiroli", "Sub-District Hospital Wadsa"];
const PHC_TESTS = PHCS[0].diagnostics.filter((d) => d.available).map((d) => d.name);

export default function DoctorPatientDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { visits, patients, emergencies, lang, reviewVisit, createReferral, orderLab, pushSms, acknowledgeEmergency } =
    useStore();

  const visit = visits.find((v) => v.id === id);
  const patient = visit ? patients.find((p) => p.id === visit.patientId) : null;
  const pastVisits = patient
    ? visits.filter((v) => v.patientId === patient.id && v.id !== id).sort((a, b) => b.at.localeCompare(a.at))
    : [];

  const [triage, setTriage] = useState<Triage>("pending");
  const [advice, setAdvice] = useState("");
  const [refFacility, setRefFacility] = useState(REFERRAL_FACILITIES[0]);
  const [refPriority, setRefPriority] = useState<"urgent" | "routine">("routine");
  const [labTests, setLabTests] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [referred, setReferred] = useState(false);

  if (!visit || !patient) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-ink/50">{tx("visitNotFound", lang)}</p>
        <Link href="/doctor" className="mt-4 inline-block text-sm text-forest-700 underline">
          {tx("backToQueue", lang)}
        </Link>
      </main>
    );
  }

  const isSubmitted = visit.status === "submitted";
  const alreadyReviewed = visit.status === "reviewed" || visit.status === "referred";

  function handleSubmit() {
    if (triage === "pending" || !visit || !patient) return;
    reviewVisit(visit.id, triage, advice, DOCTOR_ID);
    /* reviewing the linked emergency counts as acknowledging it */
    const linked = emergencies.find((e) => e.visitId === visit.id && e.status !== "closed");
    if (linked && !linked.acknowledgedAt) acknowledgeEmergency(linked.id);
    labTests.forEach((t) =>
      orderLab({ patientId: patient.id, visitId: visit.id, phcId: PHCS[0].id, test: t, orderedBy: DOCTOR_ID }),
    );
    if (triage === "refer_dh") {
      setReferred(true);
      createReferral({
        patientId: patient.id,
        visitId: visit.id,
        fromPhcId: PHCS[0].id,
        toFacility: refFacility,
        reason: advice || visit.notes || "Referred by PHC MO",
        priority: refPriority,
        doctorId: DOCTOR_ID,
      });
      pushSms({
        to: patient.phone,
        body: `JanArogya: ${patient.name} la ${refFacility} sathi referral tayar. ASHA tumchya sah-nyane. ABHA record sobat.`,
        kind: "referral",
      });
    }
    setSubmitted(true);
    setTimeout(() => router.push("/doctor"), 1600);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/doctor"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest-700 hover:underline"
      >
        <ArrowLeft size={14} /> {tx("backToQueue", lang)}
      </Link>

      {/* Patient header */}
      <div className="rounded-2xl bg-forest-950 px-5 py-5 text-sand-50 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sand-300">{tx("patientInfo", lang)}</p>
            <h1 className="font-display text-2xl sm:text-3xl">{patient.name}</h1>
            <p className="mt-1 text-sm text-sand-300">
              {patient.age} {patient.sex === "F" ? tx("sexFemale", lang) : patient.sex === "M" ? tx("sexMale", lang) : tx("sexOther", lang)} · {patient.village}, {patient.district}
            </p>
            <p className="mt-0.5 font-mono text-xs text-sand-400">ABHA {patient.abhaId}</p>
          </div>
          <RiskBadge risk={patient.risk} lang={lang} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.conditions.map((c) => (
            <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Visit info */}
      <section className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2 text-sm text-forest-800">
          <Stethoscope size={16} />
          <h2 className="font-medium">{tx("visitDetail", lang)}</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <InfoRow label={tx("visitAt", lang)} value={new Date(visit.at).toLocaleString("en-IN")} />
          <InfoRow label={tx("visitPlace", lang)} value={visit.place} />
        </div>
        {visit.urgency && (
          <div className="mt-3">
            <UrgencyChip urgency={visit.urgency} lang={lang} />
          </div>
        )}

        {/* ASHA Notes */}
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-widest text-ink/40">{tx("ashaNotes", lang)}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{visit.notes || "—"}</p>
        </div>
      </section>

      {/* Voice notes */}
      <section className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-forest-800">
            <Mic size={16} />
            <h2 className="font-medium">{tx("voiceNotes", lang)}</h2>
          </div>
          {visit.voiceNotes.length > 0 && (
            <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[11px] font-medium text-forest-800">
              {visit.voiceNotes.length} {tx("voiceCount", lang)}
            </span>
          )}
        </div>

        {visit.voiceNotes.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">{tx("noVoiceNotes", lang)}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {visit.voiceNotes.map((vn, i) => (
              <div key={vn.id} className="rounded-xl bg-sand-50 p-3">
                <div className="flex items-center justify-between text-xs text-ink/50">
                  <span>#{i + 1} · {vn.durationSec}s</span>
                  <span>{new Date(vn.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="mt-2" onClick={(e) => e.preventDefault()}>
                  <AudioPlay dataUrl={vn.dataUrl} label={tx("listen", lang)} />
                </div>
                {vn.transcript && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-widest text-ink/35">{tx("transcript", lang)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/65">{vn.transcript}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Photos / Attachments */}
      <section className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-forest-800">
            <Camera size={16} />
            <h2 className="font-medium">{tx("photos", lang)}</h2>
          </div>
          {visit.attachments.length > 0 && (
            <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[11px] font-medium text-forest-800">
              {visit.attachments.length} {tx("photoCount", lang)}
            </span>
          )}
        </div>

        {visit.attachments.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">{tx("noPhotos", lang)}</p>
        ) : (
          <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
            {visit.attachments.map((att) => (
              <div key={att.id} className="group overflow-hidden rounded-xl border border-sand-200 bg-sand-50">
                {att.dataUrl && att.kind !== "report" ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="aspect-square w-full cursor-pointer object-cover transition group-hover:scale-105"
                    onClick={() => window.open(att.dataUrl, "_blank")}
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-sand-100">
                    <FileText size={32} className="text-ink/30" />
                  </div>
                )}
                <div className="px-2.5 py-2">
                  <p className="truncate text-[11px] font-medium text-forest-900">{att.name}</p>
                  <p className="text-[10px] text-ink/40 capitalize">{att.kind}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past visits */}
      {pastVisits.length > 0 && (
        <section className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-medium text-forest-800">{tx("pastVisits", lang)}</h2>
          <div className="mt-3 space-y-2">
            {pastVisits.slice(0, 5).map((pv) => (
              <PastVisitRow key={pv.id} visit={pv} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Doctor review form */}
      <section className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-medium text-forest-800">
          <Stethoscope size={16} />
          {tx("doctorReview", lang)}
        </h2>

        {alreadyReviewed && !submitted ? (
          <div className="mt-4 rounded-xl bg-sand-50 p-4">
            <p className="text-sm text-forest-800">{tx("reviewSubmitted", lang)}</p>
            <p className="mt-1 text-xs text-ink/50">
              {tx("triageLabel", lang)}{" "}
              <span className="font-medium">
                {visit.triage === "not_emergency" ? tx("triageNotEm", lang)
                  : visit.triage === "emergency" ? tx("triageEm", lang)
                  : visit.triage === "refer_dh" ? tx("triageReferDh", lang)
                  : visit.triage}
              </span>
            </p>
            {visit.doctorAdvice && (
              <p className="mt-2 text-sm text-ink/70">{visit.doctorAdvice}</p>
            )}
          </div>
        ) : submitted ? (
          <div className="mt-4 rounded-xl bg-forest-50 p-4 text-center">
            <p className="text-sm font-medium text-forest-800">{tx("reviewSubmitted", lang)} ✓</p>
            {referred && <p className="mt-1 text-xs text-forest-700">{tx("referSent", lang)}</p>}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Triage */}
            <div>
              <p className="text-xs font-medium text-ink/60">{tx("triage", lang)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <TriageBtn
                  active={triage === "not_emergency"}
                  onClick={() => setTriage("not_emergency")}
                  label={tx("triageNotEm", lang)}
                  color="forest"
                />
                <TriageBtn
                  active={triage === "emergency"}
                  onClick={() => setTriage("emergency")}
                  label={tx("triageEm", lang)}
                  color="clay"
                />
                <TriageBtn
                  active={triage === "refer_dh"}
                  onClick={() => setTriage("refer_dh")}
                  label={tx("triageReferDh", lang)}
                  color="ink"
                />
              </div>
            </div>

            {/* Referral slip — tracked till the patient reaches RH / DH */}
            {triage === "refer_dh" && (
              <div className="rounded-xl border border-forest-900/10 bg-sand-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-forest-900">
                  <Send size={13} /> {tx("triageReferDh", lang)} — {tx("referralsTitle", lang)}
                </p>
                <label className="mt-2 block text-xs">
                  {tx("referFacility", lang)}
                  <select
                    className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
                    value={refFacility}
                    onChange={(e) => setRefFacility(e.target.value)}
                  >
                    {REFERRAL_FACILITIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-2">
                  <p className="text-xs">{tx("referPriority", lang)}</p>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRefPriority("routine")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                        refPriority === "routine" ? "bg-forest-800 text-white ring-forest-800" : "bg-white text-ink/60 ring-sand-300"
                      }`}
                    >
                      {tx("prioRoutine", lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefPriority("urgent")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                        refPriority === "urgent" ? "bg-clay-500 text-white ring-clay-500" : "bg-white text-clay-700 ring-clay-300"
                      }`}
                    >
                      {tx("prioUrgent", lang)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lab orders — sample collected by ASHA, result back at PHC */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink/60">
                <FlaskConical size={13} /> {tx("orderTest", lang)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PHC_TESTS.map((t) => {
                  const on = labTests.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLabTests((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                        on ? "bg-forest-800 text-white ring-forest-800" : "bg-white text-ink/60 ring-sand-300"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advice */}
            <div>
              <p className="text-xs font-medium text-ink/60">{tx("advice", lang)}</p>
              <textarea
                className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                rows={4}
                placeholder={tx("advicePlaceholder", lang)}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={triage === "pending"}
              className="w-full rounded-2xl bg-forest-800 py-3 text-sm font-medium text-sand-50 transition hover:bg-forest-700 disabled:opacity-40"
            >
              {tx("submitReview", lang)}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

/* ── Helper components ────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-ink/40">{label}</p>
      <p className="text-sm text-ink/80">{value}</p>
    </div>
  );
}

function UrgencyChip({ urgency, lang }: { urgency: Urgency; lang: Lang }) {
  const label = urgency === "emergency" ? tx("urgEmergency", lang) : urgency === "urgent" ? tx("urgUrgent", lang) : tx("urgRoutine", lang);
  const cls =
    urgency === "emergency"
      ? "bg-clay-500 text-white"
      : urgency === "urgent"
        ? "bg-clay-100 text-clay-700"
        : "bg-sand-200 text-ink/55";
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

function TriageBtn({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: "forest" | "clay" | "ink";
}) {
  const colors = {
    forest: active ? "bg-forest-800 text-white ring-forest-800" : "bg-forest-50 text-forest-800 ring-forest-200",
    clay: active ? "bg-clay-500 text-white ring-clay-500" : "bg-clay-50 text-clay-700 ring-clay-200",
    ink: active ? "bg-ink text-white ring-ink" : "bg-sand-100 text-ink/70 ring-sand-300",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-medium ring-1 transition ${colors[color]}`}
    >
      {label}
    </button>
  );
}

function PastVisitRow({ visit: v, lang }: { visit: Visit; lang: Lang }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-sand-50 px-3.5 py-2.5 text-sm">
      <div>
        <p className="text-xs text-ink/60">{new Date(v.at).toLocaleDateString("en-IN")}</p>
        <p className="mt-0.5 text-[11px] text-ink/40 line-clamp-1">{v.notes}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          v.status === "reviewed"
            ? "bg-forest-100 text-forest-700"
            : v.status === "referred"
            ? "bg-clay-100 text-clay-700"
            : "bg-sand-200 text-ink/50"
        }`}
      >
        {v.status === "reviewed" ? tx("vsReviewed", lang)
          : v.status === "referred" ? tx("vsReferred", lang)
          : v.status === "submitted" ? tx("vsSentToDoctor", lang)
          : tx("vsDraft", lang)}
      </span>
    </div>
  );
}
