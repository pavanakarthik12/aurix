"use client";

import { usePersona } from "@/store/persona-store";
import { PersonaCard } from "@/features/onboarding/persona-card";

export function DashboardPersonaCard() {
  const persona = usePersona();
  return <PersonaCard persona={persona} className="h-full" />;
}
