import { NextRequest, NextResponse } from "next/server";
const SPLITWISE_BASE = "https://secure.splitwise.com/api/v3.0";
const SPLITWISE_API_KEY = process.env.SPLITWISE_API_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint") || "get_current_user";

    if (!SPLITWISE_API_KEY) {
      return NextResponse.json(
        {
          error: "Splitwise API key not configured. Set SPLITWISE_API_KEY in your environment.",
          demo: true,
          data: getDemoSplitwiseData(endpoint),
        },
        { status: 200 }
      );
    }

    const res = await fetch(`${SPLITWISE_BASE}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${SPLITWISE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Splitwise API error (${res.status})`, demo: true, data: getDemoSplitwiseData(endpoint) },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ data, demo: false });
  } catch (err) {
    console.error("Splitwise error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Splitwise", demo: true, data: getDemoSplitwiseData("get_current_user") },
      { status: 200 }
    );
  }
}

function getDemoSplitwiseData(endpoint: string) {
  if (endpoint === "get_current_user") {
    return { user: { id: 1, first_name: "Demo", email: "demo@aurix.app" } };
  }
  if (endpoint === "get_groups") {
    return {
      groups: [
        { id: 1, name: "Flatmates", members: [{ id: 1, name: "You" }, { id: 2, name: "Rahul" }, { id: 3, name: "Priya" }] },
        { id: 2, name: "Trip to Goa", members: [{ id: 1, name: "You" }, { id: 2, name: "Amit" }, { id: 3, name: "Neha" }] },
      ],
    };
  }
  if (endpoint === "get_expenses") {
    return {
      expenses: [
        { id: 1, description: "Dinner at Social", cost: 2400, date: "2026-07-18", group_id: 1 },
        { id: 2, description: "Groceries", cost: 1800, date: "2026-07-16", group_id: 1 },
      ],
    };
  }
  return { message: "Demo data" };
}
