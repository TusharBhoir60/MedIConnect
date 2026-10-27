"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Earning, Lang } from "@/lib/types";
import { BadgeIndianRupee, CheckCircle2, Clock, TrendingUp, Wallet } from "lucide-react";

type Filter = "all" | "paid" | "approved" | "pending";

const STATUS_CONFIG = (lang: Lang): Record<Earning["status"], { label: string; pill: string; icon: React.ReactNode }> => ({
  paid:     { label: tx("earningsStatusPaid", lang),     pill: "bg-forest-100 text-forest-700", icon: <CheckCircle2 size={11} /> },
  approved: { label: tx("earningsStatusApproved", lang), pill: "bg-blue-100 text-blue-700",     icon: <Clock size={11} /> },
  pending:  { label: tx("earningsStatusPending", lang),  pill: "bg-clay-100 text-clay-700",     icon: <Clock size={11} /> },
});

function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function EarningsPage() {
  const { earnings, lang } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  /* ── summary totals ── */
  const paid     = earnings.filter((e) => e.status === "paid").reduce((a, e) => a + e.amount, 0);
  const approved = earnings.filter((e) => e.status === "approved").reduce((a, e) => a + e.amount, 0);
  const pending  = earnings.filter((e) => e.status === "pending").reduce((a, e) => a + e.amount, 0);
  const total    = paid + approved + pending;

  /* ── filtered + grouped by month ── */
  const filtered = useMemo(
    () =>
      filter === "all"
        ? [...earnings]
        : earnings.filter((e) => e.status === filter),
    [earnings, filter],
  );

  const byMonth = useMemo(() => {
    const groups: Record<string, Earning[]> = {};
    [...filtered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((e) => {
        const key = e.date.slice(0, 7); // "YYYY-MM"
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
      });
    return Object.entries(groups); // [["YYYY-MM", Earning[]], …] newest first
  }, [filtered]);

  const FILTERS: { key: Filter; label: string; color: string }[] = [
    { key: "all",      label: tx("earningsFilterAll", lang),      color: "bg-forest-900 text-sand-50" },
    { key: "paid",     label: tx("earningsStatusPaid", lang),     color: "bg-forest-100 text-forest-700" },
    { key: "approved", label: tx("earningsStatusApproved", lang), color: "bg-blue-100 text-blue-700" },
    { key: "pending",  label: tx("earningsStatusPending", lang),  color: "bg-clay-100 text-clay-700" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50">

      {/* ── Header ── */}
      <div className="bg-forest-900 px-4 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6">
        <p className="text-[11px] uppercase tracking-widest text-clay-300">{tx("ashaWorker", lang)}</p>
        <h1 className="font-display text-2xl">{tx("earningsTitle", lang)}</h1>
        <p className="mt-0.5 text-xs text-sand-300">{tx("earningsSub", lang)}</p>

        {/* ── Summary cards ── */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-sand-300">
              <Wallet size={12} /> {tx("earningsTotal", lang)}
            </div>
            <p className="font-display text-xl mt-0.5">₹{total.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-sand-300">
              <CheckCircle2 size={12} /> {tx("paid", lang)}
            </div>
            <p className="font-display text-xl mt-0.5 text-green-300">₹{paid.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-sand-300">
              <BadgeIndianRupee size={12} /> {tx("earningsApproved", lang)}
            </div>
            <p className="font-display text-xl mt-0.5 text-blue-300">₹{approved.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-sand-300">
              <TrendingUp size={12} /> {tx("pending", lang)}
            </div>
            <p className="font-display text-xl mt-0.5 text-clay-300">₹{pending.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f.key ? f.color : "bg-white text-ink/55 shadow-card"
              }`}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ₹{
                    f.key === "paid"     ? paid.toLocaleString("en-IN")
                    : f.key === "approved" ? approved.toLocaleString("en-IN")
                    : pending.toLocaleString("en-IN")
                  }
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Monthly grouped list ── */}
        <div className="mt-4 space-y-5">
          {byMonth.length === 0 && (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-10 text-center text-sm text-ink/40">
              {tx("earningsNoData", lang)}
            </p>
          )}

          {byMonth.map(([monthKey, items]) => {
            const monthTotal = items.reduce((a, e) => a + e.amount, 0);
            return (
              <section key={monthKey}>
                {/* month header */}
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">
                    {monthLabel(items[0].date)}
                  </h2>
                  <span className="text-xs font-semibold text-forest-800">
                    ₹{monthTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((e) => {
                    const cfg = STATUS_CONFIG(lang)[e.status];
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
                      >
                        {/* left icon */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${cfg.pill}`}>
                          {cfg.icon}
                        </div>

                        {/* body */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-forest-950">{e.activity}</p>
                          <p className="text-[11px] text-ink/40">
                            {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>

                        {/* right: amount + status */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-forest-900">₹{e.amount}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.pill}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div className="mt-6 rounded-2xl border border-sand-200 bg-white px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink/40">{tx("earningsStatusGuide", lang)}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-medium text-forest-700">{tx("earningsStatusPaid", lang)}</span>
              {tx("earningsPaidDesc", lang)}
            </div>
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{tx("earningsStatusApproved", lang)}</span>
              {tx("earningsApprovedDesc", lang)}
            </div>
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <span className="rounded-full bg-clay-100 px-2 py-0.5 text-[10px] font-medium text-clay-700">{tx("earningsStatusPending", lang)}</span>
              {tx("earningsPendingDesc", lang)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
