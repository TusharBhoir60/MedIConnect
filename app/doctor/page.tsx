"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AudioPlay } from "@/components/VoiceRecorder";
import { RiskBadge } from "@/components/RiskBadge";
import { useStore, DOCTORS } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, Patient, Referral, Urgency, Visit } from "@/lib/types";
import {
  Bell,
  Camera,
  Check,
  MapPin,
  Mic,
  Phone,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";

const URGENCY_RANK: Record<Urgency, number> = { emergency: 0, urgent: 1, routine: 2 };

function minutesSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function DoctorQueue() {
  const {
    visits,
    patients,
    emergencies,
    referrals,
    calls,
    setReferralStatus,
    acknowledgeEmergency,
    escalateEmergency,
    lang,
  } = useStore();
  const [q, setQ] = useState("");
  const doc = DOCTORS[0];

  const queue = visits
    .filter((v) => v.status === "submitted")
    .sort(
      (a, b) =>
        URGENCY_RANK[a.urgency ?? "routine"] - URGENCY_RANK[b.urgency ?? "routine"] ||
        (a.submittedAt ?? a.at).localeCompare(b.submittedAt ?? b.at),
    );
  const done = visits.filter((v) => v.status === "reviewed" || v.status === "referred");
  const openEm = emergencies.filter((e) => e.status !== "closed");

  /* Referrals needing action at PHC level */
  const openReferrals = referrals
    .filter((r) => r.status === "referred" || r.status === "reached")
    .slice(0, 5);

  /* Recent IVR / JanVaani calls */
  const recentCalls = [...calls]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 4);

  const query = q.trim().toLowerCase();
  const filteredQueue = useMemo(() => {
    if (!query) return queue;
    return queue.filter((v) => {
      const p = patients.find((x) => x.id === v.patientId);
      if (!p) return false;
      const blob =
        `${p.name} ${p.village} ${p.phone} ${p.abhaId} ${v.notes}`.toLowerCase();
      return blob.includes(query);
    });
  }, [queue, patients, query]);

  return (
    <div className="flex-1 bg-sand-50">
      {/* ── Header ── */}
      <header className="bg-forest-900 px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6 lg:px-8 lg:pb-4 lg:pt-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            {/*
              Identity block:
              - Mobile (< lg): full name + PHC + counts (DoctorShell top bar is compact,
                so we still show the page-level hero here)
              - Desktop (lg+): sidebar already shows doctor name/specialty →
                show only the queue summary line, no redundant name repeat
            */}
            <div>
              <div className="lg:hidden">
                <p className="text-[11px] uppercase tracking-widest text-clay-300">
                  {tx("phcMo", lang)}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl">{doc.name}</h1>
              </div>
              <p className="text-xs text-sand-300 lg:text-sm">
                PHC Armori ·{" "}
                <span className="font-medium text-sand-50">{queue.length}</span>{" "}
                {tx("newEntries", lang)} ·{" "}
                <span className="font-medium text-sand-50">{done.length}</span>{" "}
                {tx("reviewed", lang)}
              </p>
            </div>

            {/* Emergency / facility bell — always visible */}
            <Link
              href="/doctor/facility"
              className="relative rounded-full bg-white/10 p-2 hover:bg-white/20"
              aria-label="Facility"
            >
              <Bell size={18} />
              {openEm.length > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay-400" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">

        {/* Emergency SLA strips */}
        {openEm.map((e) => {
          const p = patients.find((x) => x.id === e.patientId);
          const mins = minutesSince(e.at);
          const breached = !e.acknowledgedAt && mins >= 10;
          const inner = (
            <div
              className={`rounded-2xl px-4 py-3 text-sm text-white ${
                breached ? "bg-ink" : "bg-clay-500"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {p?.name}: {e.reason}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-white/85">
                    <Timer size={12} />
                    {e.acknowledgedAt ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={12} /> {tx("acknowledged", lang)}{" "}
                        {new Date(e.acknowledgedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : breached ? (
                      <span className="font-semibold">
                        {tx("slaBreach", lang)} ·{" "}
                        {tx("slaWaiting", lang).replace("{min}", String(mins))}
                      </span>
                    ) : (
                      <span>
                        {tx("slaWaiting", lang).replace("{min}", String(mins))} ·{" "}
                        {tx("slaAckIn", lang).replace(
                          "{min}",
                          String(Math.max(0, 10 - mins)),
                        )}
                      </span>
                    )}
                    {e.escalatedAt && <span>· {tx("escalatedTo", lang)}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!e.acknowledgedAt && (
                    <button
                      onClick={(ev) => {
                        ev.preventDefault();
                        acknowledgeEmergency(e.id);
                      }}
                      className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30"
                    >
                      {tx("ack", lang)}
                    </button>
                  )}
                  {!e.escalatedAt && (
                    <button
                      onClick={(ev) => {
                        ev.preventDefault();
                        escalateEmergency(e.id);
                      }}
                      className="rounded-full bg-forest-950 px-3 py-1.5 text-xs font-medium"
                    >
                      {tx("escalateNow", lang)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
          return e.visitId ? (
            <Link key={e.id} href={`/doctor/patient/${e.visitId}`}>
              {inner}
            </Link>
          ) : (
            <div key={e.id}>{inner}</div>
          );
        })}

        {/* Search */}
        <label className="relative block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tx("searchFull", lang)}
            className="w-full rounded-2xl border border-sand-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-forest-700/20 focus:ring-2"
          />
        </label>

        {/* Main grid:
            - Mobile (< md):  single column, all sections stack
            - Tablet (md–lg): 2 columns — ASHA queue takes left, referrals+IVR on right
            - Desktop (lg+):  3 columns — 5 + 4 + 3 split
        */}
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-12">

          {/* ── ASHA queue (submitted visits) ── */}
          <section className="lg:col-span-5">
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
              {tx("ashaQueue", lang)} · {tx("newEntries", lang)}
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              {filteredQueue.length} {tx("newEntries", lang)} —{" "}
              {tx("ashaQueueSub", lang)}
            </p>
            <div className="mt-3 space-y-2">
              {filteredQueue.length === 0 && (
                <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-ink/45">
                  {tx("noPending", lang)}
                </p>
              )}
              {filteredQueue.map((v) => {
                const p = patients.find((x) => x.id === v.patientId);
                if (!p) return null;
                return <QueueCard key={v.id} patient={p} visit={v} lang={lang} />;
              })}
            </div>
          </section>

          {/* ── Right side: Referral queue + IVR calls + Previous decisions ── */}
          {/* On md: second column; on lg: split further into col-span-4 and col-span-3 */}
          <div className="space-y-5 lg:col-span-7 lg:grid lg:grid-cols-7 lg:items-start lg:gap-6 lg:space-y-0">

            {/* ── Middle column: Referral queue + IVR calls ── */}
            <section className="space-y-5 lg:col-span-4">

              {/* Referral mini-board */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
                    {tx("refBoardTitle", lang)} · {openReferrals.length}
                  </h2>
                  <Link
                    href="/doctor/referrals"
                    className="text-[11px] font-medium text-forest-700 hover:underline"
                  >
                    {tx("openFile", lang)}
                  </Link>
                </div>
                <div className="mt-2 space-y-2">
                  {openReferrals.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-4 text-center text-xs text-ink/45">
                      {tx("noReferrals", lang)}
                    </p>
                  )}
                  {openReferrals.map((r) => {
                    const p = patients.find((x) => x.id === r.patientId);
                    return (
                      <ReferralMiniCard
                        key={r.id}
                        referral={r}
                        patientName={p?.name ?? "—"}
                        lang={lang}
                        onReached={() => setReferralStatus(r.id, "reached")}
                        onLost={() => setReferralStatus(r.id, "lost")}
                      />
                    );
                  })}
                </div>
              </div>

              {/* JanVaani IVR call log */}
              <div>
                <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
                  {tx("noteJanVaani", lang)} · {tx("hotlineDemo", lang)}
                </h2>
                <div className="mt-2 space-y-2">
                  {recentCalls.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-4 text-center text-xs text-ink/45">
                      {tx("noSmsYet", lang)}
                    </p>
                  )}
                  {recentCalls.map((c) => {
                    const p = patients.find((x) => x.id === c.patientId);
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl bg-white px-4 py-3 shadow-card"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-forest-950">
                            <Phone size={13} className="text-forest-700" />
                            {p?.name ?? "—"}
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              c.outcome === "resolved"
                                ? "bg-forest-100 text-forest-700"
                                : "bg-clay-100 text-clay-700"
                            }`}
                          >
                            {c.outcome}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink/40">
                          {new Date(c.startedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {c.transcript.length > 0 && (
                          <p className="mt-1 text-[11px] text-ink/55 line-clamp-2">
                            {c.transcript[c.transcript.length - 1]?.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Previous decisions ── */}
            <section className="lg:col-span-3">
              <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
                {tx("prevDecisions", lang)}
              </h2>
              <p className="mt-1 text-xs text-ink/50">
                {done.length} {tx("reviewed", lang)}
              </p>
              <div className="mt-3 space-y-2">
                {done.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-ink/45">
                    {tx("noPrevDecisions", lang)}
                  </p>
                )}
                {done.map((v) => {
                  const p = patients.find((x) => x.id === v.patientId);
                  if (!p) return null;
                  return <DoneRow key={v.id} patient={p} visit={v} lang={lang} />;
                })}
              </div>
            </section>

          </div>{/* end right-side wrapper */}
        </div>

        {/* ── ABHA Patient Records Panel ── */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
              {tx("patientInfo", lang)} · ABHA {tx("fhirChip", lang)}
            </h2>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {patients.map((p) => {
              const lastVisit = visits
                .filter((v) => v.patientId === p.id)
                .sort((a, b) => b.at.localeCompare(a.at))[0];
              const openRef = referrals.find(
                (r) =>
                  r.patientId === p.id &&
                  (r.status === "referred" || r.status === "reached"),
              );
              return (
                <AbhaCard
                  key={p.id}
                  patient={p}
                  lastVisit={lastVisit}
                  hasOpenReferral={!!openRef}
                  lang={lang}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Queue card ── */
function QueueCard({
  patient: p,
  visit: v,
  lang,
}: {
  patient: Patient;
  visit: Visit;
  lang: Lang;
}) {
  return (
    <Link
      href={`/doctor/patient/${v.id}`}
      className="flex flex-col gap-2 rounded-2xl bg-white px-4 py-3 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-950">{p.name}</p>
          <p className="text-xs text-ink/50">
            {p.age}
            {p.sex} · {p.village} · {tx("ashaName", lang)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <RiskBadge risk={p.risk} lang={lang} />
          {v.urgency && v.urgency !== "routine" && (
            <UrgencyChip urgency={v.urgency} lang={lang} />
          )}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/40">
        <span>
          {new Date(v.at).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {v.place}
        </span>
        {v.submittedAt && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              v.urgency === "emergency"
                ? "bg-clay-500 text-white"
                : v.urgency === "urgent"
                  ? "bg-clay-100 text-clay-700"
                  : "bg-sand-200 text-ink/55"
            }`}
          >
            <Timer size={10} />
            {tx("slaWaiting", lang).replace(
              "{min}",
              String(minutesSince(v.submittedAt)),
            )}
          </span>
        )}
      </p>

      <p className="line-clamp-2 text-sm text-ink/75">
        {v.notes || tx("voice", lang)}
      </p>

      {v.voiceNotes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-forest-700">
            <Mic size={12} />
            {v.voiceNotes.length} {tx("voiceCount", lang)}
          </div>
          {v.voiceNotes.map((vn) => (
            <div key={vn.id} className="rounded-lg bg-sand-50 p-2">
              <div onClick={(e) => e.preventDefault()}>
                <AudioPlay dataUrl={vn.dataUrl} label={tx("listen", lang)} />
              </div>
              {vn.transcript && (
                <p className="mt-1 line-clamp-2 text-[11px] text-ink/50">
                  {vn.transcript}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {v.attachments.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-forest-700">
            <Camera size={12} />
            {v.attachments.length} {tx("photoCount", lang)}
          </div>
          <div className="mt-1.5 flex gap-2">
            {v.attachments.slice(0, 3).map((att) => (
              <div
                key={att.id}
                className="h-12 w-12 overflow-hidden rounded-lg border border-sand-200 bg-sand-50"
                onClick={(e) => e.preventDefault()}
              >
                {att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[9px] text-ink/30">
                    {att.kind}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-forest-700">{tx("openFile", lang)}</p>
    </Link>
  );
}

/* ── Urgency chip ── */
function UrgencyChip({ urgency, lang }: { urgency: Urgency; lang: Lang }) {
  const label =
    urgency === "emergency"
      ? tx("urgEmergency", lang)
      : urgency === "urgent"
        ? tx("urgUrgent", lang)
        : tx("urgRoutine", lang);
  const cls =
    urgency === "emergency"
      ? "bg-clay-500 text-white"
      : urgency === "urgent"
        ? "bg-clay-100 text-clay-700"
        : "bg-sand-200 text-ink/55";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

/* ── Done row ── */
function DoneRow({
  patient: p,
  visit: v,
  lang,
}: {
  patient: Patient;
  visit: Visit;
  lang: Lang;
}) {
  const triageLabel =
    v.triage === "not_emergency"
      ? tx("triageNotEm", lang)
      : v.triage === "emergency"
        ? tx("triageEm", lang)
        : v.triage === "refer_dh"
          ? tx("triageReferDh", lang)
          : v.triage;
  return (
    <Link
      href={`/doctor/patient/${v.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-forest-950">{p.name}</p>
        <p className="text-xs text-ink/50">
          {p.village} · {triageLabel}
        </p>
        {v.doctorAdvice && (
          <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-ink/40">
            {v.doctorAdvice}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          v.status === "reviewed"
            ? "bg-forest-100 text-forest-700"
            : "bg-clay-100 text-clay-700"
        }`}
      >
        {v.status === "reviewed" ? tx("vsReviewed", lang) : tx("vsReferred", lang)}
      </span>
    </Link>
  );
}

/* ── Referral mini-card ── */
function ReferralMiniCard({
  referral: r,
  patientName,
  lang,
  onReached,
  onLost,
}: {
  referral: Referral;
  patientName: string;
  lang: Lang;
  onReached: () => void;
  onLost: () => void;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-3 shadow-card ${
        r.status === "referred" ? "ring-1 ring-clay-300/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-950">{patientName}</p>
          <p className="flex items-center gap-1 text-[11px] text-ink/50">
            <MapPin size={10} className="shrink-0" />
            {r.toFacility}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            r.status === "referred"
              ? "bg-clay-100 text-clay-700"
              : "bg-forest-100 text-forest-700"
          }`}
        >
          {r.status === "referred" ? tx("refSt_referred", lang) : tx("refSt_reached", lang)}
        </span>
      </div>
      {r.status === "referred" && (
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={onReached}
            className="flex items-center gap-1 rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-white"
          >
            <Check size={10} /> {tx("markReached", lang)}
          </button>
          <button
            onClick={onLost}
            className="rounded-full bg-clay-100 px-2.5 py-1 text-[11px] font-medium text-clay-700"
          >
            {tx("markLost", lang)}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── ABHA patient card ── */
function AbhaCard({
  patient: p,
  lastVisit,
  hasOpenReferral,
  lang,
}: {
  patient: Patient;
  lastVisit?: Visit;
  hasOpenReferral: boolean;
  lang: Lang;
}) {
  return (
    <Link
      href={lastVisit ? `/doctor/patient/${lastVisit.id}` : "#"}
      className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card hover:ring-1 hover:ring-forest-700/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-950">{p.name}</p>
          <p className="text-xs text-ink/50">
            {p.age}
            {p.sex} · {p.village}
          </p>
        </div>
        <RiskBadge risk={p.risk} lang={lang} />
      </div>
      <p className="font-mono text-[10px] text-ink/35">ABHA {p.abhaId}</p>
      <div className="flex flex-wrap gap-1">
        {p.conditions.map((c) => (
          <span
            key={c}
            className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] text-ink/60"
          >
            {c}
          </span>
        ))}
      </div>
      {lastVisit && (
        <p className="text-[11px] text-ink/40">
          {tx("lastVisit", lang)}:{" "}
          {new Date(lastVisit.at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          {" · "}
          <span
            className={
              lastVisit.status === "submitted"
                ? "text-clay-600"
                : "text-forest-600"
            }
          >
            {lastVisit.status === "submitted" ? tx("vsSentToDoctor", lang)
              : lastVisit.status === "reviewed" ? tx("vsReviewed", lang)
              : lastVisit.status === "referred" ? tx("vsReferred", lang)
              : tx("vsDraft", lang)}
          </span>
        </p>
      )}
      {hasOpenReferral && (
        <span className="self-start rounded-full bg-clay-100 px-2 py-0.5 text-[10px] font-medium text-clay-700">
          {tx("refSt_referred", lang)}
        </span>
      )}
    </Link>
  );
}
