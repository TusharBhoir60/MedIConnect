"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASHA_NAV, ashaNavActive } from "@/components/asha-nav";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

export function AshaTabBar() {
  const path = usePathname();
  const { lang } = useStore();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-sand-50/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {/* Use a flex row so each item shrinks/grows equally regardless of count */}
      <div className="flex items-stretch">
        {ASHA_NAV.map((it) => {
          const on = ashaNavActive(path, it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-0.5 pt-2 pb-1 text-[9px] leading-tight transition-colors ${
                on ? "text-forest-700" : "text-ink/40 hover:text-ink/70"
              }`}
            >
              {/* Icon wrapper — slightly bigger touch target */}
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  on ? "bg-forest-100" : ""
                }`}
              >
                <Icon size={17} strokeWidth={on ? 2.4 : 1.8} />
              </span>
              {/* Label — hidden below 360px to prevent overflow */}
              <span className="hidden min-[360px]:block max-w-full truncate text-center">
                {tx(it.labelKey, lang)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
