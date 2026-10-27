import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? "#f4efe6" : "#13432c"} />
        <path d="M16 7v18M10 13c4 0 6 6 12 6" stroke={light ? "#13432c" : "#e8a87c"} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.2" fill={light ? "#c45c26" : "#e8a87c"} />
      </svg>
      <div className="leading-tight">
        <div className={`font-display text-[15px] font-semibold tracking-tight ${light ? "text-sand-50" : "text-forest-900"}`}>
          JanArogya
        </div>
        <div className={`text-[10px] uppercase tracking-[0.16em] ${light ? "text-sand-300" : "text-forest-700/70"}`}>
          Maharashtra
        </div>
      </div>
    </div>
  );
}

export function WordmarkLink({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex">
      <Logo />
    </Link>
  );
}
