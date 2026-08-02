import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

function apiBase(): string {
  return config.app.apiUrl || "http://localhost:8000";
}

export async function GET() {
  try {
    return NextResponse.json({
      status: "operational",
      message: "Use POST with transactions to get insights",
    });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const income = Number(body.income || 0);
    if (!income || income <= 0) {
      return NextResponse.json({ error: "income is required" }, { status: 400 });
    }

    const res = await fetch(`${apiBase()}/api/v1/intelligence/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income }),
    });
    const data = await res.json();
    return NextResponse.json({ insights: data.insights, source: "postgres", provider: "backend" }, { status: res.status });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
