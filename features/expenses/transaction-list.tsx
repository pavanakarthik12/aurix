import { useState } from "react";
import { UtensilsCrossed, Car, Clapperboard, Zap, ShoppingBag, HeartPulse, Home, MoreHorizontal, Check, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { useCategoryStore } from "@/store/category-store";
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

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "entertainment", label: "Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "shopping", label: "Shopping" },
  { value: "health", label: "Health" },
  { value: "housing", label: "Housing" },
  { value: "other", label: "Other" },
];

const SOURCE_LABELS: Record<TrackedTransaction["source"], string> = {
  manual: "Manual",
  screenshot: "Screenshot",
  statement: "Bank Statement",
  splitwise: "Splitwise",
};

interface TransactionListProps {
  transactions: TrackedTransaction[];
  emptyLabel?: string;
  onCategoryChange?: (id: string, newCategory: ExpenseCategory) => void;
}

export function TransactionList({ transactions, emptyLabel, onCategoryChange }: TransactionListProps) {
  const addCorrection = useCategoryStore((s) => s.addCorrection);
  const getLearnedCategory = useCategoryStore((s) => s.getLearnedCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<ExpenseCategory>("other");

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
            const learnedCategory = getLearnedCategory(tx.merchant, tx.category);
            const isCorrected = learnedCategory !== tx.category;
            const Icon = CATEGORY_ICONS[tx.category];
            const isEditing = editingId === tx.id;

            return (
              <li key={tx.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{tx.merchant}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isEditing ? (
                      <select
                        value={tempCategory}
                        onChange={(e) => setTempCategory(e.target.value as ExpenseCategory)}
                        className="rounded border border-border bg-background px-1 py-0.5 text-[11px]"
                        autoFocus
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{CATEGORY_LABELS[tx.category]}</span>
                    )}
                    <span>·</span>
                    <span>{formatDate(tx.date)}</span>
                    {isCorrected && !isEditing && (
                      <Badge variant="secondary" className="text-[9px]">Learned</Badge>
                    )}
                  </div>
                </div>
                <Badge variant="muted" className="hidden sm:inline-flex">
                  {SOURCE_LABELS[tx.source]}
                </Badge>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  −{formatCurrency(tx.amount)}
                </p>
                {isEditing ? (
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        addCorrection(tx.merchant, tempCategory);
                        onCategoryChange?.(tx.id, tempCategory);
                        setEditingId(null);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setTempCategory(tx.category);
                      setEditingId(tx.id);
                    }}
                  >
                    Edit
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
