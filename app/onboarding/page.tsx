import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Set up your financial persona" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <OnboardingWizard />
      </main>
    </div>
  );
}
