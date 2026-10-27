"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCTOR_NAV, doctorNavActive } from "@/components/doctor-nav";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

export function DoctorTabBar() {
  const path = usePathname();
  const { lang } = useStore();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-sand-200 bg-sand-50/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      {DOCTOR_NAV.map((it) => {
        const on = doctorNavActive(path, it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] ${on ? "text-forest-700" : "text-ink/45"}`}
          >
            <Icon size={18} strokeWidth={on ? 2.4 : 1.8} />
            {tx(it.labelKey, lang)}
          </Link>
        );
      })}
    </nav>
  );
}
