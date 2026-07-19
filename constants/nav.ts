import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Receipt,
  Target,
  Sparkles,
  FileBarChart,
  Settings,
  UserRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Financial Goals", href: "/goals", icon: Target },
  { label: "AI Advisor", href: "/advisor", icon: Sparkles },
  { label: "Reports", href: "/reports", icon: FileBarChart },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
];
