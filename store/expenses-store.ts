import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "@/types/finance";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

export type TransactionSource = "manual" | "screenshot" | "splitwise";

export interface TrackedTransaction extends Transaction {
  source: TransactionSource;
}

interface ExpensesState {
  transactions: TrackedTransaction[];
  addTransaction: (tx: Omit<TrackedTransaction, "id">) => void;
  removeTransaction: (id: string) => void;
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS.map((tx) => ({ ...tx, source: "manual" as const })),
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            { ...tx, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ...state.transactions,
          ],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
    }),
    { name: "aurix-expenses" }
  )
);
