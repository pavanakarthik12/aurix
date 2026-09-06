"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface SecurityCheck {
  id: string;
  category: string;
  name: string;
  status: "passed" | "warning" | "failed" | "not-tested";
  detail?: string;
}

interface SecurityCheckCardProps {
  check: SecurityCheck;
}

export function SecurityCheckCard({ check }: SecurityCheckCardProps) {
  const statusClass = check.status;
  const StatusIcon = {
    passed: CheckCircle,
    warning: AlertTriangle,
    failed: XCircle,
    "not-tested": Loader2,
  }[check.status];

  const bgClass = {
    passed: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
    "not-tested": "bg-muted/10 text-muted-foreground",
  }[check.status];

  const borderClass = {
    passed: "border-success/20",
    warning: "border-warning/20",
    failed: "border-destructive/20",
    "not-tested": "border-muted/20",
  }[check.status];

  const badgeVariant = {
    passed: "success" as const,
    warning: "warning" as const,
    failed: "destructive" as const,
    "not-tested": "muted" as const,
  }[check.status];

  return (
    <Card className="p-4 h-100">
      <div className="flex items-start gap-3">
        <Badge
          variant={badgeVariant}
          className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
        >
          <StatusIcon className="h-1.5 w-1.5" />
        </Badge>
        <div className="flex-1">
          <div className="font-medium text-foreground">
            {check.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {check.id}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="text-xs text-muted-foreground">{check.detail || "—"}</div>
      </div>
    </Card>
  );
}