from pydantic import BaseModel


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
