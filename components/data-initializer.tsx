"use client";

import { useEffect, useRef } from "react";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { loadFromBackend, syncToBackend } from "@/services/sync-service";

export function DataInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadFromBackend().catch(() => {});
  }, []);

  const txCount = useExpensesStore((s) => s.transactions.length);
  const goalCount = useGoalsStore((s) => s.goals.length);
  const lastSync = useRef({ txCount: 0, goalCount: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (txCount === lastSync.current.txCount && goalCount === lastSync.current.goalCount) return;
    lastSync.current = { txCount, goalCount };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      syncToBackend().then((r) => {
        if (r) lastSync.current = { txCount, goalCount };
      });
    }, 3000);
  }, [txCount, goalCount]);

  return null;
}
