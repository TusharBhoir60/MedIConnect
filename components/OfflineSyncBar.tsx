"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudOff, Signal } from "lucide-react";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

/**
 * Offline capsule — visits saved on device in low signal.
 * Auto-sends to the PHC doctor as soon as the browser reports
 * the network is back (plus a manual "signal back" button for the demo).
 */
export function OfflineSyncBar() {
  const { visits, submitVisit, lang } = useStore();
  const queued = visits.filter((v) => v.offlineQueued);
  const [justSynced, setJustSynced] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncNow = useCallback(() => {
    visits.filter((v) => v.offlineQueued).forEach((v) => submitVisit(v.id));
    setJustSynced((n) => n + 1);
  }, [visits, submitVisit]);

  /* real device: fire when connectivity returns */
  useEffect(() => {
    const onOnline = () => syncNow();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncNow]);

  /* keep the green "synced" note visible briefly, then hide */
  useEffect(() => {
    if (justSynced === 0) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustSynced(0), 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [justSynced]);

  if (queued.length === 0) {
    if (justSynced > 0) {
      return (
        <div className="bg-forest-800 px-4 py-2 text-center text-xs text-sand-50">
          {tx("offlineSynced", lang)}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-clay-500 px-4 py-2 text-xs text-white">
      <p className="flex items-center gap-2">
        <CloudOff size={14} className="shrink-0" />
        {tx("offlineBar", lang).replace("{n}", String(queued.length))}
      </p>
      <button
        onClick={syncNow}
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium hover:bg-white/25"
      >
        <Signal size={13} />
        {tx("signalBack", lang)}
      </button>
    </div>
  );
}
