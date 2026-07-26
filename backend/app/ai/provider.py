from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator


@dataclass
class AIMessage:
    role: str
    content: str


@dataclass
class AIResponse:
    content: str
    model: str
    usage: dict | None = None


class AIProvider(ABC):
    """Central AI service — all features route through this."""

    @abstractmethod
    async def chat(
        self, messages: list[AIMessage], temperature: float = 0.7, max_tokens: int = 1024
    ) -> AIResponse:
        pass

    @abstractmethod
    async def chat_stream(
        self, messages: list[AIMessage], temperature: float = 0.7, max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def verify_connection(self) -> bool:
        pass
