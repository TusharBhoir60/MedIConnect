export type Lang = "en" | "hi" | "mr";

export type Sex = "F" | "M" | "O";

export type Risk = "routine" | "maternal" | "child" | "chronic" | "emergency";

/** One-tap urgency tag ASHA picks alongside the voice note. */
export type Urgency = "routine" | "urgent" | "emergency";

export type VisitStatus = "draft" | "submitted" | "reviewed" | "referred";

export type Triage = "pending" | "not_emergency" | "emergency" | "refer_dh";

export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";

export type ReferralStatus = "referred" | "reached" | "treated" | "lost";

export type LabStatus = "ordered" | "sample_collected" | "result_ready" | "delivered";

export type StockoutStatus = "reported" | "acknowledged" | "restocked";

export type CareKind = "anc" | "immunisation" | "ncd";

export interface VoiceNote {
  id: string;
  createdAt: string;
  durationSec: number;
  dataUrl?: string;
  transcript: string;
}

export interface Attachment {
  id: string;
  kind: "prescription" | "photo" | "report";
  name: string;
  dataUrl: string;
}

export interface Patient {
  id: string;
  abhaId: string;
  name: string;
  village: string;
  taluka: string;
  district: string;
  age: number;
  sex: Sex;
  phone: string;
  language: Lang;
  risk: Risk;
  conditions: string[];
  ashaId: string;
  /** maternal / child / chronic schedule — ANC, immunisation, NCD checks */
  carePlan?: CareDue[];
}

export interface CareDue {
  id: string;
  kind: CareKind;
  label: string;
  dueDate: string;
  done: boolean;
}

export interface Visit {
  id: string;
  patientId: string;
  ashaId: string;
  at: string;
  place: string;
  notes: string;
  voiceNotes: VoiceNote[];
  attachments: Attachment[];
  status: VisitStatus;
  triage: Triage;
  urgency?: Urgency;
  /** saved on device in low signal — auto-sends when signal returns */
  offlineQueued?: boolean;
  submittedAt?: string;
  doctorAdvice?: string;
  doctorId?: string;
  reviewedAt?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  visitId: string;
  from: "doctor" | "phc";
  message: string;
  dueDate: string;
  done: boolean;
}

export interface Emergency {
  id: string;
  patientId: string;
  visitId?: string;
  raisedBy: "asha" | "doctor" | "patient";
  reason: string;
  status: "open" | "escalated" | "closed";
  at: string;
  destination: string;
  /** SLA ladder: doctor must acknowledge in 10 min */
  acknowledgedAt?: string;
  escalatedAt?: string;
}

/** Referral slip — tracked from PHC to RH/DH till closure. */
export interface Referral {
  id: string;
  patientId: string;
  visitId?: string;
  fromPhcId: string;
  toFacility: string;
  reason: string;
  priority: "urgent" | "routine";
  status: ReferralStatus;
  at: string;
  reachedAt?: string;
  outcome?: string;
  doctorId?: string;
}

/** Lab / diagnostic order coordinated via ASHA. */
export interface LabOrder {
  id: string;
  patientId: string;
  visitId?: string;
  phcId: string;
  test: string;
  status: LabStatus;
  orderedAt: string;
  orderedBy: string;
  resultAt?: string;
  result?: string;
}

/** ASHA reports medicine not available at PHC → PHC & district see it. */
export interface StockoutReport {
  id: string;
  phcId: string;
  medicine: string;
  reportedBy: string;
  patientId?: string;
  note?: string;
  at: string;
  status: StockoutStatus;
}

export interface Earning {
  id: string;
  ashaId: string;
  activity: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "paid";
}

export interface Appointment {
  id: string;
  patientId: string;
  phcId: string;
  doctorId?: string;
  date: string;
  slot: string;
  reason: string;
  status: AppointmentStatus;
  source: "patient" | "asha" | "ai_call";
}

export interface MedicineStock {
  name: string;
  qty: number;
  unit: string;
}

export interface Phc {
  id: string;
  name: string;
  village: string;
  district: string;
  open: string;
  close: string;
  todayOpen: boolean;
  doctorsOnDuty: string[];
  queueMinutes: number;
  medicines: MedicineStock[];
  diagnostics: { name: string; available: boolean }[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phcId: string;
}

export interface Asha {
  id: string;
  name: string;
  phcId: string;
  village: string;
  phone: string;
}

export interface Sms {
  id: string;
  to: string;
  body: string;
  at: string;
  kind: "appointment" | "availability" | "emergency" | "followup" | "referral" | "lab";
}

export interface CallLog {
  id: string;
  patientId: string;
  startedAt: string;
  endedAt?: string;
  outcome: string;
  transcript: { role: "ai" | "user"; text: string }[];
}

export type IvrCallStatus = "scheduled" | "triggered" | "completed" | "failed" | "no_answer";

export type IvrCallType = "followup" | "general";

/**
 * JanVaani outbound call — scheduled after ASHA submits a normal/urgent visit.
 * Emergency visits skip this and go directly to PHC doctor.
 */
export interface IvrCall {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientLang: string;
  visitNotes: string;
  complaint: string;
  urgency?: Urgency;
  type: IvrCallType;
  status: IvrCallStatus;
  scheduledFor: string;
  triggeredAt?: string;
  completedAt?: string;
  patientResponse?: "1" | "2" | "3" | null;
  responseLabel?: string;
  callSid?: string;
  duration?: string;
}
