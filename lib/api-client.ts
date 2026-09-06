import { config } from "./config";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  retryOn?: number[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  retryOn: [429, 503, 504],
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries!,
    initialDelay = DEFAULT_RETRY_OPTIONS.initialDelay!,
    maxDelay = DEFAULT_RETRY_OPTIONS.maxDelay!,
    retryOn = DEFAULT_RETRY_OPTIONS.retryOn!,
  } = retryOptions;

  const baseUrl = config.app.apiUrl;
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      // Success
      if (response.ok) {
        try {
          return await response.json();
        } catch {
          return {} as T;
        }
      }

      // Client errors (4xx) - don't retry
      if (response.status >= 400 && response.status < 500) {
        // Except for rate limits (429)
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
          
          console.warn(`Rate limited. Retrying after ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || response.statusText;
        } catch {
          errorMessage = response.statusText;
        }

        throw new APIError(errorMessage, response.status);
      }

      // Server errors (5xx) - retry with exponential backoff
      if (retryOn.includes(response.status) && attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.warn(
          `Request failed with ${response.status}. Retrying (${attempt + 1}/${maxRetries}) after ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable server error
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }

      throw new APIError(errorMessage, response.status);
    } catch (error) {
      lastError = error as Error;

      // AbortError (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < maxRetries) {
          const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
          console.warn(`Request timeout. Retrying (${attempt + 1}/${maxRetries}) after ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        throw new APIError("Request timeout", 504);
      }

      // Network error
      if (error instanceof TypeError) {
        if (attempt < maxRetries) {
          const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
          console.warn(`Network error. Retrying (${attempt + 1}/${maxRetries}) after ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        throw new APIError("Network error. Please check your connection.", 0);
      }

      // APIError - don't retry
      if (error instanceof APIError) {
        throw error;
      }

      // Unknown error
      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  throw lastError || new APIError("Request failed after all retries", 500);
}

export async function apiGet<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET" }, retryOptions);
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  retryOptions?: RetryOptions
): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
    retryOptions
  );
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  retryOptions?: RetryOptions
): Promise<T> {
  return apiCall<T>(
    endpoint,
    {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    },
    retryOptions
  );
}

export async function apiDelete<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
  return apiCall<T>(endpoint, { method: "DELETE" }, retryOptions);
}
