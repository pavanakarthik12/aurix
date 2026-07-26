import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { KnowledgeBaseUpload, KnowledgeBaseSearch } from "@/features/advisor/knowledge-base";

export const metadata: Metadata = { title: "Knowledge Base" };

export default function KnowledgeBasePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Knowledge Base"
        description="Upload financial books and documents for AI-powered retrieval."
      />

      <div className="space-y-6">
        <KnowledgeBaseUpload />
        <KnowledgeBaseSearch />
      </div>
    </div>
  );
}
