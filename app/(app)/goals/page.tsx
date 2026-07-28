import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Target, Calculator } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MOCK_GOALS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Financial Goals" };

export default function GoalsPage() {
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
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New goal
            </Button>
          </div>
        }
      />

      {MOCK_GOALS.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {MOCK_GOALS.map((goal) => {
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
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Create a goal
            </Button>
          }
        />
      )}
    </div>
  );
}
