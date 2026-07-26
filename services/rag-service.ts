import type { RAGDocument, RAGSearchResult } from "@/types/finance";
import { isAIReal } from "@/lib/config";

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
  const normalized = query.toLowerCase();
  const results: Record<string, { doc: RAGDocument; chunks: string[] }> = {
    "doc-1": {
      doc: MOCK_RAG_DOCUMENTS[0],
      chunks: [
        "The rich don't work for money. They make money work for them.",
        "An asset is something that puts money in your pocket. A liability is something that takes money out of your pocket.",
        "Financial intelligence is what you do with the money once you make it.",
      ],
    },
    "doc-2": {
      doc: MOCK_RAG_DOCUMENTS[1],
      chunks: [
        "Getting wealthy and staying wealthy are two different skills.",
        "Compounding works best when you give it decades.",
        "The ability to sit still and do nothing is a competitive advantage in investing.",
      ],
    },
    "doc-3": {
      doc: MOCK_RAG_DOCUMENTS[2],
      chunks: [
        "The intelligent investor is a realist who sells to optimists and buys from pessimists.",
        "Price is what you pay, value is what you get.",
        "The stock market is a voting machine in the short term and a weighing machine in the long term.",
      ],
    },
    "doc-4": {
      doc: MOCK_RAG_DOCUMENTS[3],
      chunks: [
        "Monthly budget review: set 50/30/20 targets.",
        "Emergency fund target: 6 months of essential expenses.",
        "SIP increase plan: add ₹500 every quarter.",
      ],
    },
  };

  const searchResults: RAGSearchResult[] = [];
  for (const [, data] of Object.entries(results)) {
    for (const chunk of data.chunks) {
      if (chunk.toLowerCase().includes(normalized) || normalized === "") {
        searchResults.push({
          documentId: data.doc.id,
          documentTitle: data.doc.title,
          chunk,
          pageNumber: Math.floor(Math.random() * 30) + 1,
          confidence: Math.round(50 + Math.random() * 40),
          source: data.doc.source,
        });
      }
    }
  }

  return searchResults.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
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
