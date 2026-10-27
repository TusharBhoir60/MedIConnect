"use client";

import { AshaSidebar } from "@/components/AshaSidebar";
import { AshaTabBar } from "@/components/AshaTabBar";
import { InstallBanner } from "@/components/InstallBanner";
import { OfflineSyncBar } from "@/components/OfflineSyncBar";
import { PwaRegister } from "@/components/PwaRegister";
import { useStore } from "@/lib/store";
import { LANG_LABEL } from "@/lib/seed";
import type { Lang } from "@/lib/types";

/** Compact lang toggle styled for the dark-green mobile header */
function LangSwitchDark() {
  const { lang, setLang } = useStore();
  return (
    <div className="inline-flex rounded-full bg-white/15 p-0.5 text-[11px] font-medium">
      {(["mr", "hi", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2 py-0.5 transition-colors ${
            lang === l
              ? "bg-white text-forest-900 shadow-sm"
              : "text-white/75 hover:text-white"
          }`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

export function AshaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-sand-50">
      <PwaRegister />
      {/* Desktop sidebar — hidden below lg */}
      <AshaSidebar />

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top bar — install banner + lang switch in the green strip */}
        <div className="flex items-center gap-2 bg-forest-900 px-3 py-2 lg:hidden">
          <div className="min-w-0 flex-1">
            <InstallBanner app="asha" />
          </div>
          {/* Lang switch — white pill on dark green */}
          <div className="shrink-0">
            <LangSwitchDark />
          </div>
        </div>

        {/* Offline indicator */}
        <OfflineSyncBar />

        {/* Page content — extra bottom padding on mobile so tab bar doesn't overlap */}
        <main className="flex min-h-0 flex-1 flex-col pb-[4.75rem] lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — fixed, hidden on desktop */}
        <AshaTabBar />
      </div>
    </div>
  );
}
