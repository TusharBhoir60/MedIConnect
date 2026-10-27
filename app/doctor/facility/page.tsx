"use client";

import { useState } from "react";
import { PHCS, DOCTORS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, StockoutStatus } from "@/lib/types";
import {
  Activity,
  Check,
  FlaskConical,
  PackageX,
  Phone,
  Send,
  ShieldAlert,
  Timer,
  TrendingUp,
} from "lucide-react";

export default function FacilityPage() {
  const {
    visits,
    appointments,
    referrals,
    followUps,
    emergencies,
    stockouts,
    labs,
    ivrCalls,
    patients,
    setStockoutStatus,
    setLabStatus,
    pushSms,
    lang,
  } = useStore();

  const phc = PHCS[0];
  const doc = DOCTORS[0];

  /* ── Outcome metrics ── */
  const triageTimes = visits
    .filter((v) => v.submittedAt && v.reviewedAt)
    .map(
      (v) =>
        (new Date(v.reviewedAt as string).getTime() -
          new Date(v.submittedAt as string).getTime()) /
        60000,
    )
    .sort((a, b) => a - b);
  const medianTriage = triageTimes.length
    ? Math.round(triageTimes[Math.floor(triageTimes.length / 2)])
    : 0;

  const refTotal = referrals.length;
  const refTreated = referrals.filter((r) => r.status === "treated").length;
  const refCompletion = refTotal ? Math.round((refTreated / refTotal) * 100) : 0;

  const fuTotal = followUps.length;
  const fuDone = followUps.filter((f) => f.done).length;
  const fuCompletion = fuTotal ? Math.round((fuDone / fuTotal) * 100) : 0;

  const emTotal = emergencies.length;
  const emClosed = emergencies.filter((e) => e.status === "closed").length;
  const emClosedPct = emTotal ? Math.round((emClosed / emTotal) * 100) : 0;

  const ivrTotal    = ivrCalls.filter((c) => c.type === "followup").length;
  const ivrDone     = ivrCalls.filter((c) => c.type === "followup" && c.status === "completed").length;
  const ivrPending  = ivrCalls.filter((c) => c.type === "followup" && (c.status === "scheduled" || c.status === "triggered")).length;
  const ivrPct      = ivrTotal ? Math.round((ivrDone / ivrTotal) * 100) : 0;

  const openStockouts = stockouts.filter(
    (s) => s.phcId === phc.id && s.status !== "restocked",
  );
  const allStockouts = stockouts.filter((s) => s.phcId === phc.id);
  const phcLabs = labs.filter(
    (l) => l.phcId === phc.id && l.status !== "delivered",
  );

  const todaySubmitted = visits.filter((v) => v.status === "submitted").length;
  const bookedToday = appointments.filter((a) => a.status === "booked").length;

  return (
    <div className="flex-1 bg-sand-50">
      {/* Header */}
      <header className="bg-forest-900 px-4 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-clay-300">
                {tx("facility", lang)}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl">{phc.name}</h1>
              <p className="text-xs text-sand-300">
                {phc.village} · {phc.district} · {doc.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-sand-200">
                {tx("fhirChip", lang)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                  phc.todayOpen
                    ? "bg-forest-700 text-white"
                    : "bg-clay-500 text-white"
                }`}
              >
                {phc.todayOpen ? tx("open", lang) : tx("closed", lang)} ·{" "}
                {phc.open}–{phc.close}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">

        {/* ── Live status row ── */}
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard
            label={tx("todayQueue", lang)}
            value={String(todaySubmitted)}
            sub={`${phc.queueMinutes} ${tx("waitMin", lang)} avg`}
            icon={<Timer size={14} />}
            accent="clay"
          />
          <StatCard
            label={tx("bookedSlots", lang)}
            value={String(bookedToday)}
            sub={tx("statAppointmentsToday", lang)}
            icon={<Activity size={14} />}
            accent="forest"
          />
          <StatCard
            label={tx("openEmer", lang)}
            value={String(emergencies.filter((e) => e.status !== "closed").length)}
            sub={`${emClosed} ${tx("statClosed", lang)}`}
            icon={<ShieldAlert size={14} />}
            accent={emergencies.some((e) => e.status === "open") ? "clay" : "forest"}
          />
          <StatCard
            label={tx("stockoutTitle", lang)}
            value={String(openStockouts.length)}
            sub={tx("statMedicineFlags", lang)}
            icon={<PackageX size={14} />}
            accent={openStockouts.length > 0 ? "clay" : "forest"}
          />
        </div>

        {/* ── Quality metrics ── */}
        <section>
          <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
            <TrendingUp size={12} /> {tx("outcomesTitle", lang)}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              title={tx("medianTriage", lang)}
              value={`${medianTriage} ${tx("waitMin", lang)}`}
              icon={<Timer size={14} />}
            />
            <Metric
              title={tx("referralCompletion", lang)}
              value={`${refCompletion}%`}
              sub={`${refTreated}/${refTotal}`}
              icon={<Send size={14} />}
              accent={refCompletion >= 70 ? "forest" : "clay"}
            />
            <Metric
              title={tx("followupCompletion", lang)}
              value={`${fuCompletion}%`}
              sub={`${fuDone}/${fuTotal}`}
              icon={<Check size={14} />}
              accent={fuCompletion >= 70 ? "forest" : "clay"}
            />
            <Metric
              title={tx("emergencyResponse", lang)}
              value={`${emClosedPct}%`}
              sub={`${emClosed}/${emTotal}`}
              icon={<ShieldAlert size={14} />}
              accent={emClosedPct >= 80 ? "forest" : "clay"}
            />
            <Metric
              title={tx("ivrJanVaaniTitle", lang)}
              value={`${ivrPct}%`}
              sub={`${ivrDone}/${ivrTotal} ${tx("ivrDoneLabel", lang)} · ${ivrPending} ${tx("ivrPendingLabel", lang)}`}
              icon={<Phone size={14} />}
              accent={ivrPct >= 70 ? "forest" : "clay"}
            />
          </div>
        </section>

        {/* ── JanVaani follow-up call queue ── */}
        {ivrCalls.filter((c) => c.type === "followup").length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <Phone size={12} /> {tx("ivrSectionTitle", lang)} · {ivrCalls.filter((c) => c.type === "followup").length}
            </h2>
            <div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-100">
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-ink/40">{tx("ivrTablePatient", lang)}</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-ink/40">{tx("ivrTableComplaint", lang)}</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-ink/40">{tx("ivrTableScheduled", lang)}</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-ink/40">{tx("ivrTableResponse", lang)}</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-ink/40">{tx("ivrTableStatus", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ivrCalls]
                    .filter((c) => c.type === "followup")
                    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
                    .map((c) => {
                      const responseMap: Record<string, { label: string; cls: string }> = {
                        "1": { label: tx("ivrResponseUnwell", lang),    cls: "bg-clay-100 text-clay-700" },
                        "2": { label: tx("ivrResponsePhcVisit", lang),  cls: "bg-sand-200 text-ink/60"   },
                        "3": { label: tx("ivrResponseFine", lang),      cls: "bg-forest-100 text-forest-700" },
                      };
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        scheduled : { label: tx("callStatusScheduled", lang),  cls: "bg-sand-100 text-ink/50" },
                        triggered : { label: tx("callStatusTriggered", lang),  cls: "bg-forest-100 text-forest-700" },
                        completed : { label: tx("callStatusCompleted", lang),  cls: "bg-forest-100 text-forest-700" },
                        failed    : { label: tx("callStatusFailed", lang),     cls: "bg-clay-100 text-clay-700" },
                        no_answer : { label: tx("callStatusNoAnswer", lang),   cls: "bg-clay-100 text-clay-700" },
                      };
                      const resp   = c.patientResponse ? responseMap[c.patientResponse] : null;
                      const status = statusMap[c.status] ?? { label: c.status, cls: "bg-sand-100 text-ink/50" };
                      return (
                        <tr key={c.id} className="border-b border-sand-50 last:border-0">
                          <td className="px-4 py-3 font-medium text-forest-950">{c.patientName}</td>
                          <td className="max-w-[160px] truncate px-4 py-3 text-xs text-ink/55">{c.complaint || "—"}</td>
                          <td className="px-4 py-3 text-xs text-ink/50">
                            {new Date(c.scheduledFor).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            {resp ? (
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${resp.cls}`}>{resp.label}</span>
                            ) : (
                              <span className="text-xs text-ink/30">{tx("ivrAwaitingCall", lang)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.cls}`}>{status.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── PHC labs ── */}
        <section>
          <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
            <FlaskConical size={12} /> {tx("labTasks", lang)} · {phcLabs.length}
          </h2>
          <div className="mt-2 space-y-2">
            {phcLabs.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-ink/45">
                {tx("noLabs", lang)}
              </p>
            )}
            {phcLabs.map((l) => {
              const p = patients.find((x) => x.id === l.patientId);
              return (
                <LabRow
                  key={l.id}
                  test={l.test}
                  patientName={p?.name ?? "—"}
                  patientPhone={p?.phone}
                  status={l.status}
                  lang={lang}
                  onResultReady={(result) => {
                    setLabStatus(l.id, "result_ready", result);
                    if (p) {
                      pushSms({
                        to: p.phone,
                        body: `JanArogya: ${p.name} yanche ${l.test} report tayar — ${result}. ASHA report gheun yetil.`,
                        kind: "lab",
                      });
                    }
                  }}
                  onDelivered={() => setLabStatus(l.id, "delivered")}
                />
              );
            })}
          </div>
        </section>

        {/* ── Stockout reports ── */}
        <section>
          <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
            <PackageX size={12} /> {tx("stockoutReports", lang)} · {openStockouts.length}
          </h2>
          {openStockouts.length > 0 && (
            <p className="mt-1 text-xs text-clay-600">
              {tx("districtStockoutLine", lang).replace(
                "{n}",
                String(openStockouts.length),
              )}
            </p>
          )}
          <div className="mt-2 space-y-2">
            {allStockouts.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-ink/45">
                {tx("wfNone", lang)}
              </p>
            )}
            {allStockouts.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-forest-950">
                    {s.medicine}
                  </p>
                  <p className="text-[11px] text-ink/45">
                    {s.at.slice(0, 10)}
                    {s.note ? ` · ${s.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StockoutChip status={s.status} lang={lang} />
                  {s.status === "reported" && (
                    <button
                      onClick={() => setStockoutStatus(s.id, "acknowledged")}
                      className="rounded-full bg-sand-200 px-3 py-1 text-xs font-medium text-ink/60"
                    >
                      {tx("ack", lang)}
                    </button>
                  )}
                  {s.status === "acknowledged" && (
                    <button
                      onClick={() => setStockoutStatus(s.id, "restocked")}
                      className="flex items-center gap-1 rounded-full bg-forest-800 px-3 py-1 text-xs font-medium text-white"
                    >
                      <Check size={11} /> {tx("restockBtn", lang)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Medicine stock + diagnostics ── */}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
              {tx("medicineStock", lang)}
            </h2>
            <div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-card">
              {phc.medicines.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between border-b border-sand-100 px-4 py-3 text-sm last:border-0"
                >
                  <span className="mr-4">{m.name}</span>
                  <div className="flex items-center gap-2">
                    {m.qty === 0 && (
                      <span className="rounded-full bg-clay-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        {tx("outOfStock", lang)}
                      </span>
                    )}
                    <span
                      className={`shrink-0 font-medium ${
                        m.qty === 0
                          ? "text-clay-500"
                          : m.qty < 20
                            ? "text-clay-400"
                            : "text-forest-700"
                      }`}
                    >
                      {m.qty} {m.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
              {tx("diagnostic", lang)}
            </h2>
            <div className="mt-2 space-y-2">
              {phc.diagnostics.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-card"
                >
                  <span>{d.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      d.available
                        ? "bg-forest-100 text-forest-700"
                        : "bg-sand-200 text-ink/50"
                    }`}
                  >
                    {d.available ? tx("available", lang) : tx("notAvailable", lang)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "forest",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "forest" | "clay";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div
        className={`flex items-center gap-1.5 text-[11px] ${
          accent === "clay" ? "text-clay-600" : "text-forest-700"
        }`}
      >
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-display text-3xl text-forest-950">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink/40">{sub}</p>}
    </div>
  );
}

function Metric({
  title,
  value,
  sub,
  icon,
  accent = "forest",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "forest" | "clay";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p
        className={`flex items-center gap-1.5 text-[11px] ${
          accent === "clay" ? "text-clay-500" : "text-forest-700"
        }`}
      >
        {icon} {title}
      </p>
      <p className="mt-1 font-display text-2xl text-forest-950">{value}</p>
      {sub && <p className="text-[10px] text-ink/40">{sub}</p>}
    </div>
  );
}

function LabRow({
  test,
  patientName,
  patientPhone,
  status,
  lang,
  onResultReady,
  onDelivered,
}: {
  test: string;
  patientName: string;
  patientPhone?: string;
  status: string;
  lang: Lang;
  onResultReady: (result: string) => void;
  onDelivered: () => void;
}) {
  const [result, setResult] = useState("");
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-forest-950">
          {patientName} — {test}
        </p>
        <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[11px] font-medium text-forest-800">
          {status === "ordered"
            ? tx("labSt_ordered", lang)
            : status === "sample_collected"
              ? tx("labSt_sample_collected", lang)
              : tx("labSt_result_ready", lang)}
        </span>
      </div>
      {status === "sample_collected" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-sand-200 px-3 py-1.5 text-xs"
            placeholder={tx("resultLabel", lang)}
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
          <button
            onClick={() => onResultReady(result || tx("reportNormal", lang))}
            className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Check size={12} /> {tx("markResultReady", lang)}
          </button>
        </div>
      ) : status === "result_ready" ? (
        <div className="mt-3">
          <button
            onClick={onDelivered}
            className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Check size={12} /> {tx("markResultDelivered", lang)}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink/50">
          {patientPhone ? `${patientPhone} · ` : ""}
          {tx("labSt_ordered", lang)} → {tx("ashaWorker", lang)} {tx("markSampleCollected", lang)}
        </p>
      )}
    </div>
  );
}

function StockoutChip({
  status,
  lang,
}: {
  status: StockoutStatus;
  lang: Lang;
}) {
  const label =
    status === "reported"
      ? tx("stockoutReported", lang)
      : status === "acknowledged"
        ? tx("stockoutAcked", lang)
        : tx("stockoutRestocked", lang);
  const cls =
    status === "reported"
      ? "bg-clay-500 text-white"
      : status === "acknowledged"
        ? "bg-sand-200 text-ink/60"
        : "bg-forest-100 text-forest-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
