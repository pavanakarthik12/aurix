import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingProfile } from "@/types/finance";
import { derivePersona } from "@/lib/persona";

const DEFAULT_PROFILE: OnboardingProfile = {
  name: "",
  age: null,
  occupation: "",
  monthlyIncome: null,
  financialGoal: null,
  riskAppetite: null,
  monthlySavings: null,
  preferredCurrency: "INR",
};

interface PersonaState {
  profile: OnboardingProfile;
  onboardingComplete: boolean;
  updateProfile: (patch: Partial<OnboardingProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      onboardingComplete: false,
      updateProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch } })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () =>
        set({ profile: DEFAULT_PROFILE, onboardingComplete: false }),
    }),
    { name: "aurix-persona" }
  )
);

export function usePersona() {
  const profile = usePersonaStore((s) => s.profile);
  return derivePersona(profile);
}
