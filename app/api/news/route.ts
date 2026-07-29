import { NextResponse } from "next/server";

export interface FinancialNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "Tax Planning" | "Mutual Funds & SIP" | "Stock Market" | "Personal Finance";
  url: string;
  publishedAt: string;
}

const FALLBACK_NEWS: FinancialNewsItem[] = [
  {
    id: "news-1",
    title: "New Tax Regime vs Old Tax Regime: How Section 87A rebate benefits salaried taxpayers in FY 2024-25",
    summary: "Salaried individuals earning up to ₹7.75 Lakh can claim a full tax waiver under the New Tax Regime with standard deduction of ₹75,000.",
    source: "The Economic Times",
    category: "Tax Planning",
    url: "https://economictimes.indiatimes.com/wealth/tax",
    publishedAt: "2 hours ago",
  },
  {
    id: "news-2",
    title: "Why Step-Up SIP outperforms traditional SIPs over a 15-year wealth creation cycle",
    summary: "Increasing your monthly mutual fund SIP contribution by just 10% each year can boost your final corpus by up to 70% due to power compounding.",
    source: "Moneycontrol",
    category: "Mutual Funds & SIP",
    url: "https://www.moneycontrol.com/mutual-funds/",
    publishedAt: "4 hours ago",
  },
  {
    id: "news-3",
    title: "Nifty 50 trades near all-time high: Retail investors increase direct equity allocations in banking and IT sectors",
    summary: "Foreign Institutional Investors (FIIs) turn net buyers while domestic mutual funds maintain steady inflows into large-cap indices.",
    source: "LiveMint",
    category: "Stock Market",
    url: "https://www.livemint.com/market",
    publishedAt: "5 hours ago",
  },
  {
    id: "news-4",
    title: "Emergency Fund Rules: How many months of expenses should Indian households hold in high-yield FDs?",
    summary: "Financial advisors recommend keeping 6 to 12 months of fixed expenses split between liquid mutual funds and instant bank FDs.",
    source: "Business Standard",
    category: "Personal Finance",
    url: "https://www.business-standard.com/finance",
    publishedAt: "6 hours ago",
  },
  {
    id: "news-5",
    title: "RBI keeps repo rate unchanged: What it means for your home loan EMIs and fixed deposit rates",
    summary: "Fixed deposit yields remain attractive for senior citizens while home loan interest rates are expected to stay stable.",
    source: "Financial Express",
    category: "Personal Finance",
    url: "https://www.financialexpress.com/",
    publishedAt: "8 hours ago",
  },
];

export async function GET() {
  try {
    // Attempt to scrape live Economic Times / Moneycontrol financial RSS feed
    const res = await fetch("https://economictimes.indiatimes.com/wealth/rssfeeds/8375551.cms", {
      next: { revalidate: 300 }, // Cache feed for 5 minutes
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (res.ok) {
      const xmlText = await res.text();
      // Simple XML item extraction
      const items: FinancialNewsItem[] = [];
      const itemRegex = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi;
      
      let match;
      let count = 0;
      while ((match = itemRegex.exec(xmlText)) !== null && count < 6) {
        const rawTitle = match[1]?.trim().replace(/<[^>]+>/g, "") || "";
        const rawSummary = match[2]?.trim().replace(/<[^>]+>/g, "").slice(0, 160) + "..." || "";
        const link = match[3]?.trim() || "https://economictimes.indiatimes.com/wealth";

        if (rawTitle) {
          let category: FinancialNewsItem["category"] = "Personal Finance";
          if (rawTitle.toLowerCase().includes("tax") || rawSummary.toLowerCase().includes("tax")) category = "Tax Planning";
          else if (rawTitle.toLowerCase().includes("sip") || rawTitle.toLowerCase().includes("fund")) category = "Mutual Funds & SIP";
          else if (rawTitle.toLowerCase().includes("nifty") || rawTitle.toLowerCase().includes("stock") || rawTitle.toLowerCase().includes("market")) category = "Stock Market";

          items.push({
            id: `scraped-${count}`,
            title: rawTitle,
            summary: rawSummary,
            source: "Economic Times (Live Scrape)",
            category,
            url: link,
            publishedAt: "Just now",
          });
          count++;
        }
      }

      if (items.length > 0) {
        return NextResponse.json({ news: items, liveScraped: true });
      }
    }
  } catch {
    // Fall back to pre-seeded high-quality Indian financial news
  }

  return NextResponse.json({ news: FALLBACK_NEWS, liveScraped: false });
}
