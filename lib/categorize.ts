import type { ExpenseCategory } from "@/types/finance";

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: [
    "zomato", "swiggy", "restaurant", "cafe", "coffee", "starbucks",
    "dining", "food", "eatery", "bakery", "pizza", "kitchen", "dominos",
    "mcdonald", "kfc", "burger", "tea", "dhaba",
  ],
  transport: [
    "uber", "ola", "rapido", "petrol", "fuel", "metro", "taxi", "cab",
    "parking", "toll", "irctc", "railway", "flight", "indigo", "diesel",
  ],
  entertainment: [
    "netflix", "prime video", "hotstar", "spotify", "bookmyshow", "movie",
    "cinema", "pvr", "inox", "gaming", "steam", "youtube premium",
  ],
  utilities: [
    "electricity", "bescom", "water bill", "gas bill", "broadband",
    "wifi", "airtel", "jio", "vodafone", "recharge", "dth", "utility",
  ],
  shopping: [
    "amazon", "flipkart", "myntra", "ajio", "mall", "store", "nykaa",
    "shopping", "meesho", "retail",
  ],
  health: [
    "pharmacy", "apollo", "hospital", "clinic", "doctor", "medplus",
    "medical", "diagnostic", "health", "gym", "fitness",
  ],
  housing: [
    "rent", "landlord", "maintenance", "society", "emi", "mortgage",
    "housing", "broker",
  ],
  other: [],
};

export function categorizeExpense(text: string): ExpenseCategory {
  const normalized = text.toLowerCase();

  let bestMatch: ExpenseCategory = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ExpenseCategory,
    string[],
  ][]) {
    const score = keywords.filter((keyword) => normalized.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}
