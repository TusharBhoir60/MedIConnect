"use client";

import Link from "next/link";
import { DoctorSidebar } from "@/components/DoctorSidebar";
import { DoctorTabBar } from "@/components/DoctorTabBar";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { DOCTORS, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

function DoctorMobileHeader() {
  const { lang } = useStore();
  const doc = DOCTORS[0];
  return (
    <header className="flex items-center justify-between gap-3 border-b border-forest-900/10 bg-forest-950 px-4 py-3 text-sand-50 lg:hidden">
      <Link href="/" className="opacity-90 hover:opacity-100">
        <Logo light />
      </Link>
      <div className="flex items-center gap-3">
        <LangSwitch />
        <div className="text-right text-xs leading-snug">
          <p className="font-medium text-sand-50">{doc.name}</p>
          <p className="text-sand-300">{tx("moRole", lang)}</p>
        </div>
      </div>
    </header>
  );
}

export function DoctorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-sand-50">
      {/* Desktop sidebar — hidden below lg */}
      <DoctorSidebar />

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top header */}
        <DoctorMobileHeader />

        {/* Page content — extra bottom padding on mobile so tab bar doesn't overlap */}
        <main className="flex min-h-0 flex-1 flex-col pb-[4.75rem] lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — fixed, hidden on desktop */}
        <DoctorTabBar />
      </div>
    </div>
  );
}
