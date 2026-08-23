"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface SecurityCheck {
  id: string;
  category: "authentication" | "authorization" | "data-protection" | "api-security" | "file-security" | "privacy" | "secret-management";
  name: string;
  status: "passed" | "warning" | "failed" | "not-tested";
  detail?: string;
}

interface SecurityCheckCardProps {
  check: SecurityCheck;
}

export function SecurityCheckCard({ check }: SecurityCheckCardProps) {
  const statusClass = check.status;
  const statusIcon = {
    passed: CheckCircle,
    warning: AlertTriangle,
    failed: XCircle,
    not_tested: Loader2,
  }[check.status];

  const bgClass = {
    passed: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
    not_tested: "bg-muted/10 text-muted-foreground",
  }[check.status];

  const borderClass = {
    passed: "border-success/20",
    warning: "border-warning/20",
    failed: "border-destructive/20",
    not_tested: "border-muted/20",
  }[check.status];

  return (
    <Card className="p-4 h-100">
      <div className="flex items-start gap-3">
        <Badge
          variant={check.status}
          className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
        >
          <statusIcon className="h-1.5 w-1.5" />
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