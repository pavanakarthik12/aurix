"use client";

import { SecurityCheckCard } from "./SecurityCheckCard";

interface SecurityCheck {
  id: string;
  category: string;
  name: string;
  status: "passed" | "warning" | "failed" | "not-tested";
  detail?: string;
}

interface SecurityAssessmentGridProps {
  securityChecks: {
    checks: SecurityCheck[];
    score: number;
    overallStatus: "passed" | "warning" | "failed" | "not-tested";
  };
}

export function SecurityAssessmentGrid({ securityChecks }: SecurityAssessmentGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {securityChecks.checks.map((check) => (
        <SecurityCheckCard key={check.id} check={check} />
      ))}
    </div>
  );
}
