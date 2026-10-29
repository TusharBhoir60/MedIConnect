"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

export function DoctorHeader() {
  const { lang } = useStore();
  return (
    <header className="border-b border-forest-900/10 bg-forest-950 px-4 py-3 text-sand-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2">
        <Link href="/" className="opacity-90 hover:opacity-100">
          <Logo light />
        </Link>
        <nav className="flex gap-4 text-sm text-sand-300">
          <Link href="/doctor" className="hover:text-white">
            {tx("queue", lang)}
          </Link>
          <Link href="/doctor/facility" className="hover:text-white">
            {tx("facility", lang)}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <div className="text-right text-xs">
            <div className="text-sand-50">Dr. Anjali Deshmukh</div>
            <div className="text-sand-300">{tx("moRole", lang)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
