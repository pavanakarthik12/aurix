from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.services.financial_intelligence import (
    build_insights,
    calculate_health_score,
    infer_category_for_merchant,
    load_financial_context,
    normalize_merchant,
    upsert_merchant_category,
)

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

_DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


class IntelligenceRequest(BaseModel):
    income: float = Field(..., gt=0)


class CategoryLearningRequest(BaseModel):
    merchant: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    subcategory: str | None = None
    seen_at: date | None = None


@router.get("/summary")
async def get_summary(
    income: float = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    context = await load_financial_context(db, _DEFAULT_USER_ID)
    return {
        "insights": build_insights(context["transactions"], context["budgets"]),
        "health_score": calculate_health_score(context, income),
        "transactions_analyzed": len(context["transactions"]),
        "goals_analyzed": len(context["goals"]),
        "budgets_analyzed": len(context["budgets"]),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/summary")
async def post_summary(payload: IntelligenceRequest, db: AsyncSession = Depends(get_db)):
    context = await load_financial_context(db, _DEFAULT_USER_ID)
    return {
        "insights": build_insights(context["transactions"], context["budgets"]),
        "health_score": calculate_health_score(context, payload.income),
        "transactions_analyzed": len(context["transactions"]),
        "goals_analyzed": len(context["goals"]),
        "budgets_analyzed": len(context["budgets"]),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/category-suggestion")
async def category_suggestion(
    merchant: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    suggestion = await infer_category_for_merchant(db, _DEFAULT_USER_ID, merchant)
    return {"merchant": merchant, "suggestion": suggestion}


@router.post("/learn-category")
async def learn_category(payload: CategoryLearningRequest, db: AsyncSession = Depends(get_db)):
    await upsert_merchant_category(
        db,
        _DEFAULT_USER_ID,
        payload.merchant,
        payload.category,
        payload.subcategory,
        payload.seen_at or date.today(),
    )
    await db.commit()
    return {"status": "learned", "merchant": normalize_merchant(payload.merchant), "category": payload.category}