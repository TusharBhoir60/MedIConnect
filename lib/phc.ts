import { PHCS } from "./seed";
import type { Phc } from "./types";

export function getPhc(id: string): Phc {
  return PHCS.find((p) => p.id === id) ?? PHCS[0];
}

export function slotsForDay(date: string) {
  const d = new Date(date + "T12:00:00");
  const sunday = d.getDay() === 0;
  if (sunday) return [] as string[];
  return ["08:30–08:50", "09:00–09:20", "09:30–09:50", "10:00–10:20", "11:00–11:20", "14:00–14:20"];
}

export function answerAvailability(query: string, phc: Phc): string {
  const q = query.toLowerCase();
  if (q.includes("x-ray") || q.includes("एक्स") || q.includes("एक्सरे")) {
    const ok = phc.diagnostics.find((d) => d.name.toLowerCase().includes("x-ray"))?.available;
    return ok
      ? `${phc.name} वर आज एक्स-रे उपलब्ध आहे.`
      : `${phc.name} वर एक्स-रे नाही. Rural Hospital Gadchiroli कडे रेफर करा. सकाळी ८ ते दुपारी ४.`;
  }
  if (q.includes("doctor") || q.includes("डॉक्टर") || q.includes("vaidya") || q.includes("उपलब्ध")) {
    if (!phc.todayOpen) return `${phc.name} आज बंद आहे. उद्या ${phc.open} वाजता उघडेल.`;
    return `हो, ${phc.name} आज ${phc.open} ते ${phc.close} उघडे आहे. दोन डॉक्टर ड्यूटीवर. प्रतीक्षा सुमारे ${phc.queueMinutes} मिनिटे.`;
  }
  if (q.includes("medicine") || q.includes("दवा") || q.includes("गोळी") || q.includes("amox") || q.includes("ifa") || q.includes("insulin")) {
    const miss = phc.medicines.filter((m) => m.qty === 0).map((m) => m.name);
    const low = phc.medicines.filter((m) => m.qty > 0 && m.qty < 20);
    let s = `${phc.name} औषध स्थिती: `;
    if (miss.length) s += `${miss.join(", ")} संपले. `;
    if (low.length) s += `${low.map((m) => m.name + " कमी").join(", ")}. `;
    s += "IFA, ORS, Metformin उपलब्ध.";
    return s;
  }
  if (q.includes("appoint") || q.includes("slot") || q.includes("भेट") || q.includes("टाइम")) {
    return `${phc.name} उद्या सकाळी ९:००, ९:३०, १०:०० स्लॉट मोकळे आहेत. कॉलवर बुक करू किंवा अॅपवर कन्फर्म करा.`;
  }
  if (q.includes("open") || q.includes("उघड") || q.includes("time") || q.includes("वेळ")) {
    return `${phc.name} ${phc.open} ते ${phc.close}. रविवारी OPD बंद, आपत्कालीन १०८.`;
  }
  return `${phc.name} आज ${phc.todayOpen ? "उघडे" : "बंद"} — ${phc.open}–${phc.close}. प्रतीक्षा ~${phc.queueMinutes} मिनिटे. डॉक्टर, औषध, अपॉइंटमेंट किंवा एक्स-रे विचारा.`;
}
