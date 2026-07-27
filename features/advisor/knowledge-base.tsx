"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Upload, FileText, BookOpen, File as FileIcon, Loader2,
  ChevronRight, ExternalLink, Clock, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { RAGDocument, RAGSearchResult } from "@/types/finance";
import { getRAGDocuments, searchKnowledgeBase } from "@/services/rag-service";

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText, docx: FileText, txt: FileIcon, article: BookOpen,
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; variant: "success" | "secondary" | "destructive" }> = {
  ready: { icon: CheckCircle2, label: "Ready", variant: "success" },
  processing: { icon: Loader2, label: "Processing", variant: "secondary" },
  error: { icon: AlertCircle, label: "Error", variant: "destructive" },
};

export function KnowledgeBaseUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getRAGDocuments().then(setDocuments);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/rag/documents", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const result = await res.json();
      setDocuments((prev) => [result.document, ...prev]);
      toast.success(`"${file.name}" uploaded successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => uploadFile(f));
  }, [uploadFile]);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.txt";
    input.multiple = false;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.[0]) uploadFile(files[0]);
    };
    input.click();
  }, [uploadFile]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>Upload financial books, articles, and documents for AI-powered retrieval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT — max 20MB each</p>
          </div>
          <Button variant="outline" size="sm" disabled={uploading} onClick={handleFileSelect}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Document</>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Uploaded Documents ({documents.length})
          </p>
          {documents.map((doc) => {
            const DocIcon = DOC_TYPE_ICONS[doc.type] || FileIcon;
            const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.processing;
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                  <DocIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.chunkCount} chunks</span>
                    <span>·</span>
                    <span>{doc.uploadedAt}</span>
                    <span>·</span>
                    <span>{doc.type.toUpperCase()}</span>
                  </div>
                </div>
                <Badge variant={status.variant} className="gap-1 text-[10px]">
                  <StatusIcon className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                  {status.label}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function KnowledgeBaseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RAGSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = await searchKnowledgeBase(query);
    setResults(res);
    setSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Knowledge Base</CardTitle>
        <CardDescription>Search across all uploaded financial documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your financial library…" />
          <Button type="submit" size="icon" disabled={!query.trim() || searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <AnimatePresence>
          {searching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2 rounded-lg border border-border p-4">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!searching && searched && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{results.length} results found</p>
            {results.map((result, i) => (
              <motion.div
                key={`${result.documentId}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{result.documentTitle}</Badge>
                  {result.pageNumber && <Badge variant="muted" className="text-[10px]">p.{result.pageNumber}</Badge>}
                  <Badge variant="secondary" className="ml-auto text-[10px]">{result.confidence}%</Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">&ldquo;{result.chunk}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
