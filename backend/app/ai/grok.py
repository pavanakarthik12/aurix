import asyncio
import time
from typing import AsyncGenerator

import httpx
from loguru import logger

from app.ai.provider import AIProvider, AIMessage, AIResponse
from app.core.config import settings


class GrokConnectionError(Exception):
    pass


class GrokAuthError(Exception):
    pass


class GrokRateLimitError(Exception):
    pass


class GrokTimeoutError(Exception):
    pass


class GrokProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.GROK_API_KEY
        self.api_base = settings.GROK_API_BASE
        self.model = settings.GROK_MODEL
        self.timeout = settings.GROK_TIMEOUT
        self.max_retries = settings.GROK_MAX_RETRIES
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.api_base,
                timeout=httpx.Timeout(self.timeout, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=20),
            )
        return self._client

    async def _request(self, payload: dict, stream: bool = False) -> httpx.Response:
        if not self.api_key:
            raise GrokAuthError("GROK_API_KEY is not configured in .env")

        last_error: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }

                url = f"{self.api_base}/chat/completions"

                if stream:
                    headers["Accept"] = "text/event-stream"

                response = await self.client.post(url, json=payload, headers=headers)

                if response.status_code == 401:
                    raise GrokAuthError("Invalid Grok API key — authentication failed")
                if response.status_code == 429:
                    wait = min(2**attempt, 30)
                    logger.warning(f"Grok rate limited (attempt {attempt}/{self.max_retries}), retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue
                if response.status_code == 503:
                    wait = min(2**attempt, 30)
                    logger.warning(f"Grok service unavailable (attempt {attempt}/{self.max_retries}), retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
                return response

            except httpx.TimeoutException as e:
                last_error = GrokTimeoutError(f"Grok request timed out after {self.timeout}s (attempt {attempt}/{self.max_retries})")
                logger.warning(str(last_error))
                if attempt < self.max_retries:
                    await asyncio.sleep(min(2**attempt, 10))
            except (GrokAuthError, GrokRateLimitError) as e:
                raise e
            except httpx.HTTPStatusError as e:
                last_error = GrokConnectionError(f"Grok HTTP error {e.response.status_code}: {e.response.text[:200]}")
                logger.error(str(last_error))
                if attempt < self.max_retries:
                    await asyncio.sleep(min(2**attempt, 10))
            except httpx.RequestError as e:
                last_error = GrokConnectionError(f"Grok connection failed: {e}")
                logger.warning(str(last_error))
                if attempt < self.max_retries:
                    await asyncio.sleep(min(2**attempt, 10))

        raise last_error or GrokConnectionError("All Grok retry attempts failed")

    async def chat(
        self, messages: list[AIMessage], temperature: float = 0.7, max_tokens: int = 1024
    ) -> AIResponse:
        start = time.time()
        payload = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        logger.info(f"Grok chat request: model={self.model} messages={len(messages)} temperature={temperature}")

        try:
            response = await self._request(payload)
            data = response.json()

            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage")
            elapsed = time.time() - start

            logger.info(f"Grok chat success: model={self.model} tokens={usage} elapsed={elapsed:.2f}s")
            return AIResponse(content=content, model=self.model, usage=usage)

        except GrokAuthError:
            elapsed = time.time() - start
            logger.error(f"Grok auth failed: invalid API key | elapsed={elapsed:.2f}s")
            raise
        except GrokTimeoutError:
            elapsed = time.time() - start
            logger.error(f"Grok timeout after {elapsed:.2f}s")
            raise
        except Exception as e:
            elapsed = time.time() - start
            logger.error(f"Grok chat failed: {e} | elapsed={elapsed:.2f}s")
            raise GrokConnectionError(f"AI service unavailable: {e}")

    async def chat_stream(
        self, messages: list[AIMessage], temperature: float = 0.7, max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        logger.info(f"Grok stream request: model={self.model} messages={len(messages)}")

        response = await self._request(payload, stream=True)

        async for line in response.aiter_lines():
            if line.startswith("data: "):
                chunk = line[6:]
                if chunk == "[DONE]":
                    break
                yield chunk

    async def verify_connection(self) -> bool:
        try:
            logger.info("Verifying Grok API connection...")
            response = await self.chat(
                [AIMessage(role="user", content="Reply with only the word: connected")],
                temperature=0.1,
                max_tokens=10,
            )
            is_ok = "connected" in response.content.lower()
            if is_ok:
                logger.success("✓ Grok Connected Successfully")
            else:
                logger.warning("Grok responded but with unexpected content")
            return is_ok
        except GrokAuthError:
            logger.error("✗ Grok Connection Failed: Invalid API key")
            return False
        except GrokTimeoutError:
            logger.error("✗ Grok Connection Failed: Request timed out")
            return False
        except GrokConnectionError as e:
            logger.error(f"✗ Grok Connection Failed: {e}")
            return False
        except Exception as e:
            logger.error(f"✗ Grok Connection Failed: {e}")
            return False

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
