import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AdvisorChat } from "@/features/advisor/advisor-chat";
import { HealthScoreCard } from "@/features/advisor/health-score";
import { FinancialTimeline } from "@/features/advisor/timeline-widget";
import { getFinancialHealthScore } from "@/services/health-service";
import { getTimelineEvents } from "@/services/health-service";
import { isAIReal, getAIProviderLabel } from "@/lib/config";

export const metadata: Metadata = { title: "AI Advisor" };

export default async function AdvisorPage() {
  const healthScore = await getFinancialHealthScore();
  const timelineEvents = getTimelineEvents();
  const aiLive = isAIReal();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="AI Advisor"
        description="Your intelligent financial assistant with multi-guru intelligence."
        actions={
          <Badge variant={aiLive ? "success" : "muted"} className="gap-1.5">
            {aiLive ? `Live: ${getAIProviderLabel()}` : "Mock Mode"}
          </Badge>
        }
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
