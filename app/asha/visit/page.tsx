"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { RiskBadge } from "@/components/RiskBadge";
import { CallScheduledModal } from "@/components/CallScheduledModal";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import type { Lang, Patient, Risk, Sex, Urgency } from "@/lib/types";
import {
  AlertTriangle,
  CloudOff,
  MapPin,
  Phone,
  Send,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";

const NEARBY_PHCS = [
  { name: "PHC Armori",    dist: "0 km",  phone: "07132-240234", maps: "https://maps.google.com/?q=PHC+Armori+Gadchiroli" },
  { name: "RH Gadchiroli", dist: "14 km", phone: "07132-222345", maps: "https://maps.google.com/?q=Rural+Hospital+Gadchiroli" },
  { name: "Sub-DH Wadsa",  dist: "22 km", phone: "07132-244100", maps: "https://maps.google.com/?q=Sub+District+Hospital+Wadsa" },
];

export default function NewVisitPage() {
  const { lang } = useStore();
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-ink/50">{tx("formLoading", lang)}</p>}>
      <NewVisit />
    </Suspense>
  );
}

function NewVisit() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    patients, visits,
    addPatient, addVisit, addVoiceToVisit, addAttachmentToVisit,
    submitVisit, markVisitOffline, setVisitUrgency,
    raiseEmergency, scheduleIvrCall, updateIvrCall,
    lang,
  } = useStore();

  const [mode,       setMode]       = useState<"existing" | "new">("existing");
  const [patientId,  setPatientId]  = useState(patients[0]?.id ?? "");
  const [name,       setName]       = useState("");
  const [village,    setVillage]    = useState("Armori");
  const [age,        setAge]        = useState(30);
  const [sex,        setSex]        = useState<Sex>("F");
  const [phone,      setPhone]      = useState("");
  const [place,      setPlace]      = useState("Home · Armori");
  const [notes,      setNotes]      = useState("");
  const [risk,       setRisk]       = useState<Risk>("routine");
  const [conditions, setConditions] = useState("");
  const [visitId,    setVisitId]    = useState<string | null>(null);
  const [urgency,    setUrgency]    = useState<Urgency>("routine");

  /* ── Real network detection ── */
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online",  up);
      window.removeEventListener("offline", down);
    };
  }, []);

  /* ── Result state ── */
  const [routeResult, setRouteResult] = useState<
    null | { type: "sent" } | { type: "offline_queued" } | { type: "emergency_sent" }
  >(null);

  /* ── Call modal state — shown after non-emergency submit ── */
  const [callModal, setCallModal] = useState<{
    patientName:  string;
    patientPhone: string;
    patientLang:  Lang;
    patientSex:   string;
    urgency:      Urgency;
    visitNotes:   string;
    complaint:    string;
    scheduledFor: string;
    ivrCallId:    string;
  } | null>(null);

  /*
   * pendingSubmit holds the visitId + pid that were saved offline.
   * When network comes back the useEffect below auto-submits them.
   */
  const pendingRef = useRef<{ id: string; pid: string } | null>(null);

  /* ── Auto-send when network returns ── */
  useEffect(() => {
    if (!online || !pendingRef.current) return;
    const { id, pid } = pendingRef.current;
    pendingRef.current = null;

    // submit the queued visit
    submitVisit(id);

    const patient = patients.find((p) => p.id === pid);
    if (urgency === "emergency") {
      raiseEmergency({
        patientId:   pid,
        visitId:     id,
        raisedBy:    "asha",
        reason:      notes || conditions || "ASHA flagged emergency",
        destination: "PHC Armori / 108 / Rural Hospital",
      });
      setRouteResult({ type: "emergency_sent" });
      setTimeout(() => router.push("/asha"), 2000);
    } else {
      const pName  = patient?.name     ?? name;
      const pPhone = patient?.phone    ?? phone;
      const pLang  = patient?.language ?? "mr";
      const pSex   = patient?.sex      ?? sex;
      const pComp  = patient?.conditions.join(", ") ?? conditions;
      const ivr = scheduleIvrCall({
        visitId:      id,
        patientId:    pid,
        patientName:  pName,
        patientPhone: pPhone,
        patientLang:  pLang,
        visitNotes:   notes,
        complaint:    pComp,
        type:         "followup",
        urgency,
      });
      setCallModal({
        patientName:  pName,
        patientPhone: pPhone,
        patientLang:  pLang,
        patientSex:   pSex,
        urgency,
        visitNotes:   notes,
        complaint:    pComp,
        scheduledFor: ivr.scheduledFor,
        ivrCallId:    ivr.id,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  /* ── Params ── */
  useEffect(() => {
    const m   = params.get("mode");
    const pid = params.get("patientId");
    if (m === "new" || m === "existing") setMode(m);
    if (pid && patients.some((p) => p.id === pid)) setPatientId(pid);
  }, [params, patients]);

  const selected  = patients.find((p) => p.id === patientId);
  const lastVisit = useMemo(
    () => visits.filter((v) => v.patientId === patientId).sort((a, b) => b.at.localeCompare(a.at))[0],
    [visits, patientId],
  );

  /* ── Urgency colours ── */
  const uiTheme = urgency === "emergency"
    ? { header: "bg-red-600",    pill: "bg-red-600 text-white" }
    : urgency === "urgent"
    ? { header: "bg-orange-500", pill: "bg-orange-500 text-white" }
    : { header: "bg-forest-900", pill: "bg-forest-800 text-sand-50" };

  /* ── Form validation — photo + voice optional, everything else required ── */
  const missingFields: string[] = [];
  if (mode === "existing") {
    if (!patientId)        missingFields.push(tx("visitPatientLabel", lang));
  } else {
    if (!name.trim())      missingFields.push(tx("labelName", lang));
    if (!village.trim())   missingFields.push(tx("labelVillage", lang));
    if (!phone.trim())     missingFields.push(tx("labelPhone", lang));
    if (!conditions.trim()) missingFields.push(tx("labelComplaint", lang));
  }
  if (!place.trim())       missingFields.push(tx("labelVisitPlace", lang));
  if (!notes.trim())       missingFields.push(tx("labelNotes", lang));
  const formReady = missingFields.length === 0;

  /* ── ensureVisit ── */
  function ensureVisit() {
    let pid = patientId;
    if (mode === "new" && !visitId) {
      const p = addPatient({
        name,
        village,
        taluka:     "Armori",
        district:   "Gadchiroli",
        age,
        sex,
        phone:      phone || "9000000000",
        language:   "mr" as Lang,
        risk,
        conditions: conditions ? conditions.split(",").map((s) => s.trim()) : ["Home visit"],
      });
      pid = p.id;
      setPatientId(p.id);
    }
    if (visitId) return { id: visitId, pid };
    const v = addVisit({
      patientId: pid,
      at:        new Date().toISOString(),
      place,
      notes,
      voiceNotes:  [],
      attachments: [],
      urgency,
    });
    setVisitId(v.id);
    return { id: v.id, pid };
  }

  /* ── Single submit handler ── */
  function handleSubmit() {
    const { id, pid } = ensureVisit();
    setVisitUrgency(id, urgency);

    if (online) {
      /* ── ONLINE: send immediately ── */
      submitVisit(id);
      const patient = patients.find((p) => p.id === pid);

      if (urgency === "emergency") {
        raiseEmergency({
          patientId:   pid,
          visitId:     id,
          raisedBy:    "asha",
          reason:      notes || conditions || "ASHA flagged emergency",
          destination: "PHC Armori / 108 / Rural Hospital",
        });
        setRouteResult({ type: "emergency_sent" });
        setTimeout(() => router.push("/asha"), 2000);
      } else {
        /* Schedule in store (real 6h / 24h) then show demo countdown modal */
        const pName  = patient?.name     ?? name;
        const pPhone = patient?.phone    ?? phone;
        const pLang  = patient?.language ?? ("mr" as Lang);
        const pSex   = patient?.sex      ?? sex;
        const pComp  = patient?.conditions.join(", ") ?? conditions;
        const ivr = scheduleIvrCall({
          visitId:      id,
          patientId:    pid,
          patientName:  pName,
          patientPhone: pPhone,
          patientLang:  pLang,
          visitNotes:   notes,
          complaint:    pComp,
          type:         "followup",
          urgency,
        });
        /* Open the 24-second demo modal */
        setCallModal({
          patientName:  pName,
          patientPhone: pPhone,
          patientLang:  pLang,
          patientSex:   pSex,
          urgency,
          visitNotes:   notes,
          complaint:    pComp,
          scheduledFor: ivr.scheduledFor,
          ivrCallId:    ivr.id,
        });
      }

    } else {
      /* ── OFFLINE: save locally, auto-send when signal returns ── */
      markVisitOffline(id);
      pendingRef.current = { id, pid };
      setRouteResult({ type: "offline_queued" });
    }
  }

  const isEmergency = urgency === "emergency";
  /* form is "done" when emergency banner shows or offline queued — modal handles non-emergency */
  const done = routeResult?.type === "emergency_sent" || routeResult?.type === "offline_queued";

  return (
    <div className="flex-1 overflow-y-auto bg-sand-50">

      {/* ── Call-scheduled modal (non-emergency submit) ── */}
      {callModal && (
        <CallScheduledModal
          {...callModal}
          lang={lang}
          onCancel={() => {
            /* cancel just closes modal; visit is already submitted, call stays in store */
            setCallModal(null);
            updateIvrCall(callModal.ivrCallId, { status: "failed" });
          }}
          onTriggered={(ivrCallId) => {
            updateIvrCall(ivrCallId, {
              status:      "triggered",
              triggeredAt: new Date().toISOString(),
            });
          }}
        />
      )}

      {/* ── Urgency-coloured header ── */}
      <div className={`transition-colors duration-300 ${uiTheme.header} px-4 py-4 text-white sm:px-6`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/60">{tx("homeVisit", lang)}</p>
            <h1 className="font-display text-xl">
              {isEmergency  ? tx("urgEmergency", lang)
               : urgency === "urgent" ? tx("urgUrgent", lang)
               : tx("urgRoutine", lang)}
            </h1>
          </div>
          {/* Live network badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            online ? "bg-forest-700 text-white" : "bg-black/30 text-white"
          }`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? tx("networkOnline", lang) : tx("networkOffline", lang)}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="space-y-4">

          {/* ── Urgency picker ── */}
          <div className={`rounded-2xl border-2 p-4 transition-colors duration-300 ${
            isEmergency    ? "border-red-300 bg-red-50"
            : urgency === "urgent" ? "border-orange-200 bg-orange-50/50"
            : "border-forest-900/10 bg-white"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">
              {tx("urgencyLabel", lang)}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["routine", "urgent", "emergency"] as Urgency[]).map((u) => (
                <button key={u} type="button"
                  onClick={() => setUrgency(u)}
                  className={`rounded-xl py-3 text-sm font-semibold ring-1 transition-all duration-200 ${
                    urgency === u
                      ? u === "emergency" ? "bg-red-500 text-white ring-red-500 scale-105 shadow-lg"
                      : u === "urgent"    ? "bg-orange-400 text-white ring-orange-400 scale-105"
                      :                     "bg-forest-800 text-white ring-forest-800"
                      : "bg-white text-ink/55 ring-sand-200 hover:ring-sand-400"
                  }`}
                >
                  {u === "routine"   ? tx("urgRoutine", lang)
                   : u === "urgent"  ? tx("urgUrgent", lang)
                   :                   tx("urgEmergency", lang)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Emergency + offline: nearby PHC card ── */}
          {isEmergency && !online && (
            <div className="rounded-2xl border-2 border-red-400 bg-red-500 p-4 text-white">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={16} /> {tx("emergencyNearbyFacilities", lang)}
              </p>
              <div className="mt-3 space-y-2">
                {NEARBY_PHCS.map((f) => (
                  <div key={f.name} className="flex items-center justify-between rounded-xl bg-white/15 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-white/70">
                        <MapPin size={10} /> {f.dist}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${f.phone}`}
                        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-600">
                        <Phone size={11} /> {tx("callBtn", lang)}
                      </a>
                      <a href={f.maps} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium">
                        <MapPin size={11} /> {tx("mapBtn", lang)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <a href="tel:108"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-red-600">
                <Phone size={15} /> {tx("call108", lang)}
              </a>
            </div>
          )}

          {/* ── Patient toggle ── */}
          <div>
            <div className="flex gap-2">
              {(["existing", "new"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    mode === m ? uiTheme.pill : "bg-white text-ink/55 shadow-card"
                  }`}>
                  {m === "existing" ? tx("visitExisting", lang) : tx("visitNew", lang)}
                </button>
              ))}
            </div>

            {mode === "existing" ? (
              <label className="mt-3 block text-xs">
                {tx("visitPatientLabel", lang)}
                <select className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm"
                  value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.age}{p.sex} · {p.village}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="mt-3 space-y-2">
                <Field label={tx("labelName", lang)}    value={name}    onChange={setName} />
                <Field label={tx("labelVillage", lang)} value={village} onChange={setVillage} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">
                    {tx("labelAge", lang)}
                    <input type="number" className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm"
                      value={age} onChange={(e) => setAge(Number(e.target.value))} />
                  </label>
                  <label className="text-xs">
                    {tx("labelSex", lang)}
                    <select className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm"
                      value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                      <option value="F">{tx("sexFemale", lang)}</option>
                      <option value="M">{tx("sexMale", lang)}</option>
                      <option value="O">{tx("sexOther", lang)}</option>
                    </select>
                  </label>
                </div>
                <Field label={tx("labelPhone", lang)} value={phone} onChange={setPhone} />
                <label className="text-xs">
                  {tx("labelRisk", lang)}
                  <select className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm"
                    value={risk} onChange={(e) => setRisk(e.target.value as Risk)}>
                    <option value="routine">{tx("riskRoutine", lang)}</option>
                    <option value="maternal">{tx("riskMaternal", lang)}</option>
                    <option value="child">{tx("riskChild", lang)}</option>
                    <option value="chronic">{tx("riskChronic", lang)}</option>
                    <option value="emergency">{tx("riskEmergency", lang)}</option>
                  </select>
                </label>
                <Field label={tx("labelComplaint", lang)} value={conditions} onChange={setConditions} />
              </div>
            )}
          </div>

          {/* ── Visit place + notes ── */}
          <div className="space-y-2">
            <Field label={tx("labelVisitPlace", lang)} value={place} onChange={setPlace} />
            <label className="block text-xs">
              {tx("labelNotes", lang)}
              <textarea
                className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>

          {/* ── Voice recorder ── */}
          <VoiceRecorder lang={lang} urgency={urgency} onSave={(n) => {
            const { id } = ensureVisit();
            addVoiceToVisit(id, { createdAt: new Date().toISOString(), ...n });
          }} />

          {/* ── Photo attach ── */}
          <label className={`block rounded-2xl border border-dashed p-3 text-xs transition-colors ${
            isEmergency ? "border-red-200 bg-red-50/40" : "border-forest-800/20 bg-white"
          }`}>
            <span className="font-medium text-forest-900">{tx("labelPrescription", lang)}</span>
            <input type="file" accept="image/*" className="mt-2 block w-full text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const { id } = ensureVisit();
                  addAttachmentToVisit(id, {
                    kind:    file.type.includes("pdf") ? "report" : "prescription",
                    name:    file.name,
                    dataUrl: String(reader.result),
                  });
                };
                reader.readAsDataURL(file);
              }} />
          </label>

          {/* ── Result banners ── */}
          {routeResult?.type === "emergency_sent" && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-medium text-white">
              <ShieldAlert size={16} /> {tx("emergencySentBanner", lang)}
            </div>
          )}
          {routeResult?.type === "sent" && (
            <div className="flex items-center gap-2 rounded-2xl bg-forest-700 px-4 py-3 text-sm font-medium text-white">
              <Send size={15} /> {tx("sentToDoctorBanner", lang)}
            </div>
          )}
          {routeResult?.type === "offline_queued" && (
            <div className="rounded-2xl bg-clay-600 px-4 py-3 text-sm text-white">
              <div className="flex items-center gap-2 font-medium">
                <CloudOff size={16} /> {tx("offlineQueuedBanner", lang)}
              </div>
              <p className="mt-1 text-[11px] text-white/70">
                {tx("offlineAutoSend", lang)}
              </p>
            </div>
          )}

          {/* ── Single submit button ── */}
          {!done && (
            <>
              {/* Missing fields hint — only shown if user hasn't filled required fields */}
              {!formReady && (
                <div className="rounded-xl bg-sand-100 px-3 py-2.5 text-[11px] text-ink/55">
                  <span className="font-medium text-ink/70">{tx("fillBeforeSending", lang)}</span>
                  {missingFields.join(", ")}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!formReady}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                  isEmergency
                    ? "bg-red-500 hover:bg-red-600 shadow-lg"
                    : urgency === "urgent"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-forest-800 hover:bg-forest-700"
                }`}
              >
                {online ? (
                  <>
                    {isEmergency ? <ShieldAlert size={16} /> : <Send size={15} />}
                    {tx("sendToDoctor", lang)}
                  </>
                ) : (
                  <>
                    <CloudOff size={16} />
                    {tx("saveOfflineBtn", lang)}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          {mode === "existing" && selected ? (
            <ExistingPreview
              patient={selected}
              lastNotes={lastVisit?.notes}
              lastAt={lastVisit?.at}
              lastStatus={lastVisit?.status}
              lang={lang}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white/70 p-4 text-sm text-ink/55">
              {tx("newEntryPreview", lang)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ExistingPreview({ patient, lastNotes, lastAt, lastStatus, lang }: {
  patient: Patient; lastNotes?: string; lastAt?: string; lastStatus?: string; lang: Lang;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink/40">{tx("oldEntry", lang)}</p>
          <p className="font-display text-xl text-forest-950">{patient.name}</p>
          <p className="text-xs text-ink/50">{patient.age} {patient.sex} · {patient.village}, {patient.district}</p>
        </div>
        <RiskBadge risk={patient.risk} lang={lang} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-forest-800">ABHA {patient.abhaId}</p>
      <p className="mt-1 text-xs text-ink/50">{patient.phone}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {patient.conditions.map((c) => (
          <span key={c} className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px]">{c}</span>
        ))}
      </div>
      {lastAt ? (
        <p className="mt-3 text-xs text-forest-800">
          {tx("lastVisitLabel", lang)} {new Date(lastAt).toLocaleString("en-IN")}
          {lastStatus ? ` · ${lastStatus}` : ""}
        </p>
      ) : (
        <p className="mt-3 text-xs text-ink/40">{tx("noPriorVisit", lang)}</p>
      )}
      {lastNotes && <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-ink/65">{lastNotes}</p>}
    </div>
  );
}

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
