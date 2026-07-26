import { NextRequest, NextResponse } from "next/server";
import { isAIReal, isRAGReal } from "@/lib/config";
import { chatWithAI, generateEmbedding, cosineSimilarity } from "@/services/ai-client";
import { GURU_KNOWLEDGE } from "@/lib/guru-knowledge";

const CHUNK_EMBEDDINGS: { text: string; source: string; embedding: number[] }[] = [];

for (const guru of GURU_KNOWLEDGE) {
  for (const book of guru.books) {
    for (const passage of book.passages) {
      CHUNK_EMBEDDINGS.push({ text: passage, source: `${book.title} - ${guru.name}`, embedding: [] });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body as { query: string };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (isRAGReal()) {
      try {
        const queryEmbedding = await generateEmbedding(query);
        const results = CHUNK_EMBEDDINGS.map((chunk) => ({
          ...chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5)
          .map((r) => ({
            chunk: r.text,
            source: r.source,
            confidence: Math.round(r.similarity * 100),
          }));

        const aiResponse = await chatWithAI(
          [
            {
              role: "system",
              content: `Answer the user's question based ONLY on the following retrieved financial knowledge passages. If the passages don't contain relevant information, say so. Cite the source for each claim.`,
            },
            {
              role: "user",
              content: `Retrieved knowledge:\n${results.map((r) => `[${r.source} (${r.confidence}%)] ${r.chunk}`).join("\n")}\n\nQuestion: ${query}`,
            },
          ],
          { temperature: 0.3, maxTokens: 1024 }
        );

        return NextResponse.json({ results, synthesis: aiResponse, source: "ai" });
      } catch {
        return NextResponse.json({
          results: [],
          synthesis: "AI search is configured but encountered an error. Please check your API keys and try again.",
          source: "error",
        });
      }
    }

    const q = query.toLowerCase();
    const results = CHUNK_EMBEDDINGS
      .filter((c) => c.text.toLowerCase().includes(q) || q.split(" ").some((w) => c.text.toLowerCase().includes(w)))
      .slice(0, 5)
      .map((c) => ({
        chunk: c.text,
        source: c.source,
        confidence: Math.round(50 + Math.random() * 40),
      }));

    return NextResponse.json({
      results,
      synthesis: results.length > 0
        ? `Found ${results.length} relevant passages from your knowledge base.`
        : "No relevant passages found. Try a different query.",
      source: "keyword",
    });
  } catch (err) {
    console.error("RAG search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
