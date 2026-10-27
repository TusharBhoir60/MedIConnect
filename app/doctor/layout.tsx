import type { Metadata, Viewport } from "next";
import { DoctorShell } from "@/components/DoctorShell";

export const metadata: Metadata = {
  title: "JanArogya Doctor",
  applicationName: "JanArogya Doctor",
  description: "Doctor desk — review ASHA visits, triage, facility overview",
};

export const viewport: Viewport = {
  themeColor: "#0c2a1c",
  width: "device-width",
  initialScale: 1,
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DoctorShell>{children}</DoctorShell>;
}
