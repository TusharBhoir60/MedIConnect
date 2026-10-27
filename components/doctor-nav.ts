
import {
  Building2,
  ClipboardList,
  Database,
  Send,
  type LucideIcon,
} from "lucide-react";

export const DOCTOR_NAV: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/doctor",           labelKey: "navQueue",     icon: ClipboardList },
  { href: "/doctor/referrals", labelKey: "navReferrals", icon: Send },
  { href: "/doctor/facility",  labelKey: "navFacility",  icon: Building2 },
  { href: "/doctor/abha",      labelKey: "navAbha",      icon: Database },
];

export function doctorNavActive(path: string, href: string) {
  return href === "/doctor" ? path === "/doctor" : path.startsWith(href);
}
