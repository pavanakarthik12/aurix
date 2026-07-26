import re
from typing import Any

CATEGORY_PATTERNS = [
    (r"starbucks|coffee|cafe|restaurant|hotel|swiggy|zomato", "food"),
    (r"uber|ola|metro|bus|petrol|fuel|ola", "transport"),
    (r"amazon|flipkart|myntra|shopping", "shopping"),
    (r"netflix|prime|spotify|movie|bookmyshow", "entertainment"),
    (r"apollo|med|pharmacy|hospital", "health"),
    (r"rent|maintenance|society", "housing"),
    (r"electricity|water|broadband|airtel|jio", "utilities"),
]


def categorize_transaction(merchant: str) -> str:
    for pattern, category in CATEGORY_PATTERNS:
        if re.search(pattern, merchant, re.IGNORECASE):
            return category
    return "other"


def parse_amount(text: str) -> float | None:
    patterns = [
        r"(?:total|amount|due|grand total)\s*:?\s*[₹$€£]?\s*([\d,]+\.?\d*)",
        r"[₹$€£]\s*([\d,]+\.?\d*)",
        r"(\d+\.\d{2})\s*$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def parse_date(text: str) -> str | None:
    patterns = [
        r"\d{1,2}[/-]\d{1,2}[/-]\d{4}",
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2}",
        r"\d{4}[/-]\d{1,2}[/-]\d{1,2}",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None
