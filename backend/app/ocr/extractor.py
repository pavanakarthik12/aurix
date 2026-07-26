from pathlib import Path

import pytesseract
from loguru import logger

from app.ocr.image_utils import enhance_for_ocr, preprocess_image


class OCRExtractor:
    def __init__(self, tesseract_path: str | None = None):
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

    def extract_text(self, image_path: str | Path, lang: str = "eng") -> str:
        logger.debug(f"Extracting text from {image_path}")
        processed = enhance_for_ocr(image_path)
        config = "--oem 3 --psm 6"
        text = pytesseract.image_to_string(processed, lang=lang, config=config)
        logger.debug(f"Extracted {len(text)} characters")
        return text.strip()

    def extract_structured(self, image_path: str | Path) -> dict:
        raw_text = self.extract_text(image_path)
        return self._parse_receipt(raw_text)

    def _parse_receipt(self, text: str) -> dict:
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        merchant = lines[0] if lines else "Unknown"

        import re

        amount = 0.0
        amount_patterns = [
            r"(?:total|amount|due|grand total|net)\s*:?\s*[₹$€£]?\s*([\d,]+\.?\d*)",
            r"[₹$€£]\s*([\d,]+\.?\d*)\s*$",
        ]
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount = float(match.group(1).replace(",", ""))
                break

        date = ""
        date_match = re.search(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", text)
        if date_match:
            date = date_match.group(0)

        return {
            "merchant": merchant,
            "amount": amount,
            "date": date,
            "currency": "INR",
            "raw_text": text,
            "confidence": 70,
        }
