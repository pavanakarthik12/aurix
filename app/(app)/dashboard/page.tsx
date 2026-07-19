import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { OverviewStats } from "@/features/dashboard/widgets/overview-stats";
import { SpendingTrendChart } from "@/features/dashboard/widgets/spending-trend-chart";
import { ExpenseCategories } from "@/features/dashboard/widgets/expense-categories";
import { BudgetWidget } from "@/features/dashboard/widgets/budget-widget";
import { GoalsWidget } from "@/features/dashboard/widgets/goals-widget";
import { RecentTransactions } from "@/features/dashboard/widgets/recent-transactions";
import { QuickInsights } from "@/features/dashboard/widgets/quick-insights";
import { DashboardPersonaCard } from "@/features/dashboard/widgets/dashboard-persona-card";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
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

        <QuickInsights />
      </div>
    </div>
  );
}
