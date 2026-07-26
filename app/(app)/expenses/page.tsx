"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionList } from "@/features/expenses/transaction-list";
import { ScreenshotUpload } from "@/features/expenses/screenshot-upload";
import { StatementUpload } from "@/features/expenses/statement-upload";
import { useExpensesStore } from "@/store/expenses-store";

export default function ExpensesPage() {
  const [tab, setTab] = useState("all");
  const transactions = useExpensesStore((s) => s.transactions);
  const hasTransactions = transactions.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Expenses"
        description="Every transaction, extracted and categorized automatically."
        actions={
          <Button size="sm" onClick={() => setTab("screenshots")}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      {hasTransactions ? (
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="screenshots">From screenshots</TabsTrigger>
              <TabsTrigger value="statement">Bank statement</TabsTrigger>
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
              <TabsTrigger value="splitwise">Splitwise</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <TransactionList transactions={transactions} />
            </TabsContent>
            <TabsContent value="screenshots" className="space-y-6">
              <ScreenshotUpload />
              <TransactionList
                transactions={transactions.filter((t) => t.source === "screenshot")}
                emptyLabel="No expenses extracted from screenshots yet."
              />
            </TabsContent>
            <TabsContent value="statement" className="space-y-6">
              <StatementUpload />
              <TransactionList
                transactions={transactions.filter((t) => t.source === "statement")}
                emptyLabel="No expenses imported from bank statements yet."
              />
            </TabsContent>
            <TabsContent value="manual">
              <TransactionList
                transactions={transactions.filter((t) => t.source === "manual")}
                emptyLabel="Manually added expenses will appear here."
              />
            </TabsContent>
            <TabsContent value="splitwise">
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Connect Splitwise to sync shared expenses.
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Upload a payment screenshot or add an expense manually to get started."
          action={
            <Button size="sm" onClick={() => setTab("screenshots")}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          }
        />
      )}
    </div>
  );
}
