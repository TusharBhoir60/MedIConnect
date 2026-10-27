"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, Referral, ReferralStatus } from "@/lib/types";
import { Check, MapPin, Send } from "lucide-react";

export default function DoctorReferralsPage() {
  const { referrals, patients, setReferralStatus, lang } = useStore();

  const open = referrals.filter((r) => r.status === "referred" || r.status === "reached");
  const closed = referrals.filter((r) => r.status === "treated" || r.status === "lost");
  const completion = referrals.length > 0 ? Math.round((referrals.filter((r) => r.status === "treated").length / referrals.length) * 100) : 0;

  return (
    <div className="flex-1 bg-sand-50">
      <header className="bg-forest-900 px-4 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-widest text-clay-300">{tx("phcMo", lang)}</p>
          <h1 className="font-display text-2xl sm:text-3xl">{tx("refBoardTitle", lang)}</h1>
          <p className="mt-1 max-w-2xl text-xs text-sand-300">{tx("refBoardSub", lang)}</p>
          <p className="mt-2 text-sm">
            {tx("referralCompletion", lang)}: <span className="font-semibold">{completion}%</span> ·{" "}
            {tx("openReferrals", lang)} {open.length} · {tx("closedReferrals", lang)} {closed.length}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-clay-600">
              {tx("openReferrals", lang)} · {open.length}
            </h2>
            <div className="mt-3 space-y-3">
              {open.length === 0 && (
                <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-8 text-center text-sm text-ink/45">
                  {tx("noReferrals", lang)}
                </p>
              )}
              {open.map((r) => {
                const p = patients.find((x) => x.id === r.patientId);
                return (
                  <BoardCard
                    key={r.id}
                    referral={r}
                    patientName={p?.name ?? "—"}
                    lang={lang}
                    onReached={() => setReferralStatus(r.id, "reached")}
                    onLost={() => setReferralStatus(r.id, "lost")}
                    onTreated={(outcome) => setReferralStatus(r.id, "treated", outcome)}
                  />
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">
              {tx("closedReferrals", lang)} · {closed.length}
            </h2>
            <div className="mt-3 space-y-3">
              {closed.length === 0 && (
                <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-8 text-center text-sm text-ink/45">
                  {tx("noReferrals", lang)}
                </p>
              )}
              {closed.map((r) => {
                const p = patients.find((x) => x.id === r.patientId);
                return (
                  <BoardCard
                    key={r.id}
                    referral={r}
                    patientName={p?.name ?? "—"}
                    lang={lang}
                    onReached={() => setReferralStatus(r.id, "reached")}
                    onLost={() => setReferralStatus(r.id, "lost")}
                    onTreated={(outcome) => setReferralStatus(r.id, "treated", outcome)}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BoardCard({
  referral: r,
  patientName,
  lang,
  onReached,
  onLost,
  onTreated,
}: {
  referral: Referral;
  patientName: string;
  lang: Lang;
  onReached: () => void;
  onLost: () => void;
  onTreated: (outcome: string) => void;
}) {
  const [outcome, setOutcome] = useState("");
  const statusLabel = statusKey(r.status, lang);

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card ${r.status === "referred" ? "ring-1 ring-clay-400/50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-950">{patientName}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/55">
            <MapPin size={11} className="shrink-0" />
            {tx("referralTo", lang)} {r.toFacility}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              r.priority === "urgent" ? "bg-clay-500 text-white" : "bg-sand-200 text-ink/60"
            }`}
          >
            {r.priority === "urgent" ? tx("prioUrgent", lang) : tx("prioRoutine", lang)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-ink/40">{statusLabel}</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-ink/75">{r.reason}</p>
      <p className="mt-1 text-[11px] text-ink/40">
        {tx("raisedAt", lang)} {r.at.slice(0, 10)}
        {r.reachedAt ? ` · ${tx("refSt_reached", lang)} ${r.reachedAt.slice(0, 10)}` : ""}
      </p>

      {r.status === "referred" && (
        <p className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink/60">{tx("notReachedYet", lang)}</p>
      )}

      {r.outcome && (
        <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-800">
          {tx("referralOutcome", lang)}: {r.outcome}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <div className="flex w-full flex-wrap items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-sand-200 px-3 py-1.5 text-xs"
              placeholder={tx("referralOutcome", lang)}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            />
            <button
              onClick={() => onTreated(outcome || "Treatment completed at RH. Review at PHC.")}
              className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Check size={12} /> {tx("markTreated", lang)}
            </button>
          </div>
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

function statusKey(s: ReferralStatus, lang: Lang) {
  if (s === "referred") return tx("refSt_referred", lang);
  if (s === "reached") return tx("refSt_reached", lang);
  if (s === "treated") return tx("refSt_treated", lang);
  return tx("refSt_lost", lang);
}
