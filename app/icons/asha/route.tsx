import { pwaIcon } from "@/lib/pwa-icon";

export const runtime = "edge";

export async function GET() {
  return pwaIcon({ label: "ASHA", bg: "#0c2a1c", mark: "+", size: 512 });
}
