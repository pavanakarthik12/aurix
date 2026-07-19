import { UtensilsCrossed, Car, Clapperboard, Zap, ShoppingBag, HeartPulse, Home, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseCategory } from "@/types/finance";
import type { TrackedTransaction } from "@/store/expenses-store";

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Clapperboard,
  utilities: Zap,
  shopping: ShoppingBag,
  health: HeartPulse,
  housing: Home,
  other: MoreHorizontal,
};

const SOURCE_LABELS: Record<TrackedTransaction["source"], string> = {
  manual: "Manual",
  screenshot: "Screenshot",
  splitwise: "Splitwise",
};

interface TransactionListProps {
  transactions: TrackedTransaction[];
  emptyLabel?: string;
}

export function TransactionList({ transactions, emptyLabel }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        {emptyLabel ?? "No transactions yet."}
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {transactions.map((tx) => {
            const Icon = CATEGORY_ICONS[tx.category];
            return (
              <li key={tx.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{tx.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[tx.category]} · {formatDate(tx.date)}
                  </p>
                </div>
                <Badge variant="muted" className="hidden sm:inline-flex">
                  {SOURCE_LABELS[tx.source]}
                </Badge>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  −{formatCurrency(tx.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
