import { NextResponse } from "next/server";

// Fallback market values in case of API failure or offline mode
const FALLBACK_MARKET_DATA = [
  { symbol: "NIFTY 50", name: "Nifty 50", price: 24340.50, change: 112.30, changePercent: 0.46, positive: true },
  { symbol: "SENSEX", name: "BSE Sensex", price: 79820.10, change: 345.80, changePercent: 0.43, positive: true },
  { symbol: "GOLD 24K", name: "Gold (10g)", price: 72150.00, change: -180.00, changePercent: -0.25, positive: false },
  { symbol: "USD/INR", name: "USD to INR", price: 83.54, change: 0.08, changePercent: 0.10, positive: true },
  { symbol: "NIFTY IT", name: "Nifty IT Index", price: 38920.40, change: 480.15, changePercent: 1.25, positive: true },
  { symbol: "BANK NIFTY", name: "Nifty Bank", price: 51240.80, change: -120.40, changePercent: -0.23, positive: false },
];

async function fetchYahooFinancePrice(ticker: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`, {
      next: { revalidate: 60 }, // Cache response for 1 minute
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const price = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.chartPreviousClose;
    if (price === undefined || previousClose === undefined) return null;
    
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Attempt to fetch real-time market data from Yahoo Finance
    const [nifty, sensex, usdInr, bankNifty] = await Promise.all([
      fetchYahooFinancePrice("%5ENSEI"),
      fetchYahooFinancePrice("%5EBSESN"),
      fetchYahooFinancePrice("USDINR=X"),
      fetchYahooFinancePrice("%5ENSEIBANK")
    ]);

    const data = [
      {
        symbol: "NIFTY 50",
        name: "Nifty 50",
        price: nifty?.price ?? FALLBACK_MARKET_DATA[0].price,
        change: nifty?.change ?? FALLBACK_MARKET_DATA[0].change,
        changePercent: nifty?.changePercent ?? FALLBACK_MARKET_DATA[0].changePercent,
        positive: (nifty?.change ?? FALLBACK_MARKET_DATA[0].change) >= 0
      },
      {
        symbol: "SENSEX",
        name: "BSE Sensex",
        price: sensex?.price ?? FALLBACK_MARKET_DATA[1].price,
        change: sensex?.change ?? FALLBACK_MARKET_DATA[1].change,
        changePercent: sensex?.changePercent ?? FALLBACK_MARKET_DATA[1].changePercent,
        positive: (sensex?.change ?? FALLBACK_MARKET_DATA[1].change) >= 0
      },
      {
        symbol: "GOLD 24K",
        name: "Gold (10g)",
        price: FALLBACK_MARKET_DATA[2].price,
        change: FALLBACK_MARKET_DATA[2].change,
        changePercent: FALLBACK_MARKET_DATA[2].changePercent,
        positive: FALLBACK_MARKET_DATA[2].change >= 0
      },
      {
        symbol: "USD/INR",
        name: "USD to INR",
        price: usdInr?.price ?? FALLBACK_MARKET_DATA[3].price,
        change: usdInr?.change ?? FALLBACK_MARKET_DATA[3].change,
        changePercent: usdInr?.changePercent ?? FALLBACK_MARKET_DATA[3].changePercent,
        positive: (usdInr?.change ?? FALLBACK_MARKET_DATA[3].change) >= 0
      },
      {
        symbol: "BANK NIFTY",
        name: "Nifty Bank",
        price: bankNifty?.price ?? FALLBACK_MARKET_DATA[5].price,
        change: bankNifty?.change ?? FALLBACK_MARKET_DATA[5].change,
        changePercent: bankNifty?.changePercent ?? FALLBACK_MARKET_DATA[5].changePercent,
        positive: (bankNifty?.change ?? FALLBACK_MARKET_DATA[5].change) >= 0
      }
    ];

    return NextResponse.json({ data, live: !!nifty });
  } catch (err) {
    return NextResponse.json({ data: FALLBACK_MARKET_DATA, live: false });
  }
}
