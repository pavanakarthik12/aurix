import { NextRequest, NextResponse } from "next/server";

export interface ZerodhaHolding {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  cmp: number;
  type: "equity" | "mutual_fund";
}

const SANDBOX_HOLDINGS: ZerodhaHolding[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", qty: 20, avgCost: 2400, cmp: 2850, type: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", qty: 50, avgCost: 1450, cmp: 1610, type: "equity" },
  { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 BeES", qty: 1000, avgCost: 220, cmp: 243.40, type: "equity" },
  { symbol: "PPFAS_FLEXI", name: "Parag Parikh Flexi Cap Direct", qty: 120, avgCost: 520, cmp: 574.60, type: "mutual_fund" },
  { symbol: "INFY", name: "Infosys Limited", qty: 30, avgCost: 1510, cmp: 1625, type: "equity" },
];

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-kite-apikey") || process.env.ZERODHA_API_KEY || "";
  const accessToken = req.headers.get("x-kite-accesstoken") || process.env.ZERODHA_ACCESS_TOKEN || "";

  if (!apiKey || !accessToken) {
    return NextResponse.json({
      data: SANDBOX_HOLDINGS,
      liveAccount: false,
      message: "No Zerodha API Key or Access Token configured. Showing sandbox holdings.",
    });
  }

  try {
    const res = await fetch("https://api.kite.trade/portfolio/holdings", {
      headers: {
        "X-Kite-Version": "3",
        Authorization: `token ${apiKey}:${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        data: SANDBOX_HOLDINGS,
        liveAccount: false,
        error: `Zerodha API Error (${res.status}): ${errText}`,
        message: "Failed to authenticate with Zerodha API. Showing sandbox fallback.",
      });
    }

    const result = await res.json();
    const kiteHoldings = result.data || [];

    const formattedData: ZerodhaHolding[] = kiteHoldings.map((item: any) => ({
      symbol: item.tradingsymbol || "STOCK",
      name: item.exchange ? `${item.tradingsymbol} (${item.exchange})` : item.tradingsymbol,
      qty: item.quantity || item.authorised_quantity || 0,
      avgCost: item.average_price || 0,
      cmp: item.last_price || 0,
      type: item.instrument_token ? "equity" : "mutual_fund",
    }));

    return NextResponse.json({
      data: formattedData.length > 0 ? formattedData : SANDBOX_HOLDINGS,
      liveAccount: true,
      accountInfo: {
        apiKey: apiKey.slice(0, 4) + "****",
        status: "Active Session",
      },
    });
  } catch (err) {
    return NextResponse.json({
      data: SANDBOX_HOLDINGS,
      liveAccount: false,
      error: err instanceof Error ? err.message : "Network error connecting to Zerodha",
      message: "Showing sandbox holdings fallback.",
    });
  }
}
