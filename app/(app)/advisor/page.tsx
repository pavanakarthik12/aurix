import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "AI Advisor" };

export default function AdvisorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="AI Advisor"
        description="Personalized financial guidance grounded in proven principles."
      />
      <EmptyState
        icon={Sparkles}
        title="Your AI Advisor is on the way"
        description="Conversational, personalized financial guidance is coming in the next release. Use the assistant button in the corner for a preview."
        className="py-24"
      />
    </div>
  );
}
