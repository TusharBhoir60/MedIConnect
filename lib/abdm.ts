/**
 * lib/abdm.ts
 *
 * ABDM / ABHA patient record lookup.
 *
 * In production this calls the ABDM Health ID API:
 *   POST https://healthidsbx.abdm.gov.in/api/v1/search/searchByHealthId
 * and pulls the patient's FHIR R4 health records via the ABHA-linked HIU gateway.
 *
 * A ~1-second network delay is simulated; rich structured health history is
 * returned for known ABHA IDs.
 */

export interface AbdmVisitRecord {
  date: string;
  facility: string;
  facilityType: "Sub-centre" | "PHC" | "Rural Hospital" | "District Hospital";
  doctor: string;
  complaint: string;
  diagnosis: string;
  prescription: string[];
  labOrdered?: string;
  labResult?: string;
  followUpDate?: string;
}

export interface AbdmPatientRecord {
  abhaId: string;
  name: string;
  age: number;
  sex: "F" | "M" | "O";
  dob: string;
  bloodGroup: string;
  phone: string;
  village: string;
  district: string;
  language: "mr" | "hi" | "en";
  risk: "routine" | "maternal" | "child" | "chronic" | "emergency";
  activeConditions: string[];
  currentMedications: { name: string; dose: string; since: string }[];
  allergies: string[];
  /** Cross-facility longitudinal visit history — newest first */
  visitHistory: AbdmVisitRecord[];
  /** Pending follow-ups or care plan items */
  pendingCare: { label: string; dueDate: string; kind: "anc" | "immunisation" | "ncd" | "general" }[];
  ashaName: string;
  ashaPhone: string;
  fhirId: string;
  lastSyncedAt: string;
}

/* ─── Mock database ────────────────────────────────────────────────────────── */

