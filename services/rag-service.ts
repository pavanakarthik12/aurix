import type { RAGDocument, RAGSearchResult } from "@/types/finance";
import { isAIReal } from "@/lib/config";
import { searchFinancialBooks } from "@/lib/financial-engine";

export async function getRAGDocuments(): Promise<RAGDocument[]> {
  try {
    const res = await fetch("/api/rag/documents");
    if (res.ok) {
      const data = await res.json();
      return data.documents || [];
    }
  } catch { /* fall through */ }
  return MOCK_RAG_DOCUMENTS;
}

export async function searchKnowledgeBase(query: string): Promise<RAGSearchResult[]> {
  if (isAIReal()) {
    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((r: { chunk: string; source: string; confidence: number }, i: number) => ({
          documentId: `doc-${i}`,
          documentTitle: r.source,
          chunk: r.chunk,
          confidence: r.confidence,
          source: r.source,
        }));
      }
    } catch { /* fall through */ }
  }

  return localSearch(query);
}

function localSearch(query: string): RAGSearchResult[] {
  const books = searchFinancialBooks(query);
  return books.slice(0, 5).map((b, i) => ({
    documentId: `doc-${i}`,
    documentTitle: b.source,
    chunk: b.passage,
    confidence: b.confidence,
    source: b.source,
  }));
}

export const MOCK_RAG_DOCUMENTS: RAGDocument[] = [
  {
    id: "doc-1",
    title: "Rich Dad Poor Dad",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 48,
    status: "ready",
  },
  {
    id: "doc-2",
    title: "The Psychology of Money",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 36,
    status: "ready",
  },
  {
    id: "doc-3",
    title: "The Intelligent Investor",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 72,
    status: "ready",
  },
  {
    id: "doc-4",
    title: "Personal Finance Notes 2026",
    type: "txt",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 12,
    status: "ready",
  },
];
