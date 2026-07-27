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

  const [splitwiseGroups, setSplitwiseGroups] = useState<SplitwiseGroup[]>([]);
  const [splitwiseExpenses, setSplitwiseExpenses] = useState<SplitwiseExpense[]>([]);
  const [swLoading, setSwLoading] = useState(false);

  useEffect(() => {
    if (tab === "splitwise") {
      loadSplitwise();
    }
  }, [tab]);

  async function loadSplitwise() {
    setSwLoading(true);
    try {
      const [groupsRes, expensesRes] = await Promise.all([
        fetch("/api/splitwise?endpoint=get_groups"),
        fetch("/api/splitwise?endpoint=get_expenses"),
      ]);
      const groupsData = await groupsRes.json();
      const expensesData = await expensesRes.json();
      setSplitwiseGroups(groupsData.data?.groups || []);
      setSplitwiseExpenses(expensesData.data?.expenses || []);
    } catch {
      setSplitwiseGroups([]);
      setSplitwiseExpenses([]);
    } finally {
      setSwLoading(false);
    }
  }

  async function importSplitwiseExpenses() {
    const newTxns = splitwiseExpenses.map((e) => ({
      merchant: e.description,
      amount: Math.round(e.cost),
      category: "food" as const,
      date: e.date,
      source: "splitwise" as const,
    }));
    if (newTxns.length > 0) {
      addTransactions(newTxns);
      setSplitwiseExpenses([]);
    }
  }

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
              <TransactionList transactions={transactions.filter((t) => t.source === "screenshot")} emptyLabel="No expenses extracted from screenshots yet." />
            </TabsContent>
            <TabsContent value="statement" className="space-y-6">
              <StatementUpload />
              <TransactionList transactions={transactions.filter((t) => t.source === "statement")} emptyLabel="No expenses imported from bank statements yet." />
            </TabsContent>
            <TabsContent value="manual" className="space-y-6">
              <ManualEntry />
              <TransactionList transactions={transactions.filter((t) => t.source === "manual")} emptyLabel="Manually added expenses will appear here." />
            </TabsContent>
            <TabsContent value="splitwise" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Splitwise</CardTitle>
                  <CardDescription>Sync shared expenses from Splitwise groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {swLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Splitwise data...
                    </div>
                  ) : splitwiseGroups.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <Wifi className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Connect Splitwise to sync shared expenses.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Set SPLITWISE_API_KEY in your environment to enable live sync.
                      </p>
                      <Button variant="outline" size="sm" onClick={loadSplitwise}>
                        Retry Connection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                          Your Groups ({splitwiseGroups.length})
                        </p>
                        <div className="space-y-2">
                          {splitwiseGroups.map((g) => (
                            <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{g.name}</p>
                                <p className="text-xs text-muted-foreground">{g.members.map((m) => m.name).join(", ")}</p>
                              </div>
                              <Badge variant="secondary" className="text-[10px]">{g.members.length} members</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      {splitwiseExpenses.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                            Pending Expenses ({splitwiseExpenses.length})
                          </p>
                          <div className="space-y-2 mb-4">
                            {splitwiseExpenses.map((e) => (
                              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{e.description}</p>
                                  <p className="text-xs text-muted-foreground">{e.date}</p>
                                </div>
                                <span className="text-sm font-medium">₹{e.cost}</span>
                              </div>
                            ))}
                          </div>
                          <Button size="sm" onClick={importSplitwiseExpenses} className="w-full">
                            <Plus className="h-4 w-4" />
                            Import {splitwiseExpenses.length} expenses
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <TransactionList transactions={transactions.filter((t) => t.source === "splitwise")} emptyLabel="No Splitwise expenses imported yet." />
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
