/**
 * In-memory store for IVR call state.
 * Maps CallSid → appointment details chosen during the IVR.
 * Used to send SMS after the call ends (StatusCallback).
 *
 * Note: This is process-local memory. Works fine for single-instance
 * deployments (local dev, single Vercel function). For multi-instance
 * production, swap with Redis or a DB.
 */

export interface AppointmentInfo {
  patientPhone : string;
  name         : string;
  lang         : string;
  sex          : string;
  slotLabel    : string;   // e.g. "9:00 AM – 10:00 AM"
  date         : string;   // DD/MM/YYYY
  bookedAt     : number;   // Date.now()
}

// callSid → appointment info
const store = new Map<string, AppointmentInfo>();

export function saveAppointment(callSid: string, info: AppointmentInfo): void {
  store.set(callSid, info);
  console.log(`[ivrStore] saved appointment for callSid: ${callSid}`);
}

export function getAppointment(callSid: string): AppointmentInfo | undefined {
  return store.get(callSid);
}

export function deleteAppointment(callSid: string): void {
  store.delete(callSid);
}
