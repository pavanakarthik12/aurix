import { Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { QUICK_INSIGHTS } from "@/lib/mock-data";

export function QuickInsights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Insights</CardTitle>
        <CardDescription>Patterns Aurix noticed in your finances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {QUICK_INSIGHTS.map((insight) => (
          <div key={insight.id} className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
