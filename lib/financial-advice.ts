export interface FinancialGuru {
  id: string;
  name: string;
  emoji: string;
  philosophy: string;
}

export interface AdvicePrinciple {
  id: string;
  guruId: string;
  topics: string[];
  keywords: string[];
  principle: string;
  advice: string;
}

export const FINANCIAL_GURUS: FinancialGuru[] = [
  {
    id: "buffett",
    name: "Warren Buffett",
    emoji: "💰",
    philosophy: "Value investing, avoiding debt, long-term compounding.",
  },
  {
    id: "kiyosaki",
    name: "Robert Kiyosaki",
    emoji: "📚",
    philosophy: "Assets vs. liabilities, building passive income.",
  },
  {
    id: "sethi",
    name: "Ramit Sethi",
    emoji: "💼",
    philosophy: "Conscious spending — cut costs on what you don't value, spend freely on what you do.",
  },
  {
    id: "ramsey",
    name: "Dave Ramsey",
    emoji: "🧾",
    philosophy: "Debt snowball, emergency funds, cash-only discipline.",
  },
  {
    id: "mashelkar",
    name: "Raghunath Anant Mashelkar",
    emoji: "💡",
    philosophy: "Frugal engineering (MLM: More from Less for More) & Gandhian financial discipline in India.",
  },
  {
    id: "orman",
    name: "Suze Orman (India Edition)",
    emoji: "🛡️",
    philosophy: "People first, then money, then things. Protecting against Indian inflation, medical emergencies, and automated SIPs.",
  },
];

export const ADVICE_PRINCIPLES: AdvicePrinciple[] = [
  {
    id: "emi-purchase",
    guruId: "buffett",
    topics: ["debt", "emi", "purchase"],
    keywords: ["emi", "loan", "credit", "installment", "buy on emi", "finance a purchase"],
    principle: "Avoid liabilities that don't generate income.",
    advice: "If it doesn't earn you money, paying interest to own it faster rarely pays off. Save up and buy in cash when you can.",
  },
  {
    id: "emi-purchase-kiyosaki",
    guruId: "kiyosaki",
    topics: ["debt", "emi", "purchase"],
    keywords: ["emi", "loan", "credit", "installment", "buy on emi"],
    principle: "Distinguish assets from liabilities.",
    advice: "Ask whether this purchase increases your earning potential (an asset) or just drains your wallet monthly (a liability). If it's the latter, delay it.",
  },
  {
    id: "guilt-free-spending",
    guruId: "sethi",
    topics: ["spending", "lifestyle", "purchase"],
    keywords: ["afford", "should i buy", "spend on", "treat myself", "worth it"],
    principle: "Conscious spending, not blanket frugality.",
    advice: "Cut ruthlessly on categories you don't care about, and spend guilt-free on the ones you do — as long as it fits your budget for that category.",
  },
  {
    id: "emergency-fund",
    guruId: "ramsey",
    topics: ["savings", "emergency"],
    keywords: ["emergency fund", "rainy day", "job loss", "safety net"],
    principle: "Build a fully-funded emergency fund first.",
    advice: "Aim for 3–6 months of essential expenses in a liquid account before investing aggressively or taking on new debt.",
  },
  {
    id: "compounding",
    guruId: "buffett",
    topics: ["investing", "savings", "long-term"],
    keywords: ["invest", "sip", "compound", "grow my money", "mutual fund"],
    principle: "Time in the market beats timing the market.",
    advice: "Start investing consistently, even small amounts, as early as possible. Compounding rewards patience far more than trying to pick the perfect entry point.",
  },
  {
    id: "passive-income",
    guruId: "kiyosaki",
    topics: ["income", "investing"],
    keywords: ["passive income", "side income", "rental", "extra income"],
    principle: "Build assets that pay you.",
    advice: "Prioritize building income streams that don't require your direct time — rental income, dividends, royalties — over simply saving from a single salary.",
  },
  {
    id: "budgeting-50-30-20",
    guruId: "sethi",
    topics: ["budget", "savings"],
    keywords: ["budget", "how much should i save", "50/30/20", "spending plan"],
    principle: "A simple default split: 50% needs, 30% wants, 20% savings.",
    advice: "Use this as a starting framework, then adjust the ratios to fit your own goals rather than following it rigidly.",
  },
  {
    id: "debt-snowball",
    guruId: "ramsey",
    topics: ["debt"],
    keywords: ["pay off debt", "multiple loans", "credit card debt", "debt snowball"],
    principle: "Pay off smallest debts first for momentum.",
    advice: "List debts smallest to largest, pay minimums on all but the smallest, and throw every extra rupee at that one. The psychological wins keep you going.",
  },
  {
    id: "lifestyle-inflation",
    guruId: "buffett",
    topics: ["spending", "lifestyle"],
    keywords: ["raise", "salary increase", "promotion", "more money"],
    principle: "Don't let spending grow as fast as income.",
    advice: "When your income rises, increase your savings rate before you increase your lifestyle. Bank the difference.",
  },
  {
    id: "frugal-engineering-mlm",
    guruId: "mashelkar",
    topics: ["spending", "budget", "innovation"],
    keywords: ["save", "cut costs", "reduce expense", "frugal", "india", "budget", "tax", "regime", "tax regime"],
    principle: "MLM: More from Less for More people.",
    advice: "Apply Gandhian engineering to your monthly budget: optimize every rupee by eliminating recurring lifestyle waste without sacrificing quality of life.",
  },
  {
    id: "indian-inflation-sip",
    guruId: "orman",
    topics: ["investing", "emergency", "sip"],
    keywords: ["sip", "mutual fund", "inflation", "emergency", "health insurance", "invest", "india", "tax", "regime", "tax regime", "income", "wealth"],
    principle: "People first, then money, then things.",
    advice: "In India, medical inflation exceeds 10%. Build a sweep-in FD emergency fund and automate monthly SIPs on salary day before making lifestyle purchases.",
  },
];

export interface AdviceResult {
  query: string;
  responses: { guru: FinancialGuru; principle: AdvicePrinciple }[];
  summary: string;
}

export function getFinancialAdvice(query: string): AdviceResult {
  const normalized = query.toLowerCase();

  const matches = ADVICE_PRINCIPLES.filter((p) =>
    p.keywords.some((k) => normalized.includes(k))
  );

  const relevant = matches.length > 0 ? matches : ADVICE_PRINCIPLES.slice(0, 2);

  const responses = relevant.map((principle) => ({
    guru: FINANCIAL_GURUS.find((g) => g.id === principle.guruId)!,
    principle,
  }));

  const summary =
    matches.length > 0
      ? `Based on ${responses.length} relevant principle${responses.length > 1 ? "s" : ""}, weigh the guidance above against your own budget and goals before deciding.`
      : "No exact match found — here are some general principles that may still help. Try rephrasing your question with more detail.";

  return { query, responses, summary };
}
