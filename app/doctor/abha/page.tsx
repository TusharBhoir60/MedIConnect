"use client";

import { useState } from "react";
import { pullAbhaRecord, type AbdmPatientRecord, type AbdmVisitRecord } from "@/lib/abdm";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import { RiskBadge } from "@/components/RiskBadge";
import type { Lang, Risk } from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  FlaskConical,
  Heart,
  Loader2,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  User,
} from "lucide-react";

// ─── Facility type colour ────────────────────────────────────────
function facilityBadgeClass(type: AbdmVisitRecord["facilityType"]) {
  switch (type) {
    case "Sub-centre":       return "bg-sand-100 text-sand-700 ring-sand-200";
    case "PHC":              return "bg-forest-50 text-forest-700 ring-forest-200";
    case "Rural Hospital":   return "bg-blue-50 text-blue-700 ring-blue-200";
    case "District Hospital":return "bg-purple-50 text-purple-700 ring-purple-200";
    default:                 return "bg-sand-100 text-sand-700 ring-sand-200";
  }
}

function facilityIcon(type: AbdmVisitRecord["facilityType"]) {
  switch (type) {
    case "Sub-centre":       return <Heart size={13} />;
    case "PHC":              return <Stethoscope size={13} />;
    case "Rural Hospital":   return <Building2 size={13} />;
    case "District Hospital":return <Activity size={13} />;
    default:                 return <Building2 size={13} />;
  }
}

