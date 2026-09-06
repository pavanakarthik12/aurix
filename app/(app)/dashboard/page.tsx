"use client";

import { useState, useEffect } from "react";
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
import type { AIInsight, AIRecommendation, FinancialHealthScore } from "@/types/finance";

export default function DashboardPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        // Load all data in parallel
        const [insightsData, healthData] = await Promise.all([
          getSpendingInsights().catch((err) => {
            console.error("Insights error:", err);
            return [];
          }),
          getFinancialHealthScore().catch((err) => {
            console.error("Health score error:", err);
            return null;
          }),
        ]);

        // Get recommendations synchronously (no API call)
        const recommendationsData = getAIRecommendations();

        if (mounted) {
          setInsights(insightsData);
          setHealthScore(healthData);
          setRecommendations(recommendationsData);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (mounted) {
          setError("Failed to load dashboard data. Please refresh the page.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Good morning"
        description="Here's what's happening with your finances today."
        actions={
          <Button size="sm" onClick={() => window.location.href = "/expenses"}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <OverviewStats />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendingTrendChart />
          </div>
          <DashboardPersonaCard />
        </div>

        {loading && !healthScore ? (
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading financial insights...</p>
            </div>
          </div>
        ) : healthScore ? (
          <HealthScoreCard score={healthScore} />
        ) : null}

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
          <InsightsList insights={insights} loading={loading} />
          <RecommendationsList recommendations={recommendations} loading={loading} />
        </div>

        <QuickInsights />
      </div>
    </div>
  );
}
