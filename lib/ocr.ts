import { createWorker } from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      onProgress?.({ status: m.status, progress: m.progress });
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}
