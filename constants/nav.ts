import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Receipt,
  Target,
  Sparkles,
  FileBarChart,
  Settings,
  UserRound,
  BookOpen,
  Microscope,
  Server,
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
  { label: "Analytics", href: "/analytics", icon: Microscope },
  { label: "Reports", href: "/reports", icon: FileBarChart },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "System Quality", href: "/system-quality", icon: Server },
  { label: "Settings", href: "/settings", icon: Settings },
];
