import { NextRequest, NextResponse } from "next/server";
import type { RAGDocument } from "@/types/finance";

const documents: RAGDocument[] = [
  {
    id: "doc-1",
    title: "Rich Dad Poor Dad",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 48,
    status: "ready",
  },
  {
    id: "doc-2",
    title: "The Psychology of Money",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 36,
    status: "ready",
  },
  {
    id: "doc-3",
    title: "The Intelligent Investor",
    type: "pdf",
    source: "Uploaded by you",
    uploadedAt: new Date().toISOString().split("T")[0],
    chunkCount: 72,
    status: "ready",
  },
];

export async function GET() {
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Supported: PDF, DOCX, TXT" },
        { status: 400 }
      );
    }

    const newDoc: RAGDocument = {
      id: `doc-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type: file.type === "application/pdf" ? "pdf" : file.type.includes("wordprocessing") ? "docx" : "txt",
      source: "Uploaded by you",
      uploadedAt: new Date().toISOString().split("T")[0],
      chunkCount: 0,
      status: "processing",
    };

    documents.push(newDoc);

    setTimeout(() => {
      const idx = documents.findIndex((d) => d.id === newDoc.id);
      if (idx !== -1) {
        documents[idx].status = "ready";
        documents[idx].chunkCount = Math.floor(Math.random() * 30) + 10;
      }
    }, 3000);

    return NextResponse.json({ document: newDoc, message: "Document uploaded. Processing has started." });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
