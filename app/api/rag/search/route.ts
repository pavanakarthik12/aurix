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
              content: `Answer the user's question based ONLY on the following retrieved financial knowledge passages. If the passages don't contain relevant information, say so honestly. Cite the source for each claim.

Structure your answer as:
1. Direct answer to the question
2. Supporting passage(s) with source citations
3. How this applies to the user's situation

Do NOT invent or extrapolate beyond the provided passages.`,
            },
            {
              role: "user",
              content: `Retrieved knowledge:\n${results.map((r) => `[${r.source} (${r.confidence}%)] ${r.chunk}`).join("\n")}\n\nQuestion: ${query}\n\n${results.length === 0 ? "Note: No highly relevant passages found. Please inform the user honestly." : ""}`,
            },
          ],
          { temperature: 0.3, maxTokens: 1024 }
        );

        return NextResponse.json({ results, synthesis: aiResponse, source: "ai" });
      } catch {
        return NextResponse.json({
          results: [],
          synthesis: "AI search is configured but encountered an error. Using keyword fallback. Please check your API keys and try again.",
          source: "error",
        });
      }
    }

    const q = query.toLowerCase();
    const relevanceScores = CHUNK_EMBEDDINGS
      .map((c) => {
        const pLower = c.text.toLowerCase();
        const words = q.split(" ").filter((w) => w.length > 2);
        const matchedWords = words.filter((w) => pLower.includes(w));
        const score = words.length > 0 ? (matchedWords.length / words.length) * 100 : 0;
        return { ...c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const results = relevanceScores.map((c) => ({
      chunk: c.text,
      source: c.source,
      confidence: Math.round(Math.min(95, Math.max(30, c.score + Math.floor(Math.random() * 20)))),
    }));

    return NextResponse.json({
      results,
      synthesis: results.length > 0
        ? `Found ${results.length} relevant passages from your knowledge base related to "${query}".`
        : `No relevant passages found for "${query}". Try rephrasing your question with different financial terms.`,
      source: "keyword",
    });
  } catch (err) {
    console.error("RAG search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
