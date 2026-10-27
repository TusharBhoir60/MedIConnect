"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Emergency, Lang } from "@/lib/types";
import { ChevronRight, Phone, ShieldCheck, Timer } from "lucide-react";

/** minutes since the emergency was raised (never negative, demo-safe) */
function minutesSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function EmergencyPage() {
  const { emergencies, patients, raiseEmergency, closeEmergency, escalateEmergency, lang } = useStore();
  const [pid, setPid] = useState(patients[0]?.id ?? "");
  const [reason, setReason] = useState("");

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-forest-950">{tx("emergencyTitle", lang)}</h1>
        <p className="text-xs text-ink/50">{tx("emergencySub", lang)}</p>

        {/* Raise new emergency — direct to PHC doctor, no middle layer */}
        <div className="mt-4 rounded-2xl bg-clay-500 p-4 text-white">
          <p className="text-xs uppercase tracking-widest">{tx("newEscalation", lang)}</p>
          <select
            className="mt-2 w-full rounded-xl px-3 py-2 text-sm text-ink"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="mt-2 w-full rounded-xl px-3 py-2 text-sm text-ink"
            placeholder={tx("reason", lang)}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="mt-3 w-full rounded-xl bg-forest-950 py-2 text-sm"
            onClick={() => {
              if (!reason) return;
              raiseEmergency({
                patientId: pid,
                raisedBy: "asha",
                reason,
                destination: "108 / RH Gadchiroli",
              });
              setReason("");
            }}
          >
            {tx("notifyDoctor108", lang)}
          </button>
          <a
            href="tel:108"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white/15 py-2 text-sm font-medium"
          >
            <Phone size={14} /> {tx("callNow", lang)}
          </a>
          <p className="mt-2 text-center text-[11px] text-white/75">{tx("callWorksNoNet", lang)}</p>
        </div>

        {/* Escalation ladder */}
        <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-ink/45">
            <ShieldCheck size={13} /> {tx("escLadder", lang)}
          </p>
          <ol className="mt-2 space-y-1.5 text-xs text-ink/65">
            <li>1 · {tx("esc1", lang)}</li>
            <li>2 · {tx("esc2", lang)}</li>
            <li>3 · {tx("esc3", lang)}</li>
          </ol>
        </div>

        {/* Live emergencies with SLA state */}
        <div className="mt-4 space-y-3">
          {emergencies.map((e) => {
            const p = patients.find((x) => x.id === e.patientId);
            return (
              <EmergencyCard
                key={e.id}
                em={e}
                patientName={p?.name ?? "—"}
                lang={lang}
                onEscalate={() => escalateEmergency(e.id)}
                onClose={() => closeEmergency(e.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmergencyCard({
  em,
  patientName,
  lang,
  onEscalate,
  onClose,
}: {
  em: Emergency;
  patientName: string;
  lang: Lang;
  onEscalate: () => void;
  onClose: () => void;
}) {
  const mins = minutesSince(em.at);
  const open = em.status !== "closed";
  const breached = open && !em.acknowledgedAt && mins >= 10;

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-card ${em.status === "closed" ? "opacity-55 border-sand-200" : breached ? "border-clay-500" : "border-clay-300"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-forest-950">{patientName}</p>
          <p className="mt-0.5 text-sm text-ink/75">{em.reason}</p>
          <p className="mt-1 text-[11px] text-ink/45">
            {tx("raisedAt", lang)} {new Date(em.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {em.destination}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase ${
            em.status === "escalated" ? "bg-clay-500 text-white" : em.status === "closed" ? "bg-sand-200 text-ink/50" : "bg-clay-100 text-clay-700"
          }`}
        >
          {em.status === "escalated" ? tx("emEscalated", lang) : em.status}
        </span>
      </div>

      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {!em.acknowledgedAt ? (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${breached ? "bg-clay-500 text-white" : "bg-sand-100 text-ink/60"}`}
            >
              <Timer size={12} />
              {breached
                ? tx("slaBreach", lang)
                : tx("slaWaiting", lang).replace("{min}", String(mins)) +
                  " · " +
                  tx("slaAckIn", lang).replace("{min}", String(Math.max(0, 10 - mins)))}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-forest-100 px-2.5 py-1 font-medium text-forest-800">
              <ShieldCheck size={12} /> {tx("acknowledged", lang)}{" "}
              {new Date(em.acknowledgedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {em.escalatedAt && (
        <p className="mt-2 rounded-xl bg-clay-100 px-3 py-2 text-xs font-medium text-clay-700">
          {tx("escalatedTo", lang)}
        </p>
      )}

      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!em.escalatedAt && (
            <button
              onClick={onEscalate}
              className="flex items-center gap-1 rounded-full bg-forest-950 px-3 py-1.5 text-xs font-medium text-white"
            >
              {tx("escalateNow", lang)} <ChevronRight size={12} />
            </button>
          )}
          <button onClick={onClose} className="rounded-full bg-sand-200 px-3 py-1.5 text-xs font-medium text-ink/60">
            {tx("closeEmergency", lang)}
          </button>
        </div>
      )}
    </div>
  );
}
