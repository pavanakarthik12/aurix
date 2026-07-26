from loguru import logger

from app.rag.embeddings import EmbeddingGenerator
from app.rag.vectorstore import VectorStore


class RAGRetriever:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embedder = EmbeddingGenerator()

    async def retrieve(self, query: str, collection: str = "documents", top_k: int = 5) -> list[dict]:
        logger.debug(f"Retrieving for: '{query}' from '{collection}'")
        query_embedding = self.embedder.generate_single(query)
        results = self.vector_store.search(collection, query_embedding, top_k=top_k)

        retrieved = []
        if results and results.get("documents"):
            for i, doc in enumerate(results["documents"][0]):
                retrieved.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                    "distance": results["distances"][0][i] if results.get("distances") else 0,
                })

        logger.debug(f"Retrieved {len(retrieved)} results")
        return retrieved

    async def retrieve_with_scores(self, query: str, collection: str = "documents", top_k: int = 5):
        results = await self.retrieve(query, collection, top_k)
        return [
            {
                "chunk": r["content"],
                "source": r["metadata"].get("source", "unknown"),
                "confidence": max(0, min(100, round((1 - r["distance"]) * 100))),
                "metadata": r["metadata"],
            }
            for r in results
        ]
