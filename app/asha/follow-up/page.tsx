"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ASHA, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { CareKind, Lang, Patient } from "@/lib/types";
import {
  Baby,
  Check,
  HeartPulse,
  Stethoscope,
  UserCheck,
} from "lucide-react";

const TODAY = new Date().toISOString().slice(0, 10);
const SEED_TODAY = "2026-08-31";

function effectiveToday() {
  return TODAY === "1970-01-01" ? SEED_TODAY : TODAY;
}

function dueBucket(dueDate: string): "overdue" | "today" | "upcoming" {
  const d = dueDate.slice(0, 10);
  const t = effectiveToday();
  if (d < t) return "overdue";
  if (d === t) return "today";
  return "upcoming";
}

function bucketStyle(b: "overdue" | "today" | "upcoming", lang: Lang) {
  if (b === "overdue") return { bar: "bg-clay-500", badge: "bg-clay-500 text-white", label: tx("bucketOverdue", lang) };
  if (b === "today") return { bar: "bg-clay-300", badge: "bg-clay-100 text-clay-700", label: tx("bucketToday", lang) };
  return { bar: "bg-forest-600", badge: "bg-forest-100 text-forest-700", label: tx("bucketUpcoming", lang) };
}

export default function FollowUpPage() {
  const {
    patients,
    followUps,
    markFollowUpDone,
    markCareDone,
    addFollowUp,
    lang,
  } = useStore();

  const mine = useMemo(
    () => patients.filter((p) => p.ashaId === ASHA.id),
    [patients],
  );

  /* ── Doctor / PHC follow-up messages ── */
  const dueMessages = followUps
    .filter((f) => mine.some((p) => p.id === f.patientId) && !f.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  /* ── Care plan items per patient (maternal / child / chronic) ── */
  const careDue = mine
    .flatMap((p) =>
      (p.carePlan ?? [])
        .filter((c) => !c.done)
        .map((c) => ({ patient: p, care: c })),
    )
    .sort((a, b) => a.care.dueDate.localeCompare(b.care.dueDate));

  /* ── Group by risk type for the overview strips ── */
  const maternal = mine.filter((p) => p.risk === "maternal");
  const child = mine.filter((p) => p.risk === "child");
  const chronic = mine.filter((p) => p.risk === "chronic");

  const totalOpen = dueMessages.length + careDue.length;

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50">
      {/* Header */}
      <header className="bg-forest-900 px-4 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-widest text-clay-300">
            {tx("ashaWorker", lang)}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl">{tx("followUpTitle", lang)}</h1>
          <p className="mt-1 text-xs text-sand-300">
            {totalOpen} {tx("followUpSub", lang)} ·{" "}
            {maternal.length} ANC · {child.length} {tx("riskChild", lang)} ·{" "}
            {chronic.length} NCD
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">

        {/* ── Risk group overview strips ── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <RiskStrip
            icon={<HeartPulse size={16} />}
            label={tx("riskMaternalLabel", lang)}
            patients={maternal}
            color="clay"
            lang={lang}
          />
          <RiskStrip
            icon={<Baby size={16} />}
            label={tx("riskChild", lang)}
            patients={child}
            color="forest"
            lang={lang}
          />
          <RiskStrip
            icon={<Stethoscope size={16} />}
            label={tx("riskNcdLabel", lang)}
            patients={chronic}
            color="ink"
            lang={lang}
          />
        </div>

        {/* ── Doctor / PHC messages ── */}
        {dueMessages.length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <Stethoscope size={12} /> {tx("followUpTitle", lang)} · {dueMessages.length}
            </h2>
            <div className="mt-2 space-y-2">
              {dueMessages.map((f) => {
                const p = mine.find((x) => x.id === f.patientId);
                const bucket = dueBucket(f.dueDate);
                const style = bucketStyle(bucket, lang);
                return (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-card"
                  >
                    <div className={`h-1 w-full ${style.bar}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-forest-950">
                            {p?.name ?? "—"}
                          </p>
                          <p className="text-xs text-ink/50">
                            {p?.village} · {p?.age}
                            {p?.sex}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.badge}`}
                          >
                            {style.label}
                          </span>
                          <span className="text-[10px] text-ink/40">
                            {f.from === "doctor"
                              ? tx("fromDoctor", lang)
                              : tx("fromPhc", lang)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink/75">
                        {f.message}
                      </p>
                      <p className="mt-1 text-[11px] text-ink/40">
                        {tx("careDueLabel", lang)} {f.dueDate}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => markFollowUpDone(f.id)}
                          className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          <Check size={12} /> {tx("markDone", lang)}
                        </button>
                        {p && (
                          <Link
                            href={`/asha/patients/${p.id}`}
                            className="flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink/60"
                          >
                            <UserCheck size={12} /> {tx("visits", lang)}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Care plan due (ANC / immunisation / NCD) ── */}
        {careDue.length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink/40">
              <HeartPulse size={12} /> {tx("carePlan", lang)} · {careDue.length}
            </h2>
            <div className="mt-2 space-y-2">
              {careDue.map(({ patient: p, care }) => {
                const bucket = dueBucket(care.dueDate);
                const style = bucketStyle(bucket, lang);
                return (
                  <div
                    key={care.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-card"
                  >
                    <div className={`h-1 w-full ${style.bar}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-forest-950">
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-xs text-ink/50">
                            {p.village} · {p.age}
                            {p.sex}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.badge}`}
                          >
                            {style.label}
                          </span>
                          <CareChip kind={care.kind} lang={lang} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-medium text-forest-900">
                        {care.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink/40">
                        {tx("careDueLabel", lang)} {care.dueDate}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => markCareDone(p.id, care.id)}
                          className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          <Check size={12} /> {tx("markDone", lang)}
                        </button>
                        <Link
                          href={`/asha/visit?mode=existing&patientId=${p.id}`}
                          className="flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink/60"
                        >
                          {tx("addVisit", lang)}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {totalOpen === 0 && (
          <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-12 text-center text-sm text-ink/45">
            {tx("noTasks", lang)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Risk group strip ── */
function RiskStrip({
  icon,
  label,
  patients,
  color,
  lang,
}: {
  icon: React.ReactNode;
  label: string;
  patients: Patient[];
  color: "clay" | "forest" | "ink";
  lang: Lang;
}) {
  const bg =
    color === "clay"
      ? "bg-clay-500"
      : color === "forest"
        ? "bg-forest-800"
        : "bg-ink";

  return (
    <div className={`rounded-2xl p-4 text-white ${bg}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon} {label}
      </div>
      <p className="mt-2 font-display text-3xl">{patients.length}</p>
      <div className="mt-2 space-y-0.5">
        {patients.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href={`/asha/patients/${p.id}`}
            className="block truncate text-[11px] text-white/75 hover:text-white"
          >
            {p.name} · {p.age}{p.sex}
          </Link>
        ))}
        {patients.length > 3 && (
          <p className="text-[11px] text-white/55">+{patients.length - 3} {tx("stripMore", lang)}</p>
        )}
        {patients.length === 0 && (
          <p className="text-[11px] text-white/55">{tx("stripNoneRegistered", lang)}</p>
        )}
      </div>
    </div>
  );
}

/* ── Care kind chip ── */
function CareChip({ kind, lang }: { kind: CareKind; lang: Lang }) {
  const label =
    kind === "anc"
      ? tx("careAnc", lang)
      : kind === "immunisation"
        ? tx("careImm", lang)
        : tx("careNcd", lang);
  const cls =
    kind === "anc"
      ? "bg-clay-100 text-clay-700"
      : kind === "immunisation"
        ? "bg-forest-100 text-forest-700"
        : "bg-sand-200 text-ink/60";
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {kind === "immunisation" && <Baby size={11} />}
      {label}
    </span>
  );
}
