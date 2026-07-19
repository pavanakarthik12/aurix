"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Home, Landmark, Plane, PiggyBank, ShieldCheck, Sprout, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SelectCard } from "@/components/shared/select-card";
import { PersonaCard } from "@/features/onboarding/persona-card";
import { usePersonaStore, usePersona } from "@/store/persona-store";
import type { FinancialGoalType, RiskAppetite } from "@/types/finance";

const STEPS = ["About you", "Your finances", "Your goal", "Risk appetite", "Your persona"];

const GOALS: { value: FinancialGoalType; label: string; description: string; icon: typeof Home }[] = [
  { value: "emergency-fund", label: "Build an emergency fund", description: "3-6 months of expenses saved", icon: ShieldCheck },
  { value: "debt-payoff", label: "Pay off debt", description: "Become debt-free faster", icon: Landmark },
  { value: "wealth-growth", label: "Grow long-term wealth", description: "Investing and compounding", icon: Sprout },
  { value: "home-purchase", label: "Buy a home", description: "Save toward a down payment", icon: Home },
  { value: "retirement", label: "Plan for retirement", description: "Secure your future self", icon: PiggyBank },
  { value: "travel", label: "Travel & lifestyle", description: "Fund experiences you value", icon: Plane },
];

const RISKS: { value: RiskAppetite; label: string; description: string; icon: typeof ShieldCheck }[] = [
  { value: "conservative", label: "Conservative", description: "Prioritize capital protection", icon: ShieldCheck },
  { value: "moderate", label: "Moderate", description: "Balanced growth and safety", icon: Sprout },
  { value: "aggressive", label: "Aggressive", description: "Maximize long-term growth", icon: Rocket },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const profile = usePersonaStore((s) => s.profile);
  const updateProfile = usePersonaStore((s) => s.updateProfile);
  const completeOnboarding = usePersonaStore((s) => s.completeOnboarding);
  const persona = usePersona();

  const isLast = step === STEPS.length - 1;
  const canAdvance = React.useMemo(() => {
    if (step === 0) return profile.name.trim().length > 1 && profile.occupation.trim().length > 1;
    if (step === 1) return !!profile.monthlyIncome && !!profile.monthlySavings;
    if (step === 2) return !!profile.financialGoal;
    if (step === 3) return !!profile.riskAppetite;
    return true;
  }, [step, profile]);

  function next() {
    if (isLast) {
      completeOnboarding();
      router.push("/dashboard");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Tell us about you</h2>
                <p className="text-sm text-muted-foreground">This helps us personalize your experience.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Ananya Rao"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={13}
                    value={profile.age ?? ""}
                    onChange={(e) => updateProfile({ age: e.target.value ? Number(e.target.value) : null })}
                    placeholder="28"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={profile.occupation}
                    onChange={(e) => updateProfile({ occupation: e.target.value })}
                    placeholder="Product Manager"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Your finances</h2>
                <p className="text-sm text-muted-foreground">
                  Rough numbers are fine — you can refine these later.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Monthly income (₹)</Label>
                <Input
                  id="income"
                  type="number"
                  min={0}
                  value={profile.monthlyIncome ?? ""}
                  onChange={(e) =>
                    updateProfile({ monthlyIncome: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="85000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savings">Monthly savings (₹)</Label>
                <Input
                  id="savings"
                  type="number"
                  min={0}
                  value={profile.monthlySavings ?? ""}
                  onChange={(e) =>
                    updateProfile({ monthlySavings: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="20000"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">What&apos;s your main financial goal?</h2>
                <p className="text-sm text-muted-foreground">Choose the one that matters most right now.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((goal) => (
                  <SelectCard
                    key={goal.value}
                    icon={goal.icon}
                    title={goal.label}
                    description={goal.description}
                    selected={profile.financialGoal === goal.value}
                    onClick={() => updateProfile({ financialGoal: goal.value })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">How do you feel about risk?</h2>
                <p className="text-sm text-muted-foreground">
                  This shapes how we frame recommendations for you.
                </p>
              </div>
              <div className="grid gap-3">
                {RISKS.map((risk) => (
                  <SelectCard
                    key={risk.value}
                    icon={risk.icon}
                    title={risk.label}
                    description={risk.description}
                    selected={profile.riskAppetite === risk.value}
                    onClick={() => updateProfile({ riskAppetite: risk.value })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Meet your Financial Persona</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll use this to tailor insights and recommendations.
                </p>
              </div>
              <PersonaCard persona={persona} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={next} disabled={!canAdvance}>
          {isLast ? "Go to dashboard" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
