import type { RAGDocument, RAGSearchResult } from "@/types/finance";

export const MOCK_RAG_DOCUMENTS: RAGDocument[] = [
  {
    id: "doc-1",
    title: "Rich Dad Poor Dad",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: "2026-07-15",
    chunkCount: 48,
    status: "ready",
  },
  {
    id: "doc-2",
    title: "The Psychology of Money",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: "2026-07-12",
    chunkCount: 36,
    status: "ready",
  },
  {
    id: "doc-3",
    title: "The Intelligent Investor",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: "2026-07-10",
    chunkCount: 72,
    status: "ready",
  },
  {
    id: "doc-4",
    title: "Personal Finance Notes 2026",
    type: "txt",
    source: "Uploaded by you",
    uploadedAt: "2026-07-08",
    chunkCount: 12,
    status: "ready",
  },
  {
    id: "doc-5",
    title: "Investment Research - Q2",
    type: "article",
    source: "Saved from web",
    uploadedAt: "2026-07-05",
    chunkCount: 24,
    status: "processing",
  },
];

export function getRAGDocuments(): RAGDocument[] {
  return MOCK_RAG_DOCUMENTS;
}

export function searchKnowledgeBase(query: string): RAGSearchResult[] {
  const normalized = query.toLowerCase();

  const results: Record<string, { doc: RAGDocument; chunks: string[] }> = {
    "doc-1": {
      doc: MOCK_RAG_DOCUMENTS[0],
      chunks: [
        "The rich don't work for money. They make money work for them. Every rupee you save is a employee working to earn you more.",
        "An asset is something that puts money in your pocket. A liability is something that takes money out of your pocket.",
        "Financial intelligence is what you do with the money once you make it — how to keep it, grow it, and use it.",
      ],
    },
    "doc-2": {
      doc: MOCK_RAG_DOCUMENTS[1],
      chunks: [
        "Getting wealthy and staying wealthy are two different skills. The first requires aggression, the second requires humility.",
        "Compounding works best when you give it decades. The most important factor in building wealth is time, not timing.",
        "The ability to sit still and do nothing is a competitive advantage in investing.",
      ],
    },
    "doc-3": {
      doc: MOCK_RAG_DOCUMENTS[2],
      chunks: [
        "The intelligent investor is a realist who sells to optimists and buys from pessimists — not someone who tries to predict the future.",
        "Price is what you pay, value is what you get. The margin of safety is the difference between the two.",
        "The stock market is a voting machine in the short term and a weighing machine in the long term.",
      ],
    },
    "doc-4": {
      doc: MOCK_RAG_DOCUMENTS[3],
      chunks: [
        "Monthly budget review: set 50/30/20 targets. Needs at 50%, wants at 30%, savings at 20%.",
        "Emergency fund target: 6 months of essential expenses = ₹2,40,000. Current: ₹2,10,000. Progress: 87.5%.",
        "SIP increase plan: add ₹500 every quarter until reaching 30% of income.",
      ],
    },
  };

  const searchResults: RAGSearchResult[] = [];

  for (const [, data] of Object.entries(results)) {
    for (const chunk of data.chunks) {
      if (chunk.toLowerCase().includes(normalized) || normalized === "") {
        const relevance = normalized
          ? chunk.toLowerCase().split(" ").filter((w) => normalized.includes(w)).length / chunk.split(" ").length
          : 0.5;
        const confidence = Math.min(95, Math.round(50 + relevance * 100));
        searchResults.push({
          documentId: data.doc.id,
          documentTitle: data.doc.title,
          chunk,
          pageNumber: Math.floor(Math.random() * 30) + 1,
          confidence,
          source: data.doc.source,
        });
      }
    }
  }

  return searchResults.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