// ─── Visit card ──────────────────────────────────────────────────
function VisitCard({ visit, index, lang }: { visit: AbdmVisitRecord; index: number; lang: Lang }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${open ? "border-forest-900/15" : "border-sand-200"}`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-900/8 text-forest-700">
          {facilityIcon(visit.facilityType)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{visit.date}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${facilityBadgeClass(visit.facilityType)}`}>
              {visit.facilityType}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-ink/55">{visit.facility} · {visit.doctor}</p>
          {!open && (
            <p className="mt-1 truncate text-xs text-ink/70 italic">"{visit.complaint}"</p>
          )}
        </div>
        <div className="shrink-0 text-ink/30">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-sand-100 px-4 py-3 space-y-3">
          {/* Complaint + diagnosis */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("visitCardComplaint", lang)}</p>
              <p className="mt-0.5 text-sm text-ink/80">{visit.complaint}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("visitCardDiagnosis", lang)}</p>
              <p className="mt-0.5 text-sm text-ink/80">{visit.diagnosis}</p>
            </div>
          </div>

          {/* Prescription */}
          {visit.prescription.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("visitCardPrescription", lang)}</p>
              <ul className="mt-1 space-y-0.5">
                {visit.prescription.map((rx, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-ink/75">
                    <Pill size={11} className="mt-0.5 shrink-0 text-forest-600" />
                    {rx}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lab */}
          {(visit.labOrdered || visit.labResult) && (
            <div className="rounded-xl bg-blue-50/70 px-3 py-2">
              {visit.labOrdered && (
                <p className="text-xs">
                  <span className="font-medium text-blue-700">{tx("visitCardLabOrdered", lang)} </span>
                  <span className="text-ink/70">{visit.labOrdered}</span>
                </p>
              )}
              {visit.labResult && (
                <p className="mt-0.5 text-xs">
                  <span className="font-medium text-blue-700">{tx("visitCardLabResult", lang)} </span>
                  <span className="text-ink/70">{visit.labResult}</span>
                </p>
              )}
            </div>
          )}

          {/* Follow-up */}
          {visit.followUpDate && (
            <p className="text-xs text-ink/55">
              <Calendar size={11} className="mr-1 inline" />
              {tx("visitCardFollowUpDue", lang)} <span className="font-medium">{visit.followUpDate}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function AbhaLookupPage() {
  const { lang } = useStore();

  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [record,  setRecord]  = useState<AbdmPatientRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Quick-fill demo ABHA numbers
  const DEMO_IDS = [
    { label: "Kavita (ANC)",        id: "14-2201-8834-5501" },
    { label: "Dilip (Chronic)",     id: "14-2201-8834-5502" },
    { label: "Riya (Child)",        id: "14-2201-8834-5503" },
    { label: "Sanjay (Emergency)",  id: "14-2201-8834-5504" },
    { label: "Anusaya (ANC)",       id: "14-2201-8834-5505" },
    { label: "Mohan (TB)",          id: "14-2201-8834-5506" },
    { label: "Tara (SAM)",          id: "14-2201-8834-5507" },
    { label: "Geeta (Anaemia)",     id: "14-2201-8834-5508" },
  ];

  async function handleLookup(abhaId?: string) {
    const query = (abhaId ?? input).trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setRecord(null);
    setNotFound(false);
    try {
      const result = await pullAbhaRecord(query);
      if (result) {
        setRecord(result);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLookup();
  }

  const riskColorMap: Record<string, string> = {
    maternal:  "bg-pink-50 border-pink-200",
    child:     "bg-yellow-50 border-yellow-200",
    chronic:   "bg-orange-50 border-orange-200",
    emergency: "bg-red-50 border-red-400",
    routine:   "bg-forest-50 border-forest-200",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50">

      {/* ── Page header ── */}
      <div className="bg-forest-950 px-4 py-5 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Database size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">ABDM · ABHA</p>
              <h1 className="font-display text-xl leading-tight">{tx("abhaLookupTitle", lang)}</h1>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/50">
            {tx("abhaLookupSub", lang)}
          </p>

          {/* ── Search bar ── */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tx("abhaInputPlaceholder", lang)}
                className="w-full rounded-xl bg-white/10 py-3 pl-9 pr-4 text-sm text-white placeholder:text-white/35 outline-none ring-1 ring-white/15 focus:ring-white/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleLookup()}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-forest-900 disabled:opacity-50 transition hover:bg-sand-50"
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : <Search size={15} />}
              {loading ? tx("abhaPulling", lang) : tx("abhaPullBtn", lang)}
            </button>
          </div>

          {/* ── Demo quick-fill chips ── */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] text-white/35 self-center">{tx("abhaDemo", lang)}</span>
            {DEMO_IDS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => { setInput(d.id); handleLookup(d.id); }}
                className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70 hover:bg-white/20 transition"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-5 py-4">
              <Loader2 size={20} className="animate-spin text-forest-600" />
              <div>
                <p className="text-sm font-medium text-ink">{tx("abhaConnecting", lang)}</p>
                <p className="text-xs text-ink/45">{tx("abhaFetchingFor", lang)} {input}</p>
              </div>
            </div>
            {/* Skeleton rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-sand-200/70" />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">{tx("abhaInvalidId", lang)}</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ── Not found ── */}
        {!loading && notFound && (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-700">{tx("abhaNotFound", lang)}</p>
              <p className="text-xs text-orange-600">{tx("abhaNotFoundBody", lang)}</p>
            </div>
          </div>
        )}

        {/* ── Record found ── */}
        {!loading && record && (
          <div className="space-y-5">

            {/* ABDM pull banner */}
            <div className="flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2 text-xs text-forest-700 ring-1 ring-forest-200">
              <BadgeCheck size={14} className="shrink-0" />
              <span>
                {tx("abhaRecordPulledBanner", lang)}{" "}
                <span className="font-medium">{tx("abhaLastSynced", lang)}</span>{" "}
                {new Date(record.lastSyncedAt).toLocaleString("en-IN", {
                  dateStyle: "medium", timeStyle: "short",
                })}
              </span>
            </div>

            {/* ── Patient identity card ── */}
            <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm ${riskColorMap[record.risk] ?? "border-sand-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-900/8 text-forest-700">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl leading-tight text-ink">{record.name}</h2>
                    <p className="text-sm text-ink/60">
                      {record.age} {tx("abhaYrs", lang)} ·{" "}
                      {record.sex === "F" ? tx("abhaFemale", lang) : record.sex === "M" ? tx("abhaMale", lang) : tx("abhaOther", lang)} ·{" "}
                      {tx("abhaDob", lang)} {record.dob} · {tx("abhaBloodGroup", lang)}{" "}
                      <span className="font-semibold">{record.bloodGroup}</span>
                    </p>
                  </div>
                </div>
                <RiskBadge risk={record.risk as Risk} lang={lang} />
              </div>

              {/* ABHA + location row */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-forest-900/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("abhaIdLabel", lang)}</p>
                  <p className="font-mono text-sm font-semibold text-forest-800">{record.abhaId}</p>
                </div>
                <div className="rounded-xl bg-forest-900/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("abhaLocationLabel", lang)}</p>
                  <p className="text-sm text-ink/80">{record.village}, {record.district}</p>
                </div>
                <div className="rounded-xl bg-forest-900/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("abhaAshaLabel", lang)}</p>
                  <p className="text-sm text-ink/80">{record.ashaName} · {record.ashaPhone}</p>
                </div>
                <div className="rounded-xl bg-forest-900/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{tx("abhaFhirLabel", lang)}</p>
                  <p className="font-mono text-xs text-ink/50">{record.fhirId}</p>
                </div>
              </div>
            </div>

            {/* ── Active conditions ── */}
            {record.activeConditions.length > 0 && (
              <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className="text-orange-500" />
                  <h3 className="text-sm font-semibold text-ink">{tx("abhaActiveConditions", lang)}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {record.activeConditions.map((c, i) => (
                    <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Current medications ── */}
            {record.currentMedications.length > 0 && (
              <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Pill size={16} className="text-forest-600" />
                  <h3 className="text-sm font-semibold text-ink">{tx("abhaCurrentMeds", lang)}</h3>
                </div>
                <div className="space-y-2">
                  {record.currentMedications.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-forest-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{m.name}</p>
                        <p className="text-xs text-ink/55">{m.dose}</p>
                      </div>
                      <span className="text-[10px] text-ink/40">since {m.since}</span>
                    </div>
                  ))}
                </div>

                {/* Allergies */}
                {record.allergies.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">{tx("abhaAllergies", lang)} </span>
                      {record.allergies.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Pending care ── */}
            {record.pendingCare.length > 0 && (
              <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={16} className="text-forest-600" />
                  <h3 className="text-sm font-semibold text-ink">{tx("abhaPendingCare", lang)}</h3>
                </div>
                <div className="space-y-2">
                  {record.pendingCare.map((c, i) => {
                    const isOverdue = new Date(c.dueDate) < new Date();
                    return (
                      <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 ${isOverdue ? "bg-red-50 ring-1 ring-red-200" : "bg-sand-50"}`}>
                        <div className="flex items-center gap-2">
                          <FlaskConical size={12} className={isOverdue ? "text-red-500" : "text-forest-600"} />
                          <p className="text-sm text-ink/80">{c.label}</p>
                        </div>
                        <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-ink/45"}`}>
                          {isOverdue ? "⚠ " : ""}{c.dueDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Longitudinal visit history ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database size={16} className="text-forest-600" />
                <h3 className="text-sm font-semibold text-ink">
                  {tx("abhaVisitHistory", lang)}
                  <span className="ml-2 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-medium text-forest-700">
                    {record.visitHistory.length} {tx("abhaVisitHistoryChip", lang)}
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {record.visitHistory.map((v, i) => (
                  <VisitCard key={i} visit={v} index={i} lang={lang} />
                ))}
              </div>
            </div>

            {/* ── ABDM sync footer ── */}
            <div className="rounded-xl border border-sand-100 bg-sand-50 px-4 py-3 text-xs text-ink/45">
              <p className="font-medium text-ink/55">{tx("abhaFooterTitle", lang)}</p>
              <p className="mt-0.5">{tx("abhaFooterBody", lang)}</p>
            </div>

          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !record && !error && !notFound && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-900/6 text-forest-600">
              <Database size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-ink/70">{tx("abhaEmptyState", lang)}</p>
              <p className="mt-1 max-w-sm text-sm text-ink/40">{tx("abhaEmptyStateBody", lang)}</p>
            </div>
            <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2">
              {DEMO_IDS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setInput(d.id); handleLookup(d.id); }}
                  className="rounded-xl border border-sand-200 bg-white px-3 py-3 text-left hover:border-forest-300 hover:bg-forest-50/50 transition"
                >
                  <p className="text-xs font-medium text-ink">{d.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink/40">{d.id}</p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
