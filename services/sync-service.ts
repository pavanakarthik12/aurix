import { config } from "@/lib/config";
import { useExpensesStore, type TrackedTransaction } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { useCategoryStore } from "@/store/category-store";

function apiUrl(path: string): string {
  const base = config.app.apiUrl || "http://localhost:8000";
  return `${base}/api/v1${path}`;
}

export async function syncToBackend(): Promise<{ transaction_count: number; goal_count: number } | null> {
  try {
    const transactions = useExpensesStore.getState().transactions;
    const goals = useGoalsStore.getState().goals;

    const res = await fetch(apiUrl("/data/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions: transactions.map((t: TrackedTransaction) => ({
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          date: t.date,
          source: t.source,
        })),
        goals: goals.map((g) => ({
          title: g.title,
          target_amount: g.targetAmount,
          current_amount: g.currentAmount,
          target_date: g.targetDate,
          type: g.type,
        })),
      }),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend sync unavailable:", err);
    return null;
  }
}

export async function loadFromBackend(): Promise<boolean> {
  try {
    const [txRes, goalRes] = await Promise.all([
      fetch(apiUrl("/data/transactions?limit=1000")),
      fetch(apiUrl("/data/goals")),
    ]);

    if (!txRes.ok || !goalRes.ok) throw new Error("Failed to load from backend");

    const txData = await txRes.json();
    const goalData = await goalRes.json();

    if (txData.transactions?.length) {
      useExpensesStore.getState().setTransactions(
        txData.transactions.map((t: any) => ({
          id: t.id,
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          date: t.date,
          source: t.source || "manual",
        }))
      );
    }

    if (goalData.goals?.length) {
      useGoalsStore.getState().setGoals(
        goalData.goals.map((g: any) => ({
          id: g.id,
          title: g.title,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount,
          targetDate: g.target_date,
          type: g.type,
        }))
      );
    }

    return true;
  } catch (err) {
    console.warn("Backend load unavailable, using local storage:", err);
    return false;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/data/health"));
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncCategoryToBackend(category: { name: string; parent_category?: string; is_custom?: boolean }) {
  try {
    const res = await fetch(apiUrl("/data/categories"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadCategoriesFromBackend() {
  try {
    const res = await fetch(apiUrl("/data/categories"));
    if (!res.ok) return;
    const data = await res.json();
    const store = useCategoryStore.getState();
    for (const cat of data.categories || []) {
      if (cat.is_custom) {
        store.addCustomCategory({ name: cat.name, keywords: [], color: "#6366f1" });
      }
    }
  } catch {
    // silent
  }
}
