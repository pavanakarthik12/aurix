function env(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const config = {
  ai: {
    provider: env("NEXT_PUBLIC_AI_PROVIDER", "backend"),
    grokEndpoint: "/api/v1/ai/chat",
  },
  ocr: {
    provider: env("NEXT_PUBLIC_OCR_PROVIDER", "tesseract"),
  },
  rag: {
    provider: env("NEXT_PUBLIC_RAG_PROVIDER", "chromadb"),
    chunkSize: parseInt(env("NEXT_PUBLIC_CHUNK_SIZE", "512"), 10),
    chunkOverlap: parseInt(env("NEXT_PUBLIC_CHUNK_OVERLAP", "64"), 10),
  },
  app: {
    url: env("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    apiUrl: env("NEXT_PUBLIC_API_URL", "http://localhost:8000"),
  },
} as const;

export function isAIReal(): boolean {
  return config.ai.provider === "backend";
}

export function isOCRReal(): boolean {
  return config.ocr.provider !== "mock";
}

export function isRAGReal(): boolean {
  return config.rag.provider !== "mock";
}

export function getAIProviderLabel(): string {
  return "Grok (xAI)";
}
