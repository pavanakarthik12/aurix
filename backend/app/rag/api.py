from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from pathlib import Path
import tempfile
import os
from loguru import logger

from app.rag.embeddings import EmbeddingGenerator
from app.rag.retriever import RAGRetriever
from app.rag.loader import DocumentLoader
from app.rag.chunker import TextChunker
from app.rag.vectorstore import VectorStore

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


class UploadResponse(BaseModel):
    document_id: str
    title: str
    chunk_count: int
    status: str = "ready"


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


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


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), collection: str = "documents"):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Supported: PDF, DOCX, TXT")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        loader = DocumentLoader()
        text = loader.load(tmp_path)

        chunker = TextChunker()
        chunks = chunker.chunk(text)

        if not chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")

        embedder = EmbeddingGenerator()
        embeddings = embedder.generate(chunks)

        vectorstore = VectorStore()
        title = Path(file.filename).stem
        metadata = [{"source": title, "chunk_index": i, "filename": file.filename} for i in range(len(chunks))]
        vectorstore.add_document(collection, chunks, embeddings, metadata)

        logger.info(f"Uploaded '{file.filename}': {len(chunks)} chunks stored in collection '{collection}'")

        return UploadResponse(
            document_id=f"doc-{hash(file.filename)}",
            title=title,
            chunk_count=len(chunks),
            status="ready",
        )
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload processing error: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/documents")
async def list_documents(collection: str = "documents"):
    try:
        vectorstore = VectorStore()
        col = vectorstore.get_or_create_collection(collection)
        count = col.count()
        return {"collection": collection, "document_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing documents: {e}")
