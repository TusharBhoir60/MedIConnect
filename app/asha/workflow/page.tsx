"use client";

import { useState } from "react";
import { PHCS } from "@/lib/seed";
import { ASHA, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, StockoutStatus } from "@/lib/types";
import { Check, PackageX } from "lucide-react";

export default function WorkflowPage() {
  const { visits, appointments, stockouts, reportStockout, lang } = useStore();
  const phc = PHCS[0];
  const submitted = visits.filter((v) => v.status === "submitted").length;
  const reviewed = visits.filter((v) => v.status === "reviewed" || v.status === "referred").length;

  const [medicine, setMedicine] = useState(phc.medicines[0]?.name ?? "");
  const [note, setNote] = useState("");
  const [justReported, setJustReported] = useState(false);

  const myReports = stockouts.filter((s) => s.phcId === phc.id);
  const openReports = myReports.filter((s) => s.status !== "restocked");

  const steps = [
    { id: 1, title: tx("wfStep1Title", lang), body: tx("wfStep1Body", lang) },
    { id: 2, title: tx("wfStep2Title", lang), body: tx("wfStep2Body", lang) },
    { id: 3, title: tx("wfStep3Title", lang), body: tx("wfStep3Body", lang) },
    { id: 4, title: tx("wfStep4Title", lang), body: tx("wfStep4Body", lang) },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-forest-950">{tx("workflowTitle", lang)}</h1>
        <p className="text-xs text-ink/50">{tx("workflowSub", lang)}</p>

        <div className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-800 text-xs text-white">{s.id}</div>
                {i < steps.length - 1 && <div className="my-1 w-px flex-1 bg-sand-300" />}
              </div>
              <div className="mb-2 rounded-2xl bg-white p-3 shadow-card">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-ink/55">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-4 text-sm shadow-card">
          <p className="text-xs uppercase tracking-widest text-ink/40">{tx("wfToday", lang)} {phc.name}</p>
          <p className="mt-1">
            {phc.open}–{phc.close} · {tx("wfQueueMin", lang)} ~{phc.queueMinutes}
          </p>
          <p className="mt-2 text-xs">
            {tx("wfAshaQueue", lang)} {submitted} {tx("wfWaiting", lang)} · {reviewed} {tx("wfReviewed", lang)} · {tx("wfAppointment", lang)} {appointments.filter((a) => a.status === "booked").length}
          </p>
          <p className="mt-2 text-xs text-clay-500">
            {tx("wfOutOfStock", lang)} {phc.medicines.filter((m) => m.qty === 0).map((m) => m.name).join(", ") || tx("wfNone", lang)}
          </p>
        </div>

        {/* Stockout reporting — ASHA → PHC + district visibility */}
        <section className="mt-5 rounded-2xl border border-clay-300 bg-white p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-sm font-medium text-forest-950">
            <PackageX size={15} className="text-clay-500" /> {tx("stockoutTitle", lang)}
          </p>
          <p className="mt-1 text-xs text-ink/50">{tx("stockoutSub", lang)}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs">
              {tx("selectMedicine", lang)}
              <select
                className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
              >
                {phc.medicines.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              {tx("reason", lang)}
              <input
                className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <button
            className="mt-3 w-full rounded-xl bg-clay-500 py-2.5 text-sm font-medium text-white"
            onClick={() => {
              if (!medicine) return;
              reportStockout({
                phcId: phc.id,
                medicine,
                reportedBy: ASHA.id,
                note: note || undefined,
              });
              setNote("");
              setJustReported(true);
            }}
          >
            {tx("reportStockoutBtn", lang)}
          </button>
          {justReported && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-forest-700">
              <Check size={13} /> {tx("stockoutDone", lang)}
            </p>
          )}

          {myReports.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-ink/40">
                {tx("stockoutReports", lang)} · {tx("districtView", lang)}
              </p>
              {myReports.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-forest-950">{s.medicine}</p>
                    {s.note && <p className="truncate text-ink/45">{s.note}</p>}
                  </div>
                  <StockoutChip status={s.status} lang={lang} />
                </div>
              ))}
              {openReports.length > 0 && (
                <p className="text-[11px] text-clay-600">
                  {tx("districtStockoutLine", lang).replace("{n}", String(openReports.length))}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StockoutChip({ status, lang }: { status: StockoutStatus; lang: Lang }) {
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
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}