const MOCK_DB: Record<string, AbdmPatientRecord> = {

  /* ── P-1  Kavita Meshram · maternal · 32-week ANC ── */
  "14-2201-8834-5501": {
    abhaId:     "14-2201-8834-5501",
    name:       "Kavita Meshram",
    age:        24,
    sex:        "F",
    dob:        "2002-04-18",
    bloodGroup: "A+",
    phone:      "9011223344",
    village:    "Armori",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "maternal",
    activeConditions: [
      "ANC · 32 weeks",
      "Mild anaemia (Hb 9.6 g/dL)",
      "Bilateral foot oedema",
    ],
    currentMedications: [
      { name: "Iron + Folic Acid (IFA)",  dose: "1 tab OD",  since: "2026-06-15" },
      { name: "Calcium 500mg",            dose: "1 tab BD",  since: "2026-06-15" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-03",
        facility:     "Home Visit · Armori (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "32-week ANC check. BP slightly high, feet swollen, mild headache.",
        diagnosis:    "BP 128/82. Foot oedema +. IFA stock 5 days. Urgent PHC review advised.",
        prescription: ["Continue IFA", "Increase water intake", "Rest feet elevated"],
        followUpDate: "2026-09-05",
      },
      {
        date:         "2026-08-10",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Rahul Kulkarni",
        complaint:    "28-week ANC check",
        diagnosis:    "Hb 9.6 g/dL — mild anaemia. BP 118/76. USG normal. No oedema.",
        prescription: ["IFA 1 OD × 90 days", "Calcium 500 BD × 90 days"],
        labOrdered:   "Hb, urine routine",
        labResult:    "Hb 9.6 · urine normal",
        followUpDate: "2026-09-05",
      },
      {
        date:         "2026-06-15",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "First ANC registration — 14 weeks. LMP 2026-03-07.",
        diagnosis:    "ANC registered. Fit. Hb 11.2 g/dL. BP normal.",
        prescription: ["IFA start", "Calcium start", "TT dose 1"],
        labOrdered:   "Blood group, Hb, HIV, VDRL, urine",
        labResult:    "A+, Hb 11.2, HIV –, VDRL –, urine normal",
        followUpDate: "2026-08-10",
      },
    ],
    pendingCare: [
      { label: "ANC check + Hb at PHC",  dueDate: "2026-09-05", kind: "anc" },
      { label: "TT booster dose 2",       dueDate: "2026-09-05", kind: "anc" },
      { label: "IFA + Calcium refill",    dueDate: "2026-09-03", kind: "anc" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/kavita-meshram-abdm-001",
    lastSyncedAt: "2026-09-03T07:52:00",
  },

  /* ── P-2  Dilip Atram · chronic · DM + HTN + CKD ── */
  "14-2201-8834-5502": {
    abhaId:     "14-2201-8834-5502",
    name:       "Dilip Atram",
    age:        61,
    sex:        "M",
    dob:        "1965-07-22",
    bloodGroup: "B+",
    phone:      "9022334455",
    village:    "Wadsa",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "chronic",
    activeConditions: [
      "Type 2 diabetes (HbA1c 8.4%)",
      "Hypertension (BP 152/94)",
      "CKD stage 2 (eGFR 42)",
    ],
    currentMedications: [
      { name: "Metformin 500mg",   dose: "1 tab BD",  since: "2024-03-10" },
      { name: "Amlodipine 5mg",    dose: "1 tab OD",  since: "2025-01-20" },
      { name: "Aspirin 75mg",      dose: "1 tab OD",  since: "2025-01-20" },
      { name: "Telmisartan 40mg",  dose: "1 tab OD",  since: "2026-08-25" },
    ],
    allergies: ["Penicillin"],
    visitHistory: [
      {
        date:         "2026-09-01",
        facility:     "Home Visit · Wadsa (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "BP high — 152/94. Missed Amlodipine 2 days. Metformin stock low.",
        diagnosis:    "BP elevated due to missed medication. Restock Metformin. PHC recheck 4 Sep.",
        prescription: ["Resume Amlodipine immediately", "Restock Metformin at PHC"],
        followUpDate: "2026-09-04",
      },
      {
        date:         "2026-08-25",
        facility:     "District Hospital Gadchiroli",
        facilityType: "District Hospital",
        doctor:       "Dr. P. Shende (Nephrology)",
        complaint:    "CKD review — referred from PHC",
        diagnosis:    "CKD stage 2. Creatinine 1.8 mg/dL, eGFR 42. No dialysis needed yet.",
        prescription: ["Low-protein diet", "Telmisartan 40mg OD added", "Avoid NSAIDs"],
        labOrdered:   "Creatinine, eGFR, urine protein",
        labResult:    "Creatinine 1.8 mg/dL, eGFR 42, urine protein 1+",
        followUpDate: "2026-10-06",
      },
      {
        date:         "2026-07-10",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "3-month NCD review — sugar, BP",
        diagnosis:    "HbA1c 8.4% — poorly controlled. BP 146/90. Referred to DH for nephrology.",
        prescription: ["Metformin continued", "Amlodipine dose continued", "Aspirin OD"],
        labOrdered:   "HbA1c, FBS, creatinine",
        labResult:    "HbA1c 8.4%, FBS 172, creatinine 1.8",
        followUpDate: "2026-08-25",
      },
    ],
    pendingCare: [
      { label: "BP check + creatinine test", dueDate: "2026-09-04", kind: "ncd" },
      { label: "Fasting sugar at PHC",        dueDate: "2026-09-04", kind: "ncd" },
      { label: "Nephrology review DH",        dueDate: "2026-10-06", kind: "general" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/dilip-atram-abdm-002",
    lastSyncedAt: "2026-09-01T09:35:00",
  },

  /* ── P-3  Riya Gota · child · 18 months, fever + immunisation ── */
  "14-2201-8834-5503": {
    abhaId:     "14-2201-8834-5503",
    name:       "Riya Gota",
    age:        1,
    sex:        "F",
    dob:        "2025-03-10",
    bloodGroup: "O+",
    phone:      "9033445566",
    village:    "Armori",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "child",
    activeConditions: [
      "Viral fever (2 days, 100.4°F)",
      "18-month immunisation due",
    ],
    currentMedications: [
      { name: "Paracetamol syrup 250mg/5ml", dose: "5ml TDS PRN fever", since: "2026-09-02" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-02",
        facility:     "Home Visit · Armori (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "Fever 100.4°F for 1 day. Eating slightly less. Malaria-risk area.",
        diagnosis:    "Viral fever likely. Malaria RDT negative. Paracetamol PRN. PHC if no improvement.",
        prescription: ["Paracetamol syrup 5ml TDS PRN", "ORS if loose stools"],
        followUpDate: "2026-09-05",
      },
      {
        date:         "2026-09-02",
        facility:     "Rural Hospital Gadchiroli",
        facilityType: "Rural Hospital",
        doctor:       "Dr. V. Kapse (Paediatrics)",
        complaint:    "Fever — referred from PHC for paediatric OPD",
        diagnosis:    "Viral URTI. Malaria RDT negative. CBC normal. Paracetamol + rest.",
        prescription: ["Paracetamol syrup", "ORS"],
        labOrdered:   "Malaria RDT, CBC",
        labResult:    "Malaria RDT: Negative. CBC: Hb 10.2, WBC normal.",
        followUpDate: "2026-09-05",
      },
      {
        date:         "2026-07-15",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Rahul Kulkarni",
        complaint:    "12-month immunisation",
        diagnosis:    "Healthy. Weight 7.8 kg. Measles given.",
        prescription: ["Vitamin A syrup (1st dose)"],
      },
    ],
    pendingCare: [
      { label: "DPT booster + OPV booster",  dueDate: "2026-09-06", kind: "immunisation" },
      { label: "Vitamin A (2nd dose)",        dueDate: "2026-09-06", kind: "immunisation" },
      { label: "Weight check — fever follow", dueDate: "2026-09-05", kind: "general" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/riya-gota-abdm-003",
    lastSyncedAt: "2026-09-02T13:05:00",
  },

  /* ── P-4  Sanjay Tekam · emergency · suspected stroke ── */
  "14-2201-8834-5504": {
    abhaId:     "14-2201-8834-5504",
    name:       "Sanjay Tekam",
    age:        52,
    sex:        "M",
    dob:        "1974-01-30",
    bloodGroup: "AB+",
    phone:      "9044556677",
    village:    "Armori",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "emergency",
    activeConditions: [
      "Acute facial droop + right arm weakness — onset 6 AM today",
      "Suspected CVA (stroke)",
      "Known hypertensive (on Amlodipine)",
    ],
    currentMedications: [
      { name: "Amlodipine 5mg",  dose: "1 tab OD", since: "2025-06-01" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-03",
        facility:     "Home Visit · Armori (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "Sudden right facial droop, right arm weakness, slurred speech since 6 AM. Wife called for help.",
        diagnosis:    "Suspected acute ischaemic stroke. FAST positive. 108 called. Immediate transfer to RH.",
        prescription: ["108 ambulance dispatched", "Keep patient flat, nothing by mouth"],
      },
      {
        date:         "2026-06-10",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "Routine BP check",
        diagnosis:    "BP 158/96. Added Amlodipine. Advised low-salt diet.",
        prescription: ["Amlodipine 5mg OD", "Low-sodium diet"],
        labOrdered:   "Fasting lipids, ECG",
        labResult:    "LDL 148, ECG: normal sinus rhythm",
        followUpDate: "2026-09-01",
      },
    ],
    pendingCare: [
      { label: "Neurological evaluation at RH/DH", dueDate: "2026-09-03", kind: "general" },
      { label: "CT brain (urgent)",                 dueDate: "2026-09-03", kind: "general" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/sanjay-tekam-abdm-004",
    lastSyncedAt: "2026-09-03T06:33:00",
  },

  /* ── P-5  Anusaya Korde · maternal · first ANC registration ── */
  "14-2201-8834-5505": {
    abhaId:     "14-2201-8834-5505",
    name:       "Anusaya Korde",
    age:        21,
    sex:        "F",
    dob:        "2005-02-14",
    bloodGroup: "O+",
    phone:      "9055667788",
    village:    "Pendhari",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "maternal",
    activeConditions: [
      "ANC · 14 weeks",
      "First pregnancy — primigravida",
    ],
    currentMedications: [
      { name: "Iron + Folic Acid (IFA)",  dose: "1 tab OD",  since: "2026-09-01" },
      { name: "Calcium 500mg",            dose: "1 tab BD",  since: "2026-09-01" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-01",
        facility:     "Sub-centre Pendhari",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "First ANC registration. LMP 2026-05-23. 14 weeks. First pregnancy.",
        diagnosis:    "ANC registered. BP 110/70. Weight 48 kg. General condition good.",
        prescription: ["IFA start", "Calcium start"],
        followUpDate: "2026-09-07",
      },
      {
        date:         "2026-09-01",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Rahul Kulkarni",
        complaint:    "ANC registration at PHC",
        diagnosis:    "Hb 10.6 g/dL — normal. HIV negative. VDRL negative. Blood group O+. Registered.",
        prescription: ["IFA 1 OD", "Calcium 500 BD", "TT dose 1 next visit"],
        labOrdered:   "Blood group, Hb, HIV, VDRL, urine routine",
        labResult:    "O+, Hb 10.6, HIV –, VDRL –, urine normal",
        followUpDate: "2026-09-07",
      },
    ],
    pendingCare: [
      { label: "TT dose 1",                        dueDate: "2026-09-07", kind: "anc" },
      { label: "Lab report collection at PHC",     dueDate: "2026-09-07", kind: "anc" },
      { label: "Next ANC check (18 weeks)",         dueDate: "2026-10-10", kind: "anc" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/anusaya-korde-abdm-005",
    lastSyncedAt: "2026-09-02T10:00:00",
  },

  /* ── P-6  Mohan Madavi · routine · TB DOTS 3rd month ── */
  "14-2201-8834-5506": {
    abhaId:     "14-2201-8834-5506",
    name:       "Mohan Madavi",
    age:        38,
    sex:        "M",
    dob:        "1988-09-05",
    bloodGroup: "B+",
    phone:      "9066778899",
    village:    "Armori",
    district:   "Gadchiroli",
    language:   "hi",
    risk:       "routine",
    activeConditions: [
      "Pulmonary TB — on DOTS (3rd month of 6)",
      "Weight gain monitoring",
    ],
    currentMedications: [
      { name: "DOTS Category I (2HRZE / 4HR)", dose: "Daily directly observed", since: "2026-06-05" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-02",
        facility:     "Home Visit · Armori (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "DOTS daily observation — dose given.",
        diagnosis:    "Month 3 DOTS. Cough much improved. Weight 54 kg (up 2 kg). No ADR.",
        prescription: ["Continue DOTS daily"],
        followUpDate: "2026-09-10",
      },
      {
        date:         "2026-08-05",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "2-month sputum smear follow-up",
        diagnosis:    "Sputum smear negative at 2 months — good response. Weight 52 kg.",
        prescription: ["Continue DOTS", "High-protein diet"],
        labOrdered:   "Sputum smear (2 months)",
        labResult:    "AFB negative × 2 samples",
        followUpDate: "2026-09-10",
      },
      {
        date:         "2026-06-05",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "Cough 3 weeks, weight loss, night sweats.",
        diagnosis:    "Sputum smear positive × 2. Pulmonary TB confirmed. DOTS started.",
        prescription: ["DOTS Category I initiated"],
        labOrdered:   "Sputum AFB × 2, CXR",
        labResult:    "AFB 2+, CXR: right upper lobe cavitation",
      },
    ],
    pendingCare: [
      { label: "DOTS dose observation (daily)", dueDate: "2026-09-03", kind: "ncd" },
      { label: "Weight check at PHC",           dueDate: "2026-09-10", kind: "ncd" },
      { label: "Sputum smear at 4 months",      dueDate: "2026-10-05", kind: "ncd" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/mohan-madavi-abdm-006",
    lastSyncedAt: "2026-09-02T07:40:00",
  },

  /* ── P-7  Tara Uikey · child · SAM ── */
  "14-2201-8834-5507": {
    abhaId:     "14-2201-8834-5507",
    name:       "Tara Uikey",
    age:        2,
    sex:        "F",
    dob:        "2024-06-18",
    bloodGroup: "A+",
    phone:      "9077889900",
    village:    "Wadsa",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "child",
    activeConditions: [
      "Severe Acute Malnutrition — W/H < −3 SD",
      "MUAC 10.8 cm (red zone)",
      "Measles vaccine due",
    ],
    currentMedications: [
      { name: "RUTF (Ready-to-Use Therapeutic Food)", dose: "3 sachets per day",  since: "2026-09-04" },
      { name: "Amoxicillin syrup 125mg/5ml",          dose: "5ml BD × 7 days",   since: "2026-09-01" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-01",
        facility:     "Home Visit · Wadsa (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "Poor weight gain. Family reports poor appetite for 2 months.",
        diagnosis:    "SAM: Weight 7.2 kg (WAZ −3.4), MUAC 10.8 cm. No oedema. PHC for RUTF.",
        prescription: ["RUTF 3 sachets/day", "Amoxicillin syrup"],
        followUpDate: "2026-09-15",
      },
      {
        date:         "2026-07-20",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Rahul Kulkarni",
        complaint:    "Routine child health check — 14 months",
        diagnosis:    "Weight 7.0 kg — borderline. Mother counselled on diet. Growth chart shown.",
        prescription: ["Zinc 20mg OD × 14 days", "Albendazole 200mg stat"],
        followUpDate: "2026-09-01",
      },
    ],
    pendingCare: [
      { label: "Measles / MR dose 1",      dueDate: "2026-09-08", kind: "immunisation" },
      { label: "RUTF collection at PHC",   dueDate: "2026-09-04", kind: "ncd" },
      { label: "Weight check (2 weeks)",   dueDate: "2026-09-15", kind: "general" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/tara-uikey-abdm-007",
    lastSyncedAt: "2026-09-01T11:15:00",
  },

  /* ── P-8  Geeta Dhurve · chronic · post-partum severe anaemia ── */
  "14-2201-8834-5508": {
    abhaId:     "14-2201-8834-5508",
    name:       "Geeta Dhurve",
    age:        29,
    sex:        "F",
    dob:        "1997-11-03",
    bloodGroup: "B+",
    phone:      "9088990011",
    village:    "Armori",
    district:   "Gadchiroli",
    language:   "mr",
    risk:       "chronic",
    activeConditions: [
      "Post-partum 6 weeks — normal vaginal delivery",
      "Severe anaemia (Hb 7.1 g/dL) — iron deficiency",
      "Exclusive breastfeeding",
    ],
    currentMedications: [
      { name: "Iron + Folic Acid (IFA)",  dose: "1 tab OD",  since: "2026-07-22" },
    ],
    allergies: [],
    visitHistory: [
      {
        date:         "2026-09-03",
        facility:     "Home Visit · Armori (ASHA)",
        facilityType: "Sub-centre",
        doctor:       "ASHA Sunita Pawar",
        complaint:    "6-week post-partum check. Hb done at home — 7.1 g/dL. Very tired, pallor present.",
        diagnosis:    "Severe anaemia. Baby breastfeeding well. Referred to PHC for IV iron infusion urgently.",
        prescription: ["Continue IFA", "Iron-rich diet", "PHC visit today"],
        followUpDate: "2026-09-03",
      },
      {
        date:         "2026-07-22",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Anjali Deshmukh",
        complaint:    "Delivery at PHC. Normal vaginal delivery. Baby girl 2.8 kg. Apgar 9.",
        diagnosis:    "Uncomplicated delivery. Post-partum Hb 8.4 g/dL — mild anaemia. IFA started.",
        prescription: ["IFA 1 OD", "Exclusive breastfeeding counselled", "PNC in 6 weeks"],
        followUpDate: "2026-09-03",
      },
      {
        date:         "2026-05-10",
        facility:     "PHC Armori",
        facilityType: "PHC",
        doctor:       "Dr. Rahul Kulkarni",
        complaint:    "ANC 36-week check",
        diagnosis:    "Hb 8.8 g/dL. BP 112/72. Baby cephalic. USG: normal.",
        prescription: ["IFA continued", "Calcium continued"],
        labOrdered:   "Hb, urine protein",
        labResult:    "Hb 8.8, urine protein negative",
        followUpDate: "2026-07-15",
      },
    ],
    pendingCare: [
      { label: "IV iron infusion at PHC",    dueDate: "2026-09-03", kind: "ncd" },
      { label: "Hb recheck post-iron",       dueDate: "2026-09-17", kind: "ncd" },
      { label: "PNC 6-week check at PHC",    dueDate: "2026-09-05", kind: "general" },
    ],
    ashaName:     "Sunita Pawar",
    ashaPhone:    "9876501234",
    fhirId:       "Patient/geeta-dhurve-abdm-008",
    lastSyncedAt: "2026-09-03T08:35:00",
  },

};

/* ─── Public API ──────────────────────────────────────────────────────────── */

/**
 * Looks up a patient by ABHA ID against the ABDM Health Repository.
 * Returns the patient record or null if not found.
 * Rejects with an error on invalid ABHA format.
 */
export async function pullAbhaRecord(abhaId: string): Promise<AbdmPatientRecord | null> {
  const cleaned = abhaId.trim().replace(/\s/g, "");

  // Format check: 14 digits (with or without dashes)
  const digits = cleaned.replace(/-/g, "");
  if (!/^\d{14}$/.test(digits)) {
    throw new Error("Invalid ABHA format. Must be 14 digits (e.g. 14-2201-8834-5501).");
  }

  // Simulate ABDM gateway latency (~900 ms)
  await new Promise((res) => setTimeout(res, 900));

  return MOCK_DB[cleaned] ?? null;
}
