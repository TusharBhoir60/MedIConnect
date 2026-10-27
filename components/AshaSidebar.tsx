"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASHA_NAV, ashaNavActive } from "@/components/asha-nav";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { ASHA, useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

export function AshaSidebar() {
  const path = usePathname();
  const { lang } = useStore();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-forest-900/10 bg-forest-950 text-sand-50 lg:flex">
      <div className="border-b border-white/10 px-4 py-4">
        <Link href="/" className="opacity-95 hover:opacity-100">
          <Logo light />
        </Link>
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-clay-300">{tx("ashaWorker", lang)}</p>
        <p className="font-display text-lg leading-tight">{ASHA.name}</p>
        <p className="text-[11px] text-sand-300">{tx("phcArmori", lang)} · {ASHA.village}</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {ASHA_NAV.map((it) => {
          const on = ashaNavActive(path, it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                on ? "bg-white/12 text-white" : "text-sand-300 hover:bg-white/6 hover:text-sand-50"
              }`}
            >
              <Icon size={18} strokeWidth={on ? 2.4 : 1.8} />
              {tx(it.labelKey, lang)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <LangSwitch />
      </div>
    </aside>
  );
}
