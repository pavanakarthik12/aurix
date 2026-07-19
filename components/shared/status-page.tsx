import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

interface StatusPageProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function StatusPage({
  icon: Icon,
  code,
  title,
  description,
  primaryAction,
  secondaryAction,
}: StatusPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface px-6 text-center">
      <Logo />
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        {code && (
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {code}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {primaryAction ?? (
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
