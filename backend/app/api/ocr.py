from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ocr.extractor import OCRExtractor

router = APIRouter(prefix="/ocr", tags=["OCR"])


class OCRRequest(BaseModel):
    base64Image: str
    mimeType: str = "image/jpeg"


class OCRResponse(BaseModel):
    merchant: str
    amount: float
    date: str
    currency: str = "INR"
    category: str = "other"
    subcategory: str | None = None
    payment_method: str | None = None
    tax: float | None = None
    reference_number: str | None = None
    confidence: float
    raw_text: str


@router.post("/receipt", response_model=OCRResponse)
async def process_receipt(request: OCRRequest):
    import base64
    import tempfile
    from pathlib import Path

    try:
        image_data = base64.b64decode(request.base64Image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

    suffix = ".png" if "png" in request.mimeType else ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_data)
        tmp_path = tmp.name

    try:
        extractor = OCRExtractor()
        result = extractor.extract_structured(tmp_path)
        return OCRResponse(
            merchant=result.get("merchant", "Unknown"),
            amount=result.get("amount", 0.0),
            date=result.get("date", ""),
            category=result.get("category", "other"),
            confidence=result.get("confidence", 50),
            raw_text=result.get("raw_text", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing error: {e}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)
