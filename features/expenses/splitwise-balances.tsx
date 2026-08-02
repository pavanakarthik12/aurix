"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

interface SplitwiseMember {
  id: number;
  name: string;
}

interface SplitwiseGroup {
  id: number;
  name: string;
  members: SplitwiseMember[];
}

interface SplitwiseExpense {
  id: number;
  description: string;
  cost: number;
  date: string;
  group_id: number;
}

export function SplitwiseBalances() {
  const [groups, setGroups] = useState<SplitwiseGroup[]>([]);
  const [expenses, setExpenses] = useState<SplitwiseExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const loadSplitwiseData = async () => {
    setLoading(true);
    try {
      // Load groups
      const groupsRes = await fetch("/api/splitwise?endpoint=get_groups");
      const groupsData = await groupsRes.json();
      
      // Load expenses
      const expensesRes = await fetch("/api/splitwise?endpoint=get_expenses");
      const expensesData = await expensesRes.json();

      if (groupsData.data?.groups) {
        setGroups(groupsData.data.groups);
      }
      if (expensesData.data?.expenses) {
        setExpenses(expensesData.data.expenses);
      }
      
      setIsDemo(groupsData.demo || expensesData.demo || false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Splitwise balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void loadSplitwiseData();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Splitwise Integration</h2>
          <p className="text-sm text-muted-foreground">Track shared expenses and balances across your groups</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSplitwiseData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Sync Balances
        </Button>
      </div>

      {isDemo && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-500">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Demo Sandbox Mode Active</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
              No Splitwise API key detected in your environment. Showing simulated sandbox data. Set `SPLITWISE_API_KEY` to connect your actual account.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Groups */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Groups</h3>
            <div className="space-y-3">
              {groups.map((group) => {
                // Calculate mock balances for demo
                const owed = group.id === 1 ? 800 : 0;
                const owes = group.id === 2 ? 600 : 0;

                return (
                  <Card key={group.id} className="overflow-hidden border-border bg-card">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
                        {owed > 0 && (
                          <Badge variant="success" className="gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            You are owed ₹{owed}
                          </Badge>
                        )}
                        {owes > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <ArrowDownLeft className="h-3 w-3" />
                            You owe ₹{owes}
                          </Badge>
                        )}
                        {owed === 0 && owes === 0 && (
                          <Badge variant="secondary">Settled Up</Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {group.members.map((m) => m.name).join(", ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="mt-3 flex items-center justify-between text-xs border-t border-border/50 pt-2.5">
                        <span className="text-muted-foreground">Recent Activity:</span>
                        <span className="font-medium text-foreground">
                          {expenses.filter((e) => e.group_id === group.id).length} shared expenses
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Shared Expenses */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shared Expenses Feed</h3>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No recent shared expenses.</div>
              ) : (
                expenses.map((expense) => {
                  const groupName = groups.find((g) => g.id === expense.group_id)?.name || "Group";
                  return (
                    <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {groupName} · {expense.date}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">₹{expense.cost}</p>
                        <p className="text-[10px] text-muted-foreground">Total Cost</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
