"use client";

import { ASHA, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, ReferralStatus } from "@/lib/types";
import { Check, MapPin, Send } from "lucide-react";

export default function AshaReferralsPage() {
  const { referrals, patients, setReferralStatus, lang } = useStore();

  const mine = new Set(patients.filter((p) => p.ashaId === ASHA.id).map((p) => p.id));
  const list = referrals
    .filter((r) => mine.has(r.patientId))
    .sort((a, b) => (a.status === "referred" || a.status === "reached" ? -1 : 1) - (b.status === "referred" || b.status === "reached" ? -1 : 1) || b.at.localeCompare(a.at));

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-forest-950">{tx("referralsTitle", lang)}</h1>
        <p className="text-xs text-ink/50">{tx("referralsSub", lang)}</p>

        {list.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-10 text-center text-sm text-ink/45">
            {tx("noReferrals", lang)}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {list.map((r) => {
            const p = patients.find((x) => x.id === r.patientId);
            return (
              <ReferralCard
                key={r.id}
                patientName={p?.name ?? "—"}
                referral={r}
                lang={lang}
                onReached={() => setReferralStatus(r.id, "reached")}
                onTreated={() => setReferralStatus(r.id, "treated", "Treatment completed at RH. Review at PHC.")}
                onLost={() => setReferralStatus(r.id, "lost")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReferralCard({
  patientName,
  referral: r,
  lang,
  onReached,
  onTreated,
  onLost,
}: {
  patientName: string;
  referral: {
    id: string;
    toFacility: string;
    reason: string;
    priority: "urgent" | "routine";
    status: ReferralStatus;
    at: string;
    reachedAt?: string;
    outcome?: string;
  };
  lang: Lang;
  onReached: () => void;
  onTreated: () => void;
  onLost: () => void;
}) {
  const open = r.status === "referred" || r.status === "reached";
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card ${open ? "ring-1 ring-clay-400/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-950">{patientName}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/55">
            <MapPin size={11} className="shrink-0" />
            {tx("referralTo", lang)} {r.toFacility}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            r.priority === "urgent" ? "bg-clay-500 text-white" : "bg-sand-200 text-ink/60"
          }`}
        >
          {r.priority === "urgent" ? tx("prioUrgent", lang) : tx("prioRoutine", lang)}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink/75">{r.reason}</p>
      <p className="mt-1 text-[11px] text-ink/40">
        {tx("raisedAt", lang)} {r.at.slice(0, 10)}
        {r.reachedAt ? ` → ${tx("refSt_reached", lang)} ${r.reachedAt.slice(0, 10)}` : ""}
      </p>

      <Journey status={r.status} lang={lang} />

      {r.status === "referred" && (
        <p className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink/60">{tx("notReachedYet", lang)}</p>
      )}

      {r.outcome && (
        <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-800">
          {tx("referralOutcome", lang)}: {r.outcome}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {r.status === "referred" && (
          <>
            <button
              onClick={onReached}
              className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Check size={12} /> {tx("markReached", lang)}
            </button>
            <button
              onClick={onLost}
              className="rounded-full bg-clay-100 px-3 py-1.5 text-xs font-medium text-clay-700"
            >
              {tx("markLost", lang)}
            </button>
          </>
        )}
        {r.status === "reached" && (
          <button
            onClick={onTreated}
            className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Check size={12} /> {tx("markTreated", lang)}
          </button>
        )}
        {r.status === "lost" && (
          <p className="flex items-center gap-1.5 rounded-full bg-clay-100 px-3 py-1.5 text-xs font-medium text-clay-700">
            <Send size={12} /> {tx("traceTask", lang)}
          </p>
        )}
      </div>
    </div>
  );
}

/** referred → reached → treated (or lost) progress strip */
function Journey({ status, lang }: { status: ReferralStatus; lang: Lang }) {
  const steps: { key: ReferralStatus | "treated"; label: string }[] = [
    { key: "referred", label: tx("refSt_referred", lang) },
    { key: "reached", label: tx("refSt_reached", lang) },
    { key: status === "lost" ? "lost" : "treated", label: status === "lost" ? tx("refSt_lost", lang) : tx("refSt_treated", lang) },
  ];
  const reachedIdx = status === "referred" ? 0 : status === "reached" ? 1 : 2;
  return (
    <div className="mt-3 flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-1">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
              i <= reachedIdx
                ? status === "lost" && i === 2
                  ? "bg-clay-500 text-white"
                  : "bg-forest-700 text-white"
                : "bg-sand-200 text-ink/40"
            }`}
          >
            {i + 1}
          </div>
          <span className={`truncate text-[10px] ${i <= reachedIdx ? "text-forest-800" : "text-ink/35"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className={`h-px flex-1 ${i < reachedIdx ? "bg-forest-700" : "bg-sand-200"}`} />}
        </div>
      ))}
    </div>
  );
}
