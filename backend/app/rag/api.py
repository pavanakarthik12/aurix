from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.rag.embeddings import EmbeddingGenerator
from app.rag.retriever import RAGRetriever

router = APIRouter(prefix="/rag", tags=["RAG"])


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    model: str = "BAAI/bge-base-en-v1.5"
    dimension: int


class SearchRequest(BaseModel):
    query: str
    collection: str = "documents"
    top_k: int = 5


class SearchResult(BaseModel):
    chunk: str
    source: str
    confidence: float
    metadata: dict | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int


@router.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    try:
        generator = EmbeddingGenerator()
        embedding = generator.generate_single(request.text)
        return EmbedResponse(embedding=embedding, dimension=len(embedding))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {e}")


@router.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    try:
        retriever = RAGRetriever()
        results = await retriever.retrieve_with_scores(
            query=request.query,
            collection=request.collection,
            top_k=request.top_k,
        )
        return SearchResponse(results=[SearchResult(**r) for r in results], total=len(results))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {e}")
