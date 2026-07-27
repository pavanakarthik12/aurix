import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "@/types/finance";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

export type TransactionSource = "manual" | "screenshot" | "statement" | "splitwise";

export interface TrackedTransaction extends Transaction {
  source: TransactionSource;
}

interface ExpensesState {
  transactions: TrackedTransaction[];
  addTransaction: (tx: Omit<TrackedTransaction, "id">) => void;
  addTransactions: (txs: Omit<TrackedTransaction, "id">[]) => void;
  removeTransaction: (id: string) => void;
  setTransactions: (txs: TrackedTransaction[]) => void;
}

function withId(tx: Omit<TrackedTransaction, "id">, salt: number): TrackedTransaction {
  return { ...tx, id: `t-${Date.now()}-${salt}-${Math.random().toString(36).slice(2, 7)}` };
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS.map((tx) => ({ ...tx, source: "manual" as const })),
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [withId(tx, 0), ...state.transactions],
        })),
      addTransactions: (txs) =>
        set((state) => ({
          transactions: [...txs.map((tx, i) => withId(tx, i)), ...state.transactions],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
      setTransactions: (txs) => set({ transactions: txs }),
    }),
    { name: "aurix-expenses" }
  )
);
