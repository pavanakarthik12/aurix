from datetime import date, datetime

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    merchant: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    date: date
    category: str | None = None
    subcategory: str | None = None
    payment_method: str | None = None
    reference_number: str | None = None
    tax: float | None = None
    source: str = "manual"
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: str
    merchant: str
    amount: float
    currency: str
    date: date
    category: str | None
    subcategory: str | None
    payment_method: str | None
    source: str
    confidence: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionList(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
