import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AdvisorChat } from "@/features/advisor/advisor-chat";
import { HealthScoreCard } from "@/features/advisor/health-score";
import { FinancialTimeline } from "@/features/advisor/timeline-widget";
import { isAIReal, getAIProviderLabel } from "@/lib/config";

import { FinancialNewsFeed } from "@/features/advisor/financial-news-feed";

export const metadata: Metadata = { title: "AI Advisor" };

export default async function AdvisorPage() {
  const aiLive = isAIReal();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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
          <HealthScoreCard />
          <FinancialTimeline events={[]} />
        </div>
      </div>

      <div className="border-t border-border/60 pt-8">
        <FinancialNewsFeed />
      </div>
    </div>
  );
}
