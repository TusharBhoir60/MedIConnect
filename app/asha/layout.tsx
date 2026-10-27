import type { Metadata, Viewport } from "next";
import { AshaShell } from "@/components/AshaShell";

export const metadata: Metadata = {
  title: "JanArogya ASHA",
  applicationName: "JanArogya ASHA",
  description: "ASHA PWA — home visits, voice, emergency, PHC workflow",
  manifest: "/asha.webmanifest",
  appleWebApp: { capable: true, title: "ASHA", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/asha", apple: "/icons/asha" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c2a1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function AshaLayout({ children }: { children: React.ReactNode }) {
  return <AshaShell>{children}</AshaShell>;
}
