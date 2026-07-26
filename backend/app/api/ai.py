from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ai.grok import GrokProvider, GrokAuthError, GrokConnectionError, GrokTimeoutError
from app.ai.provider import AIMessage

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int = 1024


class ChatResponse(BaseModel):
    content: str
    model: str
    usage: dict | None = None


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    model: str
    dimension: int


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    provider = GrokProvider()
    try:
        messages = [AIMessage(role=m["role"], content=m["content"]) for m in request.messages]
        response = await provider.chat(messages, temperature=request.temperature, max_tokens=request.max_tokens)
        return ChatResponse(content=response.content, model=response.model, usage=response.usage)
    except GrokAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except GrokTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except GrokConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {e}")
    finally:
        await provider.close()


@router.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    from app.rag.embeddings import EmbeddingGenerator
    try:
        generator = EmbeddingGenerator()
        embedding = generator.generate_single(request.text)
        return EmbedResponse(embedding=embedding, model="BAAI/bge-base-en-v1.5", dimension=len(embedding))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {e}")
