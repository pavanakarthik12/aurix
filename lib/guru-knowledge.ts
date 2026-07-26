export interface GuruKnowledge {
  name: string;
  emoji: string;
  philosophy: string;
  books: { title: string; passages: string[] }[];
}

export const GURU_KNOWLEDGE: GuruKnowledge[] = [
  {
    name: "Warren Buffett",
    emoji: "💰",
    philosophy: "Value investing, avoiding debt, long-term compounding.",
    books: [
      {
        title: "The Warren Buffett Way",
        passages: [
          "Price is what you pay, value is what you get. The margin of safety is the difference between the two.",
          "Rule No.1: Never lose money. Rule No.2: Never forget Rule No.1.",
          "Only buy something that you'd be perfectly happy to hold if the market shut down for 10 years.",
          "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.",
          "Risk comes from not knowing what you're doing.",
          "The most important quality for an investor is temperament, not intellect.",
          "Someone is sitting in the shade today because someone planted a tree a long time ago.",
        ],
      },
    ],
  },
  {
    name: "Robert Kiyosaki",
    emoji: "📚",
    philosophy: "Assets vs. liabilities, building passive income, financial education.",
    books: [
      {
        title: "Rich Dad Poor Dad",
        passages: [
          "The rich don't work for money. They make money work for them.",
          "An asset is something that puts money in your pocket. A liability is something that takes money out of your pocket.",
          "The single most powerful asset we all have is our mind. If it is trained well, it can create enormous wealth.",
          "An intelligent person hires people who are more intelligent than they are.",
          "The size of your success is measured by the strength of your desire, the size of your dream, and how you handle disappointment along the way.",
          "It's not how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.",
        ],
      },
    ],
  },
  {
    name: "Ramit Sethi",
    emoji: "💼",
    philosophy: "Conscious spending — optimize spending on what you love, cut mercilessly on what you don't.",
    books: [
      {
        title: "I Will Teach You To Be Rich",
        passages: [
          "Spend extravagantly on the things you love, and cut costs mercilessly on the things you don't.",
          "The 85% Solution: Just do 85% of what you intend to do — don't wait for perfection.",
          "Your biggest wealth-building tool is your income. Earn more, save more, invest more.",
          "A budget is just a plan for your money. If you don't have one, your money plans for you.",
          "Automate your finances so you never have to think about them. Set it and forget it.",
        ],
      },
    ],
  },
  {
    name: "Dave Ramsey",
    emoji: "🧾",
    philosophy: "Debt snowball, emergency funds, cash-only discipline, baby steps.",
    books: [
      {
        title: "The Total Money Makeover",
        passages: [
          "A budget is telling your money where to go instead of wondering where it went.",
          "The debt snowball: pay off your smallest debts first for momentum, then attack larger ones.",
          "An emergency fund is not optional. It is the foundation of all financial progress.",
          "We buy things we don't need, with money we don't have, to impress people we don't like.",
          "Live like no one else now, so later you can live like no one else.",
        ],
      },
    ],
  },
  {
    name: "Morgan Housel",
    emoji: "🧠",
    philosophy: "The psychology of money, behavioral finance, long-term thinking.",
    books: [
      {
        title: "The Psychology of Money",
        passages: [
          "Getting wealthy and staying wealthy are two different skills. The first requires aggression, the second requires humility.",
          "Compounding works best when you give it decades. The most important factor in building wealth is time, not timing.",
          "The ability to sit still and do nothing is a competitive advantage in investing.",
          "The highest form of wealth is the ability to wake up every morning and say, 'I can do whatever I want today.'",
          "Savings is the gap between your ego and your income.",
        ],
      },
    ],
  },
];

export function getRelevantGuruPassages(query: string): {
  guru: GuruKnowledge;
  relevantPassages: string[];
}[] {
  const q = query.toLowerCase();
  return GURU_KNOWLEDGE.map((guru) => {
    const relevantPassages: string[] = [];
    for (const book of guru.books) {
      for (const passage of book.passages) {
        const pLower = passage.toLowerCase();
        const matchScore = q.split(" ").filter((w) => pLower.includes(w)).length;
        if (matchScore > 0 || q.split(" ").some((w) => pLower.includes(w))) {
          relevantPassages.push(passage);
        }
      }
    }
    return { guru, relevantPassages: relevantPassages.slice(0, 3) };
  });
}
