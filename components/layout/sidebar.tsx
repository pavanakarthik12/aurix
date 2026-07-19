"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/constants/nav";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              Aurix
            </span>
          </Link>
        )}
        {collapsed && (
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            A
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname.startsWith(item.href)}
          />
        ))}

        <div className="my-3 h-px bg-sidebar-border" />

        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
}: {
  item: (typeof PRIMARY_NAV)[number];
  collapsed: boolean;
  active: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 h-6 w-1 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <item.icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
