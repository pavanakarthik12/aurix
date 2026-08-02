import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

function apiBase(): string {
  return config.app.apiUrl || "http://localhost:8000";
}

interface HealthScoreFactors {
  savingsRate: number;
  debtRatio: number;
  emergencyFund: number;
  expenseStability: number;
  budgetAdherence: number;
  goalProgress: number;
  incomeGrowth: number;
  investmentRatio: number;
}

export async function GET(req: NextRequest) {
  try {
    const income = Number(req.nextUrl.searchParams.get("income") || 0);
    if (!income || income <= 0) {
      return NextResponse.json({ error: "income query parameter is required" }, { status: 400 });
    }

    const res = await fetch(`${apiBase()}/api/v1/intelligence/summary?income=${encodeURIComponent(String(income))}`);
    const data = await res.json();
    return NextResponse.json(data.health_score, { status: res.status });
  } catch (err) {
    console.error("Health score error:", err);
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    return NextResponse.json(data.health_score, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 });
  }
}
