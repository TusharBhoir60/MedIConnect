"use client";

import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import {
  ArrowRight,
  PhoneCall,
  Shield,
  WifiOff,
} from "lucide-react";

export default function HomePage() {
  const { lang } = useStore();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-3">
          <LangSwitch />
          <span className="hidden rounded-full border border-forest-800/15 bg-white px-3 py-1 text-[11px] text-forest-800 md:inline">
            {tx("psCode", lang)}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mt-12 grid items-end gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="text-xs uppercase tracking-[0.22em] text-clay-500">
            {tx("medTechTag", lang)}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.12] text-forest-950 md:text-6xl">
            {tx("brand", lang)}
            <span className="block text-forest-700">
              {tx("brand_description", lang)}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/70">
            {tx("landingDescription", lang)}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-forest-800">
            <span className="rounded-full bg-white px-3 py-1 shadow-card">
              {tx("tagLowSignal", lang)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-card">
              {tx("tagLanguages", lang)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-card">
              {tx("tagAbhaReady", lang)}
            </span>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-phone">
            <p className="text-xs uppercase tracking-widest text-clay-300">
              {tx("expectedOutcomes", lang)}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-sand-200">
              <li>{tx("outcome1", lang)}</li>
              <li>{tx("outcome2", lang)}</li>
              <li>{tx("outcome3", lang)}</li>
              <li>{tx("outcome4", lang)}</li>
              <li>{tx("outcome5", lang)}</li>
              <li>{tx("outcome6", lang)}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Two portals — ASHA + Doctor */}
      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <Portal
          href="/asha"
          kicker={tx("kicker01", lang)}
          title={tx("ashaAppTitle", lang)}
          body={tx("ashaAppBody", lang)}
          cta={tx("enterAsha", lang)}
          accent="clay"
        />
        <Portal
          href="/doctor"
          kicker={tx("kicker02", lang)}
          title={tx("doctorDeskTitle", lang)}
          body={tx("doctorDeskBody", lang)}
          cta={tx("enterDoctor", lang)}
          accent="forest"
        />
      </section>

      {/* Notes row */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Note icon={<WifiOff size={16} />} title={tx("noteLowConn", lang)}>
          {tx("noteLowConnBody", lang)}
        </Note>
        <Note icon={<PhoneCall size={16} />} title={tx("noteJanVaani", lang)}>
          {tx("noteJanVaaniBody", lang)}
        </Note>
        <Note icon={<Shield size={16} />} title={tx("notePublicSys", lang)}>
          {tx("notePublicSysBody", lang)}
        </Note>
      </section>

      {/* SLA escalation note */}
      <section className="mt-6 rounded-2xl border border-clay-200 bg-clay-50 px-5 py-4">
        <p className="text-xs font-medium text-clay-700">{tx("noteSla", lang)}</p>
        <p className="mt-1 text-xs text-clay-600">{tx("noteSlaBody", lang)}</p>
      </section>

      <footer className="mt-12 border-t border-forest-900/10 pt-6 text-xs text-ink/45">
        {tx("landingFooter", lang)}
      </footer>
    </main>
  );
}

function Portal({
  href,
  kicker,
  title,
  body,
  cta,
  accent = "forest",
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  accent?: "forest" | "clay";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl border border-forest-900/8 bg-white p-6 shadow-card transition hover:-translate-y-0.5"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-clay-500">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-2xl text-forest-950">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65">{body}</p>
      <span
        className={`mt-5 inline-flex items-center gap-1 text-sm font-medium ${
          accent === "clay" ? "text-clay-600" : "text-forest-700"
        }`}
      >
        {cta}{" "}
        <ArrowRight
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function Note({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white/70 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-forest-900">
        {icon} {title}
      </div>
      <p className="mt-2 text-sm text-ink/60">{children}</p>
    </div>
  );
}
