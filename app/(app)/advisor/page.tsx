import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AdvisorChat } from "@/features/advisor/advisor-chat";
import { HealthScoreCard } from "@/features/advisor/health-score";
import { FinancialTimeline } from "@/features/advisor/timeline-widget";
import { getFinancialHealthScore } from "@/services/health-service";
import { getTimelineEvents } from "@/services/health-service";

export const metadata: Metadata = { title: "AI Advisor" };

export default function AdvisorPage() {
  const healthScore = getFinancialHealthScore();
  const timelineEvents = getTimelineEvents();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="AI Advisor"
        description="Your intelligent financial assistant with multi-guru intelligence."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdvisorChat />
        </div>
        <div className="space-y-6">
          <HealthScoreCard score={healthScore} />
          <FinancialTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
