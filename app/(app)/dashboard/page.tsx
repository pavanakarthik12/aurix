import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OverviewStats } from "@/features/dashboard/widgets/overview-stats";
import { SpendingTrendChart } from "@/features/dashboard/widgets/spending-trend-chart";
import { ExpenseCategories } from "@/features/dashboard/widgets/expense-categories";
import { BudgetWidget } from "@/features/dashboard/widgets/budget-widget";
import { GoalsWidget } from "@/features/dashboard/widgets/goals-widget";
import { RecentTransactions } from "@/features/dashboard/widgets/recent-transactions";
import { QuickInsights } from "@/features/dashboard/widgets/quick-insights";
import { DashboardPersonaCard } from "@/features/dashboard/widgets/dashboard-persona-card";
import { InsightsList } from "@/features/advisor/insights-list";
import { RecommendationsList } from "@/features/advisor/recommendations";
import { HealthScoreCard } from "@/features/advisor/health-score";
import { getSpendingInsights, getAIRecommendations } from "@/services/advisor-service";
import { getFinancialHealthScore } from "@/services/health-service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [insights, healthScore] = await Promise.all([
    getSpendingInsights(),
    getFinancialHealthScore(),
  ]);
  const recommendations = getAIRecommendations();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Good morning"
        description="Here's what's happening with your finances today."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      <div className="space-y-6">
        <OverviewStats />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendingTrendChart />
          </div>
          <DashboardPersonaCard />
        </div>

        <HealthScoreCard score={healthScore} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions />
          <ExpenseCategories />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GoalsWidget />
          </div>
          <BudgetWidget />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightsList insights={insights} />
          <RecommendationsList recommendations={recommendations} />
        </div>

        <QuickInsights />
      </div>
    </div>
  );
}
