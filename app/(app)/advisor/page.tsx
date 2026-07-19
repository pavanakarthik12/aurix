import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AdvisorChat } from "@/features/advisor/advisor-chat";

export const metadata: Metadata = { title: "AI Advisor" };

export default function AdvisorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="AI Advisor"
        description="Personalized financial guidance grounded in proven principles."
      />
      <AdvisorChat />
    </div>
  );
}
