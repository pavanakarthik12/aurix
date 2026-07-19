import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MOCK_GOALS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";

export function GoalsWidget() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Financial Goals</CardTitle>
          <CardDescription>Progress toward what matters</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/goals">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {MOCK_GOALS.map((goal) => {
          const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{goal.title}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <Progress value={pct} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                </span>
                <span>by {formatDate(goal.targetDate, { month: "short", year: "numeric", day: undefined })}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
