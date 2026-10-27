"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ASHA, useStore } from "@/lib/store";
import { RiskBadge } from "@/components/RiskBadge";
import { tx } from "@/lib/i18n";
import type { IvrCall, Lang, Patient, Visit, VisitStatus } from "@/lib/types";
import { Bell, CheckCircle2, ClipboardCheck, ClipboardList, Phone, PhoneCall, PhoneMissed, PhoneOff, Plus, Search, Send, UserPlus, Users, XCircle } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

const SEED_TODAY = "2026-08-31";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(iso: string) {
  const d = iso.slice(0, 10);
  return d === todayKey() || d === SEED_TODAY;
}

function visitLabel(status: VisitStatus, lang: Lang) {
  if (status === "submitted") return tx("vsSentToDoctor", lang);
  if (status === "reviewed") return tx("vsDoctorAdvice", lang);
  if (status === "referred") return tx("vsReferRhDh", lang);
  if (status === "draft") return tx("vsDraft", lang);
  return status;
}

function sexLabel(sex: string, lang: Lang) {
  if (sex === "F") return tx("sexF", lang);
  if (sex === "M") return tx("sexM", lang);
  return tx("sexO", lang);
}

function lastVisitOf(visits: Visit[], patientId: string) {
  return visits.filter((v) => v.patientId === patientId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export default function AshaHome() {
  const { state } = useAuth();
  const router = useRouter();
  const { patients, visits, emergencies, followUps, labs, referrals, ivrCalls, lang } = useStore();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/asha/login");
    }
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;
  const [q, setQ] = useState("");
  const openEm = emergencies.filter((e) => e.status !== "closed");
  const todayVisits = visits.filter((v) => isToday(v.at));
  const myPatients = patients.filter((p) => p.ashaId === ASHA.id);
  const pendingIvr = ivrCalls.filter(
    (c) => c.type === "followup" &&
      (c.status === "scheduled" || c.status === "triggered" || c.status === "failed" || c.status === "no_answer") &&
      myPatients.some((p) => p.id === c.patientId),
  );
  const recentCompletedIvr = ivrCalls
    .filter(
      (c) => c.type === "followup" && c.status === "completed" &&
        myPatients.some((p) => p.id === c.patientId),
    )
    .sort((a, b) => (b.triggeredAt ?? b.scheduledFor).localeCompare(a.triggeredAt ?? a.scheduledFor))
    .slice(0, 3);
  const openTasks =
    followUps.filter((f) => !f.done && myPatients.some((p) => p.id === f.patientId)).length +
    labs.filter((l) => l.status === "ordered" && myPatients.some((p) => p.id === l.patientId)).length +
    myPatients.reduce((n, p) => n + (p.carePlan ?? []).filter((c) => !c.done).length, 0) +
    referrals.filter((r) => r.status === "referred" && myPatients.some((p) => p.id === r.patientId)).length;

  const query = q.trim().toLowerCase();
  const roster = useMemo(() => {
    const list = query
      ? patients.filter((p) => {
          const blob = `${p.name} ${p.village} ${p.phone} ${p.abhaId} ${p.conditions.join(" ")}`.toLowerCase();
          return blob.includes(query);
        })
      : patients;
    return [...list].sort((a, b) => {
      const ra = a.risk === "emergency" ? 0 : 1;
      const rb = b.risk === "emergency" ? 0 : 1;
      return ra - rb;
    });
  }, [patients, query]);

  return (
    <div className="flex-1 bg-sand-50">
      {/*
        Header:
        - Mobile: full identity block (name, PHC, patient count) + emergency bell
        - Desktop (lg+): sidebar already shows identity → compact strip with
          just the page title and emergency bell, no redundant name/PHC repeat
      */}
      <header className="bg-forest-900 px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-sand-50 sm:px-6 lg:px-8 lg:pb-4 lg:pt-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            {/* Identity — shown on mobile, hidden on desktop (sidebar handles it) */}
            <div className="lg:hidden">
              <p className="text-[11px] uppercase tracking-widest text-clay-300">{tx("ashaWorker", lang)}</p>
              <h1 className="font-display text-2xl sm:text-3xl">{ASHA.name}</h1>
              <p className="text-xs text-sand-300">{tx("phcArmori", lang)} · {ASHA.village} · {patients.length} {tx("registeredPatients", lang)}</p>
            </div>
            {/* Desktop page title — visible only on lg+ */}
            <div className="hidden lg:block">
              <h1 className="font-display text-xl text-sand-50">{tx("todaySection", lang)}</h1>
              <p className="text-xs text-sand-300">{patients.length} {tx("registeredPatients", lang)} · {ASHA.village}</p>
            </div>
            {/* Emergency bell — always visible */}
            <Link
              href="/asha/emergency"
              className="relative rounded-full bg-white/10 p-2 hover:bg-white/20"
              aria-label={tx("emergency", lang)}
            >
              <Bell size={18} />
              {openEm.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay-400" />}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {openEm.length > 0 && (
          <Link
            href="/asha/emergency"
            className="block rounded-2xl bg-clay-500 px-4 py-3 text-sm text-white"
          >
            {openEm.length} {tx("openEmerBanner", lang)} — {patients.find((p) => p.id === openEm[0].patientId)?.name}: {openEm[0].reason}
          </Link>
        )}

        {/* JanVaani follow-up calls queue */}
        {(pendingIvr.length > 0 || recentCompletedIvr.length > 0) && (
          <IvrCallQueue
            pending={pendingIvr}
            recentCompleted={recentCompletedIvr}
            patients={patients}
            lang={lang}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/asha/visit?mode=new"
            className="flex items-start justify-between gap-3 rounded-2xl bg-forest-800 px-4 py-4 text-sand-50 sm:px-5"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <UserPlus size={18} /> {tx("newPatient", lang)}
              </p>
              <p className="mt-1 text-xs text-sand-200">{tx("newPatientSubFull", lang)}</p>
            </div>
            <Plus size={20} className="mt-0.5 shrink-0 opacity-80" />
          </Link>
          <Link
            href="/asha/visit?mode=existing"
            className="flex items-start justify-between gap-3 rounded-2xl border border-forest-900/10 bg-white px-4 py-4 shadow-card sm:px-5"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-forest-950">
                <ClipboardList size={18} className="text-forest-700" /> {tx("existingPatient", lang)}
              </p>
              <p className="mt-1 text-xs text-ink/55">{tx("existingPatientSubFull", lang)}</p>
            </div>
            <Users size={20} className="mt-0.5 shrink-0 text-forest-700" />
          </Link>
        </div>

        {/* Task & referral hubs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/asha/tasks"
            className="flex items-center justify-between gap-3 rounded-2xl border border-forest-900/10 bg-white px-4 py-3 shadow-card"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-forest-950">
                <ClipboardCheck size={17} className="text-forest-700" /> {tx("openTasksTile", lang)} · {openTasks}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">{tx("tasksLinkSub", lang)}</p>
            </div>
          </Link>
          <Link
            href="/asha/referrals"
            className="flex items-center justify-between gap-3 rounded-2xl border border-forest-900/10 bg-white px-4 py-3 shadow-card"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-forest-950">
                <Send size={17} className="text-forest-700" /> {tx("navReferrals", lang)}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">{tx("referralsTileSub", lang)}</p>
            </div>
          </Link>
        </div>

        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tx("searchFull", lang)}
            className="w-full rounded-2xl border border-sand-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-forest-700/20 focus:ring-2"
          />
        </label>

        {/* Two-column layout: md+ shows Today + Roster side-by-side */}
        <div className="grid items-start gap-6 md:grid-cols-5 lg:grid-cols-12">
          <section className="md:col-span-2 lg:col-span-5">
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">{tx("todayNewEntries", lang)}</h2>
            <p className="mt-1 text-xs text-ink/50">{tx("todayVisitsDesc", lang)}</p>
            <div className="mt-3 space-y-2">
              {todayVisits.length === 0 && (
                <p className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-ink/45">
                  {tx("noEntryTodayFull", lang)}
                </p>
              )}
              {todayVisits.map((v) => {
                const p = patients.find((x) => x.id === v.patientId);
                if (!p) return null;
                return <VisitRow key={v.id} patient={p} visit={v} lang={lang} />;
              })}
            </div>
          </section>

          <section className="md:col-span-3 lg:col-span-7">
            <h2 className="text-[11px] uppercase tracking-widest text-ink/40">{tx("rosterSectionFull", lang)}</h2>
            <p className="mt-1 text-xs text-ink/50">
              {roster.length} {tx("rosterDesc", lang)}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {roster.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  visit={lastVisitOf(visits, p.id)}
                  followDue={followUps.some((f) => f.patientId === p.id && !f.done)}
                  lang={lang}
                />
              ))}
              {roster.length === 0 && (
                <p className="col-span-full rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink/45">
                  {tx("noPatientSearch", lang)}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function VisitRow({ patient: p, visit: v, lang }: { patient: Patient; visit: Visit; lang: Lang }) {
  const urg = v.urgency;
  return (
    <Link
      href={`/asha/patients/${p.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
    >
      <div>
        <p className="text-sm font-medium text-forest-950">{p.name}</p>
        <p className="text-xs text-ink/50">{p.village} · {sexLabel(p.sex, lang)} · {p.age}{tx("yrs", lang)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {urg && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              urg === "emergency"
                ? "bg-clay-500 text-white"
                : urg === "urgent"
                  ? "bg-clay-100 text-clay-700"
                  : "bg-sand-200 text-ink/55"
            }`}
          >
            {urg === "emergency" ? tx("urgEmergency", lang) : urg === "urgent" ? tx("urgUrgent", lang) : tx("urgRoutine", lang)}
          </span>
        )}
        <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[11px] font-medium text-forest-800">
          {visitLabel(v.status, lang)}
        </span>
      </div>
    </Link>
  );
}

function PatientCard({
  patient: p,
  visit,
  followDue,
  lang,
}: {
  patient: Patient;
  visit: Visit | undefined;
  followDue: boolean;
  lang: Lang;
}) {
  return (
    <Link
      href={`/asha/patients/${p.id}`}
      className="flex flex-col gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-forest-950">{p.name}</p>
        <RiskBadge risk={p.risk} lang={lang} />
      </div>
      <p className="text-xs text-ink/50">{p.village} · {sexLabel(p.sex, lang)} · {p.age}{tx("yrs", lang)}</p>
      {visit ? (
        <p className="text-[11px] text-ink/40">{tx("lastVisitLabel", lang)} {visit.at.slice(0, 10)} · {visitLabel(visit.status, lang)}</p>
      ) : (
        <p className="text-[11px] text-ink/30">{tx("noVisitYet", lang)}</p>
      )}
      {followDue && (
        <span className="mt-0.5 self-start rounded-full bg-clay-100 px-2 py-0.5 text-[10px] font-medium text-clay-700">
          {tx("followUpPending", lang)}
        </span>
      )}
    </Link>
  );
}

/* ── JanVaani IVR call queue panel ── */
function IvrCallQueue({
  pending,
  recentCompleted,
  patients,
  lang,
}: {
  pending:          IvrCall[];
  recentCompleted:  IvrCall[];
  patients:         Patient[];
  lang:             Lang;
}) {
  const [expanded, setExpanded] = useState(true);

  // sort: triggered first, then by scheduledFor ascending
  const sorted = [...pending].sort((a, b) => {
    if (a.status === "triggered" && b.status !== "triggered") return -1;
    if (b.status === "triggered" && a.status !== "triggered") return  1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });

  const callingNow  = sorted.filter((c) => c.status === "triggered");
  const upcoming    = sorted.filter((c) => c.status === "scheduled");
  const needsRetry  = sorted.filter((c) => c.status === "failed" || c.status === "no_answer");

  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white shadow-card overflow-hidden">
      {/* header */}
      <button
        onClick={() => setExpanded((x) => !x)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100">
            <Phone size={13} className="text-forest-700" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-forest-950">
              {tx("callQueueTitle", lang)}
            </p>
            <p className="text-[11px] text-ink/45">
              {callingNow.length > 0
                ? `${callingNow.length} ${tx("ivrCallingNow", lang)} · `
                : ""}
              {upcoming.length} {tx("callStatusScheduled", lang).toLowerCase()}
              {needsRetry.length > 0 ? ` · ${needsRetry.length} ${tx("ivrNeedsRetry", lang)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {callingNow.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-forest-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-forest-600" />
            </span>
          )}
          <span className="text-xs text-ink/40">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-sand-100">
          {sorted.length === 0 && recentCompleted.length === 0 && (
            <p className="px-4 py-4 text-center text-xs text-ink/40">
              {tx("callQueueEmpty", lang)}
            </p>
          )}

          {/* calling now */}
          {callingNow.map((c) => (
            <IvrCallRow key={c.id} call={c} patient={patients.find((p) => p.id === c.patientId)} lang={lang} />
          ))}

          {/* scheduled */}
          {upcoming.map((c) => (
            <IvrCallRow key={c.id} call={c} patient={patients.find((p) => p.id === c.patientId)} lang={lang} />
          ))}

          {/* needs retry */}
          {needsRetry.map((c) => (
            <IvrCallRow key={c.id} call={c} patient={patients.find((p) => p.id === c.patientId)} lang={lang} />
          ))}

          {/* recent completed — dimmed */}
          {recentCompleted.length > 0 && (
            <>
              <div className="px-4 pb-1 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/30">
                  {tx("ivrRecentCompleted", lang)}
                </p>
              </div>
              {recentCompleted.map((c) => (
                <IvrCallRow key={c.id} call={c} patient={patients.find((p) => p.id === c.patientId)} lang={lang} dim />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function IvrCallRow({
  call: c,
  patient,
  lang,
  dim = false,
}: {
  call:     IvrCall;
  patient:  Patient | undefined;
  lang:     Lang;
  dim?:     boolean;
}) {
  /* ── status config ── */
  const statusCfg: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
    scheduled: {
      label: tx("callStatusScheduled", lang),
      icon:  <Phone size={11} />,
      pill:  "bg-forest-100 text-forest-700",
    },
    triggered: {
      label: tx("callStatusTriggered", lang),
      icon:  <PhoneCall size={11} className="animate-bounce" />,
      pill:  "bg-forest-700 text-white",
    },
    completed: {
      label: tx("callStatusCompleted", lang),
      icon:  <CheckCircle2 size={11} />,
      pill:  "bg-sand-200 text-ink/55",
    },
    failed: {
      label: tx("callStatusFailed", lang),
      icon:  <XCircle size={11} />,
      pill:  "bg-clay-100 text-clay-600",
    },
    no_answer: {
      label: tx("callStatusNoAnswer", lang),
      icon:  <PhoneMissed size={11} />,
      pill:  "bg-clay-100 text-clay-600",
    },
  };

  const cfg = statusCfg[c.status] ?? statusCfg.scheduled;

  /* ── urgency left border ── */
  const urgencyBorder =
    c.urgency === "urgent"
      ? "border-l-orange-400"
      : c.urgency === "emergency"
        ? "border-l-red-400"
        : "border-l-forest-300";

  /* ── time label ── */
  const timeLabel =
    c.status === "triggered" || c.status === "completed"
      ? c.triggeredAt
        ? new Date(c.triggeredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—"
      : new Date(c.scheduledFor).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const timePrefix =
    c.status === "triggered" ? tx("ivrTimeTriggered", lang) :
    c.status === "completed" ? tx("ivrTimeCompleted", lang) :
    c.status === "failed"    ? tx("ivrTimeFailed", lang)    :
    c.status === "no_answer" ? tx("ivrTimeTried", lang)     : tx("ivrTimeDue", lang);

  return (
    <div
      className={`flex items-center gap-3 border-l-4 px-4 py-3 transition-opacity ${urgencyBorder} ${
        c.status === "triggered" ? "bg-forest-50" : dim ? "opacity-50" : ""
      }`}
    >
      {/* icon */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        c.status === "triggered" ? "bg-forest-700 text-white" :
        c.status === "failed" || c.status === "no_answer" ? "bg-clay-100 text-clay-500" :
        c.status === "completed" ? "bg-sand-200 text-ink/40" :
        "bg-forest-100 text-forest-700"
      }`}>
        {cfg.icon}
      </div>

      {/* body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate text-sm font-medium ${dim ? "text-ink/50" : "text-forest-950"}`}>
            {c.patientName}
          </p>
          {c.urgency === "urgent" && (
            <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-600">
              ⚠️ {tx("urgUrgent", lang)}
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-ink/45">
          {c.complaint ? `${c.complaint} · ` : ""}{timePrefix}{timeLabel}
        </p>
        {patient?.phone && (
          <p className="mt-0.5 font-mono text-[10px] text-ink/35">{patient.phone}</p>
        )}
      </div>

      {/* status pill */}
      <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.pill}`}>
        {cfg.icon} {cfg.label}
      </span>
    </div>
  );
}
