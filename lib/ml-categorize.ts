import type { ExpenseCategory } from "@/types/finance";
import { categorizeExpense } from "@/lib/categorize";

/**
 * Multinomial Naive Bayes text classifier, trained at module load on a small
 * bundled dataset of merchant/description phrases per category. This lets
 * expense categorization generalize to unseen merchants that share vocabulary
 * with the training examples, rather than requiring an exact keyword hit.
 */

interface TrainingExample {
  text: string;
  category: ExpenseCategory;
}

const TRAINING_DATA: TrainingExample[] = [
  // food
  { text: "zomato order dinner delivery", category: "food" },
  { text: "swiggy food order lunch", category: "food" },
  { text: "starbucks coffee latte", category: "food" },
  { text: "blue tokai coffee roasters", category: "food" },
  { text: "dominos pizza order", category: "food" },
  { text: "mcdonald burger meal", category: "food" },
  { text: "kfc chicken bucket", category: "food" },
  { text: "restaurant dinner bill", category: "food" },
  { text: "cafe brunch coffee tea", category: "food" },
  { text: "bakery cake pastry order", category: "food" },
  { text: "dhaba roadside food", category: "food" },
  { text: "grocery vegetables fruits market", category: "food" },
  { text: "biryani order online", category: "food" },
  // transport
  { text: "uber ride trip fare", category: "transport" },
  { text: "ola cab booking", category: "transport" },
  { text: "rapido bike taxi", category: "transport" },
  { text: "petrol pump fuel diesel", category: "transport" },
  { text: "metro card recharge travel", category: "transport" },
  { text: "irctc train ticket railway", category: "transport" },
  { text: "indigo flight ticket airfare", category: "transport" },
  { text: "toll plaza fastag payment", category: "transport" },
  { text: "parking fee mall", category: "transport" },
  { text: "auto rickshaw fare", category: "transport" },
  // entertainment
  { text: "netflix monthly subscription", category: "entertainment" },
  { text: "amazon prime video subscription", category: "entertainment" },
  { text: "hotstar disney subscription", category: "entertainment" },
  { text: "spotify music premium", category: "entertainment" },
  { text: "bookmyshow movie ticket", category: "entertainment" },
  { text: "pvr cinema tickets popcorn", category: "entertainment" },
  { text: "steam game purchase", category: "entertainment" },
  { text: "concert event ticket booking", category: "entertainment" },
  // utilities
  { text: "electricity bill payment bescom", category: "utilities" },
  { text: "water bill municipal payment", category: "utilities" },
  { text: "gas cylinder booking bill", category: "utilities" },
  { text: "broadband wifi internet bill", category: "utilities" },
  { text: "airtel jio mobile recharge", category: "utilities" },
  { text: "dth recharge set top box", category: "utilities" },
  { text: "vodafone postpaid bill payment", category: "utilities" },
  // shopping
  { text: "amazon online shopping order", category: "shopping" },
  { text: "flipkart order purchase", category: "shopping" },
  { text: "myntra clothes fashion order", category: "shopping" },
  { text: "ajio apparel order", category: "shopping" },
  { text: "nykaa cosmetics beauty order", category: "shopping" },
  { text: "mall retail store purchase", category: "shopping" },
  { text: "meesho order delivery", category: "shopping" },
  { text: "electronics gadget store purchase", category: "shopping" },
  // health
  { text: "apollo pharmacy medicine order", category: "health" },
  { text: "medplus pharmacy purchase", category: "health" },
  { text: "hospital consultation fee", category: "health" },
  { text: "clinic doctor visit fee", category: "health" },
  { text: "diagnostic lab test blood", category: "health" },
  { text: "gym membership fitness fee", category: "health" },
  { text: "dental checkup fee", category: "health" },
  // housing
  { text: "monthly house rent payment", category: "housing" },
  { text: "society maintenance charges", category: "housing" },
  { text: "home loan emi payment", category: "housing" },
  { text: "mortgage installment payment", category: "housing" },
  { text: "broker commission rent agreement", category: "housing" },
  { text: "landlord rent transfer", category: "housing" },
  // other
  { text: "cash withdrawal atm", category: "other" },
  { text: "miscellaneous purchase unknown vendor", category: "other" },
  { text: "bank charges fee", category: "other" },
  { text: "donation charity contribution", category: "other" },
  { text: "gift purchase for friend", category: "other" },
];

const CATEGORIES: ExpenseCategory[] = [
  "food", "transport", "entertainment", "utilities",
  "shopping", "health", "housing", "other",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

interface NaiveBayesModel {
  vocabulary: Set<string>;
  wordCountsByCategory: Record<ExpenseCategory, Map<string, number>>;
  totalWordsByCategory: Record<ExpenseCategory, number>;
  docCountByCategory: Record<ExpenseCategory, number>;
  totalDocs: number;
}

function trainNaiveBayes(data: TrainingExample[]): NaiveBayesModel {
  const vocabulary = new Set<string>();
  const wordCountsByCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, new Map<string, number>()])
  ) as Record<ExpenseCategory, Map<string, number>>;
  const totalWordsByCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0])
  ) as Record<ExpenseCategory, number>;
  const docCountByCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0])
  ) as Record<ExpenseCategory, number>;

  for (const example of data) {
    docCountByCategory[example.category] += 1;
    for (const word of tokenize(example.text)) {
      vocabulary.add(word);
      const counts = wordCountsByCategory[example.category];
      counts.set(word, (counts.get(word) ?? 0) + 1);
      totalWordsByCategory[example.category] += 1;
    }
  }

  return {
    vocabulary,
    wordCountsByCategory,
    totalWordsByCategory,
    docCountByCategory,
    totalDocs: data.length,
  };
}

const MODEL = trainNaiveBayes(TRAINING_DATA);

export interface MlCategorizationResult {
  category: ExpenseCategory;
  confidence: number;
}

export function categorizeExpenseMl(text: string): MlCategorizationResult {
  const words = tokenize(text);
  const vocabSize = MODEL.vocabulary.size;

  if (words.length === 0 || vocabSize === 0) {
    return { category: categorizeExpense(text), confidence: 0 };
  }

  const logScores = CATEGORIES.map((category) => {
    const prior = Math.log(
      (MODEL.docCountByCategory[category] + 1) / (MODEL.totalDocs + CATEGORIES.length)
    );
    const wordCounts = MODEL.wordCountsByCategory[category];
    const totalWords = MODEL.totalWordsByCategory[category];

    const likelihood = words.reduce((sum, word) => {
      const count = wordCounts.get(word) ?? 0;
      return sum + Math.log((count + 1) / (totalWords + vocabSize));
    }, 0);

    return { category, score: prior + likelihood };
  });

  logScores.sort((a, b) => b.score - a.score);
  const [best, second] = logScores;

  // Convert the log-score gap between the top two classes into a bounded
  // confidence signal (softmax over just the top two, since the full
  // softmax over 8 sparse-vocabulary classes is dominated by priors).
  const gap = best.score - (second?.score ?? best.score);
  const confidence = 1 / (1 + Math.exp(-gap));

  if (confidence < 0.55) {
    const fallback = categorizeExpense(text);
    if (fallback !== "other") {
      return { category: fallback, confidence: 0.5 };
    }
  }

  return { category: best.category, confidence };
}
