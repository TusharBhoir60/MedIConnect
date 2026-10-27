
import {
  CalendarCheck2,
  ClipboardCheck,
  IndianRupee,
  LayoutGrid,
  Send,
  Siren,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export const ASHA_NAV: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/asha",            labelKey: "navHome",      icon: LayoutGrid },
  { href: "/asha/visit",      labelKey: "navVisit",     icon: UserPlus },
  { href: "/asha/follow-up",  labelKey: "navFollowUp",  icon: CalendarCheck2 },
  { href: "/asha/tasks",      labelKey: "navTasks",     icon: ClipboardCheck },
  { href: "/asha/referrals",  labelKey: "navReferrals", icon: Send },
  { href: "/asha/emergency",  labelKey: "navEmergency", icon: Siren },
  { href: "/asha/earnings",   labelKey: "navEarnings",  icon: IndianRupee },
];

export function ashaNavActive(path: string, href: string) {
  return path === href || (href !== "/asha" && path.startsWith(href));
}
