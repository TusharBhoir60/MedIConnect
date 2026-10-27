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
  IvrCallStatus,
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

const KEY = "janarogya-v3";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface Store {
  lang: Lang;
  setLang: (l: Lang) => void;
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
  ivrCalls: IvrCall[];
  scheduleIvrCall: (c: Omit<IvrCall, "id" | "status" | "scheduledFor">) => IvrCall;
  updateIvrCall: (id: string, patch: Partial<IvrCall>) => void;
}

const Ctx = createContext<Store | null>(null);

type Persist = {
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
  lang: Lang;
};

function load(): Persist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persist;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<Lang>("mr");
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

  useEffect(() => {
    const saved = load();
    if (saved) {
      setPatients(saved.patients);
      setVisits(saved.visits);
      setFollowUps(saved.followUps);
      setEmergencies(saved.emergencies);
      setReferrals(saved.referrals);
      setLabs(saved.labs);
      setStockouts(saved.stockouts);
      setEarnings(saved.earnings);
      setAppointments(saved.appointments);
      setSms(saved.sms);
      setCalls(saved.calls);
      if (saved.ivrCalls) setIvrCalls(saved.ivrCalls);
      setLang(saved.lang);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data: Persist = {
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
      lang,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [hydrated, patients, visits, followUps, emergencies, referrals, labs, stockouts, earnings, appointments, sms, calls, ivrCalls, lang]);

  const addPatient = useCallback((p: Omit<Patient, "id" | "abhaId" | "ashaId">) => {
    const patient: Patient = {
      ...p,
      id: uid("p"),
      ashaId: ASHA.id,
      abhaId: `12-3456-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPatients((prev) => [patient, ...prev]);
    return patient;
  }, []);

  const addVisit = useCallback((v: Omit<Visit, "id" | "ashaId" | "status" | "triage">) => {
    const visit: Visit = {
      ...v,
      id: uid("v"),
      ashaId: ASHA.id,
      status: "draft",
      triage: "pending",
    };
    setVisits((prev) => [visit, ...prev]);
    return visit;
  }, []);

  const addVoiceToVisit = useCallback((visitId: string, note: Omit<VoiceNote, "id">) => {
    setVisits((prev) =>
      prev.map((x) => (x.id === visitId ? { ...x, voiceNotes: [...x.voiceNotes, { ...note, id: uid("vn") }] } : x)),
    );
  }, []);

  const addAttachmentToVisit = useCallback((visitId: string, att: Omit<Attachment, "id">) => {
    setVisits((prev) =>
      prev.map((x) => (x.id === visitId ? { ...x, attachments: [...x.attachments, { ...att, id: uid("att") }] } : x)),
    );
  }, []);

  const submitVisit = useCallback((visitId: string) => {
    setVisits((prev) =>
      prev.map((x) =>
        x.id === visitId
          ? { ...x, status: "submitted", submittedAt: new Date().toISOString(), offlineQueued: false }
          : x,
      ),
    );
  }, []);

  const markVisitOffline = useCallback((visitId: string) => {
    setVisits((prev) => prev.map((x) => (x.id === visitId ? { ...x, offlineQueued: true } : x)));
  }, []);

  const setVisitUrgency = useCallback((visitId: string, urgency: Urgency) => {
    setVisits((prev) => prev.map((x) => (x.id === visitId ? { ...x, urgency } : x)));
  }, []);

  const reviewVisit = useCallback((visitId: string, triage: Triage, advice: string, doctorId: string) => {
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
          : x,
      ),
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
    if (triage === "emergency") {
      const v = visits.find((x) => x.id === visitId);
      if (v) {
        setEmergencies((prev) => [
          {
            id: uid("e"),
            patientId: v.patientId,
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
    }
  }, [visits]);

  const createReferral = useCallback((r: Omit<Referral, "id" | "at" | "status">) => {
    const ref: Referral = { ...r, id: uid("ref"), at: new Date().toISOString(), status: "referred" };
    setReferrals((prev) => [ref, ...prev]);
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
            : x,
        ),
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
    },
    [referrals],
  );

  const orderLab = useCallback((l: Omit<LabOrder, "id" | "status" | "orderedAt">) => {
    const lab: LabOrder = { ...l, id: uid("lab"), status: "ordered", orderedAt: new Date().toISOString() };
    setLabs((prev) => [lab, ...prev]);
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
          : x,
      ),
    );
  }, []);

  const reportStockout = useCallback((s: Omit<StockoutReport, "id" | "at" | "status">) => {
    const rep: StockoutReport = { ...s, id: uid("st"), at: new Date().toISOString(), status: "reported" };
    setStockouts((prev) => [rep, ...prev]);
    return rep;
  }, []);

  const setStockoutStatus = useCallback((id: string, status: StockoutStatus) => {
    setStockouts((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  }, []);

  const raiseEmergency = useCallback((e: Omit<Emergency, "id" | "at" | "status">) => {
    const em: Emergency = { ...e, id: uid("e"), at: new Date().toISOString(), status: "open" };
    setEmergencies((prev) => [em, ...prev]);
    return em;
  }, []);

  const closeEmergency = useCallback((id: string) => {
    setEmergencies((prev) => prev.map((x) => (x.id === id ? { ...x, status: "closed" } : x)));
  }, []);

  const acknowledgeEmergency = useCallback((id: string) => {
    setEmergencies((prev) => prev.map((x) => (x.id === id ? { ...x, acknowledgedAt: new Date().toISOString() } : x)));
  }, []);

  const escalateEmergency = useCallback((id: string) => {
    setEmergencies((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "escalated", escalatedAt: new Date().toISOString() } : x)),
    );
  }, []);

  const markFollowUpDone = useCallback((id: string) => {
    setFollowUps((prev) => prev.map((x) => (x.id === id ? { ...x, done: true } : x)));
  }, []);

  const addFollowUp = useCallback((f: Omit<FollowUp, "id" | "done">) => {
    setFollowUps((prev) => [{ ...f, id: uid("f"), done: false }, ...prev]);
  }, []);

  const markCareDone = useCallback((patientId: string, careId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, carePlan: (p.carePlan ?? []).map((c) => (c.id === careId ? { ...c, done: true } : c)) }
          : p,
      ),
    );
  }, []);

  const bookAppointment = useCallback((a: Omit<Appointment, "id" | "status">) => {
    const ap: Appointment = { ...a, id: uid("a"), status: "booked" };
    setAppointments((prev) => [ap, ...prev]);
    return ap;
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
  }, []);

  const pushSms = useCallback((s: Omit<Sms, "id" | "at">) => {
    const msg: Sms = { ...s, id: uid("sms"), at: new Date().toISOString() };
    setSms((prev) => [msg, ...prev]);
    return msg;
  }, []);

  const addCall = useCallback((c: Omit<CallLog, "id">) => {
    const call: CallLog = { ...c, id: uid("call") };
    setCalls((prev) => [call, ...prev]);
    return call;
  }, []);

  const updateCall = useCallback((id: string, patch: Partial<CallLog>) => {
    setCalls((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const scheduleIvrCall = useCallback((c: Omit<IvrCall, "id" | "status" | "scheduledFor">) => {
    // urgent → 6h, routine → 24h
    const delayMs = c.urgency === "urgent" ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const ivrCall: IvrCall = {
      ...c,
      id: uid("ivr"),
      status: "scheduled",
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    };
    setIvrCalls((prev) => [ivrCall, ...prev]);
    return ivrCall;
  }, []);

  const updateIvrCall = useCallback((id: string, patch: Partial<IvrCall>) => {
    setIvrCalls((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const value = useMemo<Store>(
    () => ({
      lang,
      setLang,
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
      ivrCalls,
      scheduleIvrCall,
      updateIvrCall,
    }),
    [
      lang,
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export { ASHA, DOCTORS, PHCS };
