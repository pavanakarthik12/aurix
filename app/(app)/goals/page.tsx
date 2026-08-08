"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Target, Calculator, Clock, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortfolioTracker } from "@/features/portfolio/portfolio-tracker";
import { FinancialTimeMachine } from "@/features/goals/time-machine";
import { useGoalsStore } from "@/store/goals-store";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinancialGoalType } from "@/types/finance";

const GOAL_TYPE_LABELS: Record<FinancialGoalType, string> = {
  "emergency-fund": "Emergency Fund",
  "debt-payoff": "Debt Payoff",
  "wealth-growth": "Wealth Growth",
  "home-purchase": "Home Down Payment",
  retirement: "Retirement",
  travel: "Travel / Trip",
};

export default function GoalsPage() {
  const goals = useGoalsStore((s) => s.goals);
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split("T")[0];
  });
  const [type, setType] = useState<FinancialGoalType>("wealth-growth");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!title.trim() || !target || target <= 0) return;
    addGoal({
      title: title.trim(),
      targetAmount: target,
      currentAmount: Math.max(0, Number(currentAmount) || 0),
      targetDate: targetDate || new Date().toISOString().split("T")[0],
      type,
    });
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setShowCreate(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Financial Goals"
        description="Track meaningful milestones with clear, honest numbers."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/goals/calculator">
                <Calculator className="mr-1.5 h-4 w-4" />
                Tax & SIP Tools
              </Link>
            </Button>
            <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {showCreate ? "Close form" : "New goal"}
            </Button>
          </div>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create a financial goal
            </CardTitle>
            <CardDescription>Goals power your projections — the Time Machine and What-If Simulator use them as your starting corpus.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="goal-title">Goal title</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g. Emergency fund, Goa trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-type">Goal type</Label>
                <Select value={type} onValueChange={(v) => setType(v as FinancialGoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-target">Target amount (₹)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  min="0"
                  placeholder="200000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-saved">Already saved (₹)</Label>
                <Input
                  id="goal-saved"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-date">Target date</Label>
                <Input
                  id="goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add goal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="goals">Goals Tracker</TabsTrigger>
          <TabsTrigger value="time-machine">Financial Time Machine</TabsTrigger>
          <TabsTrigger value="portfolio">Investment Portfolio (Zerodha/Groww)</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          {goals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {goals.map((goal) => {
                const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <Card key={goal.id}>
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <CardTitle>{goal.title}</CardTitle>
                      <Badge variant={pct >= 75 ? "success" : "outline"}>{pct}%</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={pct} />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Saved</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target date</span>
                        <span className="font-medium text-foreground">
                          {formatDate(goal.targetDate)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Set your first financial goal — an emergency fund, a trip, or a big purchase."
              action={
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" />
                  Create a goal
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="time-machine" className="space-y-6">
          <FinancialTimeMachine />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}