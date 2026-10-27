"use client";

import { tx } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function RiskBadge({ risk, lang }: { risk: string; lang?: Lang }) {
  const l = lang ?? "mr";
  const map: Record<string, string> = {
    maternal: tx("riskANC", l),
    child: tx("riskChildBadge", l),
    chronic: tx("riskNCD", l),
    emergency: tx("riskEmergencyBadge", l),
    routine: tx("riskRoutineBadge", l),
  };
  const cls =
    risk === "emergency"
      ? "bg-clay-500 text-white"
      : risk === "maternal"
        ? "bg-clay-300/40 text-clay-500"
        : "bg-sand-100 text-forest-800";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>{map[risk] ?? risk}</span>;
}
