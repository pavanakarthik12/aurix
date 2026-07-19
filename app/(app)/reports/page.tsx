import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SpendingTrendChart } from "@/features/dashboard/widgets/spending-trend-chart";
import { ExpenseCategories } from "@/features/dashboard/widgets/expense-categories";
import { OverviewStats } from "@/features/dashboard/widgets/overview-stats";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reports"
        description="A clear view of your financial trends over time."
        actions={
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
            Export report
          </Button>
        }
      />

      <div className="space-y-6">
        <OverviewStats />
        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingTrendChart />
          <ExpenseCategories />
        </div>
      </div>
    </div>
  );
}
