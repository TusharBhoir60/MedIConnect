import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: "JanArogya · Maharashtra",
  description: "Rural public healthcare access — ASHA, PHC doctor, patient, JanVaani",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased warli">
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}