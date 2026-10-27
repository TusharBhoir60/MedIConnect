import { z } from "zod";

export const PatientSchemaValidator = z.object({
  name: z.string().min(1, "Name is required"),
  village: z.string().min(1, "Village is required"),
  taluka: z.string().default("Armori"),
  district: z.string().default("Gadchiroli"),
  age: z.number().min(0).max(130),
  sex: z.enum(["F", "M", "O"]),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  language: z.enum(["en", "hi", "mr"]).default("mr"),
  risk: z.enum(["routine", "maternal", "child", "chronic", "emergency"]).default("routine"),
  conditions: z.array(z.string()).default([]),
  carePlan: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["anc", "immunisation", "ncd"]),
        label: z.string(),
        dueDate: z.string(),
        done: z.boolean().default(false),
      })
    )
    .optional(),
});

export const VisitSchemaValidator = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  place: z.string().min(1, "Place is required"),
  notes: z.string().default(""),
  voiceNotes: z
    .array(
      z.object({
        id: z.string().optional(),
        createdAt: z.string(),
        durationSec: z.number(),
        dataUrl: z.string().optional(),
        transcript: z.string().default(""),
      })
    )
    .default([]),
  attachments: z
    .array(
      z.object({
        id: z.string().optional(),
        kind: z.enum(["prescription", "photo", "report"]),
        name: z.string(),
        dataUrl: z.string(),
      })
    )
    .default([]),
  urgency: z.enum(["routine", "urgent", "emergency"]).default("routine"),
  offlineQueued: z.boolean().optional(),
});

export const ReferralSchemaValidator = z.object({
  patientId: z.string().min(1),
  visitId: z.string().optional(),
  fromPhcId: z.string().min(1),
  toFacility: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(["urgent", "routine"]).default("routine"),
  doctorId: z.string().optional(),
});

export const EmergencySchemaValidator = z.object({
  patientId: z.string().min(1),
  visitId: z.string().optional(),
  raisedBy: z.enum(["asha", "doctor", "patient"]).default("asha"),
  reason: z.string().min(1),
  destination: z.string().min(1),
});

export const LabOrderSchemaValidator = z.object({
  patientId: z.string().min(1),
  visitId: z.string().optional(),
  phcId: z.string().min(1),
  test: z.string().min(1),
  orderedBy: z.string().min(1),
});

export const StockoutReportSchemaValidator = z.object({
  phcId: z.string().min(1),
  medicine: z.string().min(1),
  reportedBy: z.string().min(1),
  patientId: z.string().optional(),
  note: z.string().optional(),
});

export const AppointmentSchemaValidator = z.object({
  patientId: z.string().min(1),
  phcId: z.string().min(1),
  doctorId: z.string().optional(),
  date: z.string().min(1),
  slot: z.string().min(1),
  reason: z.string().min(1),
  source: z.enum(["patient", "asha", "ai_call"]).default("patient"),
});

