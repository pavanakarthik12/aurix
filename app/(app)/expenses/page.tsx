"use client";

import { useState, useEffect } from "react";
import { Plus, Receipt, Wifi, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionList } from "@/features/expenses/transaction-list";
import { ScreenshotUpload } from "@/features/expenses/screenshot-upload";
import { StatementUpload } from "@/features/expenses/statement-upload";
import { ManualEntry } from "@/features/expenses/manual-entry";
import { SMSIngest } from "@/features/expenses/sms-ingest";
import { SplitwiseBalances } from "@/features/expenses/splitwise-balances";
import { useExpensesStore } from "@/store/expenses-store";

interface SplitwiseGroup {
  id: number;
  name: string;
  members: { id: number; name: string }[];
}

interface SplitwiseExpense {
  id: number;
  description: string;
  cost: number;
  date: string;
  group_id: number;
}

export default function ExpensesPage() {
  const [tab, setTab] = useState("all");
  const transactions = useExpensesStore((s) => s.transactions);
  const addTransactions = useExpensesStore((s) => s.addTransactions);
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
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
              <TabsTrigger value="statement">Bank Statement</TabsTrigger>
              <TabsTrigger value="sms">SMS Clipboard</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="splitwise">Splitwise</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <TransactionList transactions={transactions} />
            </TabsContent>
            <TabsContent value="screenshots" className="space-y-6">
              <ScreenshotUpload />
              <TransactionList transactions={transactions.filter((t) => t.source === "screenshot")} emptyLabel="No expenses extracted from screenshots yet." />
            </TabsContent>
            <TabsContent value="statement" className="space-y-6">
              <StatementUpload />
              <TransactionList transactions={transactions.filter((t) => t.source === "statement")} emptyLabel="No expenses imported from bank statements yet." />
            </TabsContent>
            <TabsContent value="sms" className="space-y-6">
              <SMSIngest />
              <TransactionList transactions={transactions.filter((t) => t.source === "manual")} emptyLabel="Expenses parsed from SMS will appear here." />
            </TabsContent>
            <TabsContent value="manual" className="space-y-6">
              <ManualEntry />
              <TransactionList transactions={transactions.filter((t) => t.source === "manual")} emptyLabel="Manually added expenses will appear here." />
            </TabsContent>
            <TabsContent value="splitwise" className="space-y-6">
              <SplitwiseBalances />
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
