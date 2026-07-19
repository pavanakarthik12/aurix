"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/constants/nav";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 max-w-full translate-y-0 rounded-none border-0 p-0 sm:max-w-xs sm:translate-x-0 sm:rounded-r-xl sm:border-r sm:left-0 sm:top-0 sm:h-screen sm:data-[state=open]:slide-in-from-left">
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
