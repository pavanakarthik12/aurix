"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SpendingTrendChart } from "@/features/dashboard/widgets/spending-trend-chart";
import { ExpenseCategories } from "@/features/dashboard/widgets/expense-categories";
import { OverviewStats } from "@/features/dashboard/widgets/overview-stats";
import { useExpensesStore } from "@/store/expenses-store";

function exportExpensesCsv() {
  const transactions = useExpensesStore.getState().transactions;
  if (transactions.length === 0) {
    toast.error("No expenses to export yet. Add some transactions first.");
    return;
  }

  const header = ["Date", "Merchant", "Category", "Amount (INR)"];
  const rows = transactions.map((t) => [t.date, t.merchant, t.category, String(t.amount)]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "aurix-expenses.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${transactions.length} transactions as CSV`);
}

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reports"
        description="A clear view of your financial trends over time."
        actions={
          <Button size="sm" variant="outline" onClick={exportExpensesCsv}>
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