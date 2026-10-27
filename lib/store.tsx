"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  APPOINTMENTS,
  ASHA,
  CALLS,
  DOCTORS,
  EARNINGS,
  EMERGENCIES,
  FOLLOWUPS,
  LABS,
  PATIENTS,
  PHCS,
  REFERRALS,
  SMS,
  STOCKOUTS,
  VISITS,
} from "./seed";
import type {
  Appointment,
  Attachment,
  CallLog,
  Emergency,
  Earning,
  FollowUp,
  IvrCall,
  LabOrder,
  LabStatus,
  Lang,
  Patient,
  Referral,
  ReferralStatus,
  Sms,
  StockoutReport,
  StockoutStatus,
  Triage,
  Urgency,
  Visit,
  VoiceNote,
} from "./types";

const LANG_KEY = "janarogya-lang-v1";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface Store {
  lang: Lang;
  setLang: (l: Lang) => void;
  loading: boolean;
  error: string | null;
  patients: Patient[];
  visits: Visit[];
  followUps: FollowUp[];
  emergencies: Emergency[];
  referrals: Referral[];
  labs: LabOrder[];
  stockouts: StockoutReport[];
  earnings: Earning[];
  appointments: Appointment[];
  sms: Sms[];
  calls: CallLog[];
  ivrCalls: IvrCall[];
  addPatient: (p: Omit<Patient, "id" | "abhaId" | "ashaId">) => Patient;
  addVisit: (v: Omit<Visit, "id" | "ashaId" | "status" | "triage">) => Visit;
  addVoiceToVisit: (visitId: string, note: Omit<VoiceNote, "id">) => void;
  addAttachmentToVisit: (visitId: string, att: Omit<Attachment, "id">) => void;
  submitVisit: (visitId: string) => void;
  markVisitOffline: (visitId: string) => void;
  setVisitUrgency: (visitId: string, urgency: Urgency) => void;
  reviewVisit: (visitId: string, triage: Triage, advice: string, doctorId: string) => void;
  createReferral: (r: Omit<Referral, "id" | "at" | "status">) => Referral;
  setReferralStatus: (id: string, status: ReferralStatus, outcome?: string) => void;
  orderLab: (l: Omit<LabOrder, "id" | "status" | "orderedAt">) => LabOrder;
  setLabStatus: (id: string, status: LabStatus, result?: string) => void;
  reportStockout: (s: Omit<StockoutReport, "id" | "at" | "status">) => StockoutReport;
  setStockoutStatus: (id: string, status: StockoutStatus) => void;
  raiseEmergency: (e: Omit<Emergency, "id" | "at" | "status">) => Emergency;
  closeEmergency: (id: string) => void;
  acknowledgeEmergency: (id: string) => void;
  escalateEmergency: (id: string) => void;
  markFollowUpDone: (id: string) => void;
  addFollowUp: (f: Omit<FollowUp, "id" | "done">) => void;
  markCareDone: (patientId: string, careId: string) => void;
  bookAppointment: (a: Omit<Appointment, "id" | "status">) => Appointment;
  cancelAppointment: (id: string) => void;
  pushSms: (s: Omit<Sms, "id" | "at">) => Sms;
  addCall: (c: Omit<CallLog, "id">) => CallLog;
  updateCall: (id: string, patch: Partial<CallLog>) => void;
  scheduleIvrCall: (c: Omit<IvrCall, "id" | "status" | "scheduledFor">) => IvrCall;
  updateIvrCall: (id: string, patch: Partial<IvrCall>) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>("mr");

  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [visits, setVisits] = useState<Visit[]>(VISITS);
  const [followUps, setFollowUps] = useState<FollowUp[]>(FOLLOWUPS);
  const [emergencies, setEmergencies] = useState<Emergency[]>(EMERGENCIES);
  const [referrals, setReferrals] = useState<Referral[]>(REFERRALS);
  const [labs, setLabs] = useState<LabOrder[]>(LABS);
  const [stockouts, setStockouts] = useState<StockoutReport[]>(STOCKOUTS);
  const [earnings, setEarnings] = useState<Earning[]>(EARNINGS);
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [sms, setSms] = useState<Sms[]>(SMS);
  const [calls, setCalls] = useState<CallLog[]>(CALLS);
  const [ivrCalls, setIvrCalls] = useState<IvrCall[]>([]);

  // Load language preference from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
      if (savedLang) setLangState(savedLang);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_KEY, l);
    }
  }, []);

  // Hydrate from MongoDB server via /api/sync
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/sync");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.success) {
          if (data.patients?.length) setPatients(data.patients);
          if (data.visits?.length) setVisits(data.visits);
          if (data.followUps?.length) setFollowUps(data.followUps);
          if (data.emergencies?.length) setEmergencies(data.emergencies);
          if (data.referrals?.length) setReferrals(data.referrals);
          if (data.labs?.length) setLabs(data.labs);
          if (data.stockouts?.length) setStockouts(data.stockouts);
          if (data.earnings?.length) setEarnings(data.earnings);
          if (data.appointments?.length) setAppointments(data.appointments);
          if (data.sms?.length) setSms(data.sms);
          if (data.calls?.length) setCalls(data.calls);
          if (data.ivrCalls?.length) setIvrCalls(data.ivrCalls);
        }
        setError(null);
      } catch (err: any) {
        console.warn("[store] Could not connect to MongoDB server, using local seed fallback:", err.message);
        setError("Connected to local backup store. Server sync pending.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     PATIENTS
  ───────────────────────────────────────────────────────────── */
  const addPatient = useCallback((p: Omit<Patient, "id" | "abhaId" | "ashaId">) => {
    const patient: Patient = {
      ...p,
      id: uid("p"),
      ashaId: ASHA.id,
      abhaId: `12-3456-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPatients((prev) => [patient, ...prev]);

    fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    }).catch((err) => console.error("[store] addPatient sync error:", err));

    return patient;
  }, []);

  const markCareDone = useCallback((patientId: string, careId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, carePlan: (p.carePlan ?? []).map((c) => (c.id === careId ? { ...c, done: true } : c)) }
          : p
      )
    );

    fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markCareDone", careId }),
    }).catch((err) => console.error("[store] markCareDone sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     VISITS
  ───────────────────────────────────────────────────────────── */
  const addVisit = useCallback((v: Omit<Visit, "id" | "ashaId" | "status" | "triage">) => {
    const visit: Visit = {
      ...v,
      id: uid("v"),
      ashaId: ASHA.id,
      status: "draft",
      triage: "pending",
    };
    setVisits((prev) => [visit, ...prev]);

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visit),
    }).catch((err) => console.error("[store] addVisit sync error:", err));

    return visit;
  }, []);

  const addVoiceToVisit = useCallback((visitId: string, note: Omit<VoiceNote, "id">) => {
    const vn = { ...note, id: uid("vn") };
    setVisits((prev) =>
      prev.map((x) => (x.id === visitId ? { ...x, voiceNotes: [...x.voiceNotes, vn] } : x))
    );

    fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addVoice", note: vn }),
    }).catch((err) => console.error("[store] addVoice sync error:", err));
  }, []);

  const addAttachmentToVisit = useCallback((visitId: string, att: Omit<Attachment, "id">) => {
    const attachment = { ...att, id: uid("att") };
    setVisits((prev) =>
      prev.map((x) => (x.id === visitId ? { ...x, attachments: [...x.attachments, attachment] } : x))
    );

    fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addAttachment", attachment }),
    }).catch((err) => console.error("[store] addAttachment sync error:", err));
  }, []);

  const submitVisit = useCallback((visitId: string) => {
    setVisits((prev) =>
      prev.map((x) =>
        x.id === visitId
          ? { ...x, status: "submitted", submittedAt: new Date().toISOString(), offlineQueued: false }
          : x
      )
    );

    fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    }).catch((err) => console.error("[store] submitVisit sync error:", err));
  }, []);

  const markVisitOffline = useCallback((visitId: string) => {
    setVisits((prev) => prev.map((x) => (x.id === visitId ? { ...x, offlineQueued: true } : x)));

    fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markOffline" }),
    }).catch((err) => console.error("[store] markOffline sync error:", err));
  }, []);

  const setVisitUrgency = useCallback((visitId: string, urgency: Urgency) => {
    setVisits((prev) => prev.map((x) => (x.id === visitId ? { ...x, urgency } : x)));

    fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setUrgency", urgency }),
    }).catch((err) => console.error("[store] setUrgency sync error:", err));
  }, []);

  const reviewVisit = useCallback(
    (visitId: string, triage: Triage, advice: string, doctorId: string) => {
      setVisits((prev) =>
        prev.map((x) =>
          x.id === visitId
            ? {
                ...x,
                triage,
                doctorAdvice: advice,
                doctorId,
                reviewedAt: new Date().toISOString(),
                status: triage === "refer_dh" ? "referred" : "reviewed",
              }
            : x
        )
      );

      const visit = visits.find((x) => x.id === visitId);
      if (visit && advice) {
        setFollowUps((prev) => [
          {
            id: uid("f"),
            patientId: visit.patientId,
            visitId,
            from: "doctor",
            message: advice,
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
            done: false,
          },
          ...prev,
        ]);
      }

      if (triage === "emergency" && visit) {
        setEmergencies((prev) => [
          {
            id: uid("e"),
            patientId: visit.patientId,
            visitId,
            raisedBy: "doctor",
            reason: advice || "Doctor marked emergency",
            status: "escalated",
            at: new Date().toISOString(),
            destination: "Rural Hospital / 108",
          },
          ...prev,
        ]);
      }

      fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", triage, advice, doctorId }),
      }).catch((err) => console.error("[store] reviewVisit sync error:", err));
    },
    [visits]
  );

  /* ─────────────────────────────────────────────────────────────
     REFERRALS
  ───────────────────────────────────────────────────────────── */
  const createReferral = useCallback((r: Omit<Referral, "id" | "at" | "status">) => {
    const ref: Referral = { ...r, id: uid("ref"), at: new Date().toISOString(), status: "referred" };
    setReferrals((prev) => [ref, ...prev]);

    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ref),
    }).catch((err) => console.error("[store] createReferral sync error:", err));

    return ref;
  }, []);

  const setReferralStatus = useCallback(
    (id: string, status: ReferralStatus, outcome?: string) => {
      setReferrals((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                status,
                outcome: outcome ?? x.outcome,
                reachedAt: status === "reached" && !x.reachedAt ? new Date().toISOString() : x.reachedAt,
              }
            : x
        )
      );

      if (status === "lost") {
        const ref = referrals.find((x) => x.id === id);
        if (ref) {
          setFollowUps((prev) => [
            {
              id: uid("f"),
              patientId: ref.patientId,
              visitId: ref.visitId ?? "",
              from: "phc",
              message: "Referral not reached — visit home, counsel family, arrange travel & re-refer.",
              dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              done: false,
            },
            ...prev,
          ]);
        }
      }

      fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, outcome }),
      }).catch((err) => console.error("[store] setReferralStatus sync error:", err));
    },
    [referrals]
  );

  /* ─────────────────────────────────────────────────────────────
     LABS
  ───────────────────────────────────────────────────────────── */
  const orderLab = useCallback((l: Omit<LabOrder, "id" | "status" | "orderedAt">) => {
    const lab: LabOrder = { ...l, id: uid("lab"), status: "ordered", orderedAt: new Date().toISOString() };
    setLabs((prev) => [lab, ...prev]);

    fetch("/api/labs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lab),
    }).catch((err) => console.error("[store] orderLab sync error:", err));

    return lab;
  }, []);

  const setLabStatus = useCallback((id: string, status: LabStatus, result?: string) => {
    setLabs((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              result: result ?? x.result,
              resultAt: status === "result_ready" ? new Date().toISOString() : x.resultAt,
            }
          : x
      )
    );

    fetch(`/api/labs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, result }),
    }).catch((err) => console.error("[store] setLabStatus sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     STOCKOUTS
  ───────────────────────────────────────────────────────────── */
  const reportStockout = useCallback((s: Omit<StockoutReport, "id" | "at" | "status">) => {
    const rep: StockoutReport = { ...s, id: uid("st"), at: new Date().toISOString(), status: "reported" };
    setStockouts((prev) => [rep, ...prev]);

    fetch("/api/stockouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rep),
    }).catch((err) => console.error("[store] reportStockout sync error:", err));

    return rep;
  }, []);

  const setStockoutStatus = useCallback((id: string, status: StockoutStatus) => {
    setStockouts((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));

    fetch(`/api/stockouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error("[store] setStockoutStatus sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     EMERGENCIES
  ───────────────────────────────────────────────────────────── */
  const raiseEmergency = useCallback((e: Omit<Emergency, "id" | "at" | "status">) => {
    const em: Emergency = { ...e, id: uid("e"), at: new Date().toISOString(), status: "open" };
    setEmergencies((prev) => [em, ...prev]);

    fetch("/api/emergencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(em),
    }).catch((err) => console.error("[store] raiseEmergency sync error:", err));

    return em;
  }, []);

  const closeEmergency = useCallback((id: string) => {
    setEmergencies((prev) => prev.map((x) => (x.id === id ? { ...x, status: "closed" } : x)));

    fetch(`/api/emergencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    }).catch((err) => console.error("[store] closeEmergency sync error:", err));
  }, []);

  const acknowledgeEmergency = useCallback((id: string) => {
    const now = new Date().toISOString();
    setEmergencies((prev) => prev.map((x) => (x.id === id ? { ...x, acknowledgedAt: now } : x)));

    fetch(`/api/emergencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge" }),
    }).catch((err) => console.error("[store] acknowledgeEmergency sync error:", err));
  }, []);

  const escalateEmergency = useCallback((id: string) => {
    const now = new Date().toISOString();
    setEmergencies((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "escalated", escalatedAt: now } : x))
    );

    fetch(`/api/emergencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "escalate" }),
    }).catch((err) => console.error("[store] escalateEmergency sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     FOLLOW-UPS
  ───────────────────────────────────────────────────────────── */
  const markFollowUpDone = useCallback((id: string) => {
    setFollowUps((prev) => prev.map((x) => (x.id === id ? { ...x, done: true } : x)));

    fetch(`/api/followups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markDone", done: true }),
    }).catch((err) => console.error("[store] markFollowUpDone sync error:", err));
  }, []);

  const addFollowUp = useCallback((f: Omit<FollowUp, "id" | "done">) => {
    const fu: FollowUp = { ...f, id: uid("f"), done: false };
    setFollowUps((prev) => [fu, ...prev]);

    fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fu),
    }).catch((err) => console.error("[store] addFollowUp sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     APPOINTMENTS
  ───────────────────────────────────────────────────────────── */
  const bookAppointment = useCallback((a: Omit<Appointment, "id" | "status">) => {
    const ap: Appointment = { ...a, id: uid("a"), status: "booked" };
    setAppointments((prev) => [ap, ...prev]);

    fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ap),
    }).catch((err) => console.error("[store] bookAppointment sync error:", err));

    return ap;
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));

    fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    }).catch((err) => console.error("[store] cancelAppointment sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     SMS & CALL LOGS
  ───────────────────────────────────────────────────────────── */
  const pushSms = useCallback((s: Omit<Sms, "id" | "at">) => {
    const msg: Sms = { ...s, id: uid("sms"), at: new Date().toISOString() };
    setSms((prev) => [msg, ...prev]);

    fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    }).catch((err) => console.error("[store] pushSms sync error:", err));

    return msg;
  }, []);

  const addCall = useCallback((c: Omit<CallLog, "id">) => {
    const call: CallLog = { ...c, id: uid("call") };
    setCalls((prev) => [call, ...prev]);

    fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(call),
    }).catch((err) => console.error("[store] addCall sync error:", err));

    return call;
  }, []);

  const updateCall = useCallback((id: string, patch: Partial<CallLog>) => {
    setCalls((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    fetch(`/api/calls/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch((err) => console.error("[store] updateCall sync error:", err));
  }, []);

  /* ─────────────────────────────────────────────────────────────
     IVR CALLS
  ───────────────────────────────────────────────────────────── */
  const scheduleIvrCall = useCallback((c: Omit<IvrCall, "id" | "status" | "scheduledFor">) => {
    const delayMs = c.urgency === "urgent" ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const ivrCall: IvrCall = {
      ...c,
      id: uid("ivr"),
      status: "scheduled",
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    };
    setIvrCalls((prev) => [ivrCall, ...prev]);

    fetch("/api/ivr-calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ivrCall),
    }).catch((err) => console.error("[store] scheduleIvrCall sync error:", err));

    return ivrCall;
  }, []);

  const updateIvrCall = useCallback((id: string, patch: Partial<IvrCall>) => {
    setIvrCalls((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    fetch(`/api/ivr-calls/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch((err) => console.error("[store] updateIvrCall sync error:", err));
  }, []);

  const value = useMemo<Store>(
    () => ({
      lang,
      setLang,
      loading,
      error,
      patients,
      visits,
      followUps,
      emergencies,
      referrals,
      labs,
      stockouts,
      earnings,
      appointments,
      sms,
      calls,
      ivrCalls,
      addPatient,
      addVisit,
      addVoiceToVisit,
      addAttachmentToVisit,
      submitVisit,
      markVisitOffline,
      setVisitUrgency,
      reviewVisit,
      createReferral,
      setReferralStatus,
      orderLab,
      setLabStatus,
      reportStockout,
      setStockoutStatus,
      raiseEmergency,
      closeEmergency,
      acknowledgeEmergency,
      escalateEmergency,
      markFollowUpDone,
      addFollowUp,
      markCareDone,
      bookAppointment,
      cancelAppointment,
      pushSms,
      addCall,
      updateCall,
      scheduleIvrCall,
      updateIvrCall,
    }),
    [
      lang,
      setLang,
      loading,
      error,
      patients,
      visits,
      followUps,
      emergencies,
      referrals,
      labs,
      stockouts,
      earnings,
      appointments,
      sms,
      calls,
      ivrCalls,
      addPatient,
      addVisit,
      addVoiceToVisit,
      addAttachmentToVisit,
      submitVisit,
      markVisitOffline,
      setVisitUrgency,
      reviewVisit,
      createReferral,
      setReferralStatus,
      orderLab,
      setLabStatus,
      reportStockout,
      setStockoutStatus,
      raiseEmergency,
      closeEmergency,
      acknowledgeEmergency,
      escalateEmergency,
      markFollowUpDone,
      addFollowUp,
      markCareDone,
      bookAppointment,
      cancelAppointment,
      pushSms,
      addCall,
      updateCall,
      scheduleIvrCall,
      updateIvrCall,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export { ASHA, DOCTORS, PHCS };
