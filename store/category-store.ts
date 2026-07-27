import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExpenseCategory } from "@/types/finance";

interface CategoryCorrection {
  merchant: string;
  correctedCategory: ExpenseCategory;
  timestamp: number;
}

interface CustomCategory {
  name: string;
  keywords: string[];
  color: string;
}

interface CategoryState {
  corrections: CategoryCorrection[];
  customCategories: CustomCategory[];
  addCorrection: (merchant: string, correctedCategory: ExpenseCategory) => void;
  addCustomCategory: (cat: CustomCategory) => void;
  removeCustomCategory: (name: string) => void;
  getLearnedCategory: (merchant: string, defaultCategory: ExpenseCategory) => ExpenseCategory;
  getCategoryConfidence: (merchant: string) => number;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      corrections: [],
      customCategories: [],
      addCorrection: (merchant, correctedCategory) =>
        set((state) => {
          const filtered = state.corrections.filter((c) => c.merchant !== merchant);
          return {
            corrections: [...filtered, { merchant, correctedCategory, timestamp: Date.now() }],
          };
        }),
      addCustomCategory: (cat) =>
        set((state) => ({
          customCategories: [...state.customCategories.filter((c) => c.name !== cat.name), cat],
        })),
      removeCustomCategory: (name) =>
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.name !== name),
        })),
      getLearnedCategory: (merchant, defaultCategory) => {
        const state = get();
        const correction = state.corrections.find(
          (c) => c.merchant.toLowerCase() === merchant.toLowerCase()
        );
        if (correction) return correction.correctedCategory;
        for (const cat of state.customCategories) {
          if (cat.keywords.some((k) => merchant.toLowerCase().includes(k))) {
            return cat.name as ExpenseCategory;
          }
        }
        return defaultCategory;
      },
      getCategoryConfidence: (merchant) => {
        const state = get();
        const correction = state.corrections.find(
          (c) => c.merchant.toLowerCase() === merchant.toLowerCase()
        );
        if (!correction) return 0;
        const sameMerchantCount = state.corrections.filter(
          (c) => c.merchant.toLowerCase() === merchant.toLowerCase()
        ).length;
        return Math.min(95, 60 + sameMerchantCount * 10);
      },
    }),
    { name: "aurix-categories" }
  )
);
