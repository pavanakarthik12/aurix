import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinancialGoal } from "@/types/finance";
import { MOCK_GOALS } from "@/lib/mock-data";

interface GoalsState {
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, "id">) => void;
  updateGoal: (id: string, patch: Partial<FinancialGoal>) => void;
  removeGoal: (id: string) => void;
  addProgress: (id: string, amount: number) => void;
  setGoals: (goals: FinancialGoal[]) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: MOCK_GOALS,
      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goal, id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),
      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
      addProgress: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
          ),
        })),
      setGoals: (goals) => set({ goals }),
    }),
    { name: "aurix-goals" }
  )
);
