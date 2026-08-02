import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.database.session import get_db
from app.services.financial_intelligence import infer_category_for_merchant, upsert_merchant_category
from app.models.transaction import TransactionModel
from app.models.goal import GoalModel
from app.models.category import CategoryModel

router = APIRouter(prefix="/data", tags=["Data"])


class TransactionIn(BaseModel):
    merchant: str
    amount: float
    category: str
    date: str
    source: str = "manual"


class TransactionOut(BaseModel):
    id: str
    merchant: str
    amount: float
    category: str
    date: str
    source: str


class GoalIn(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0
    target_date: str
    type: str = "wealth-growth"


class GoalOut(BaseModel):
    id: str
    title: str
    target_amount: float
    current_amount: float
    target_date: str
    type: str


class CategoryIn(BaseModel):
    name: str
    parent_category: str | None = None
    is_custom: bool = False


class CategoryOut(BaseModel):
    id: str
    name: str
    parent_category: str | None
    is_custom: bool


class SyncRequest(BaseModel):
    transactions: list[TransactionIn]
    goals: list[GoalIn]


class SyncResponse(BaseModel):
    transaction_count: int
    goal_count: int
    status: str = "synced"


_DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


def _parse_date(d: str) -> date:
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except ValueError:
        return datetime.fromisoformat(d).date() if "T" in d else date.today()


@router.post("/sync", response_model=SyncResponse)
async def sync_data(request: SyncRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_id = _DEFAULT_USER_ID

        await db.execute(delete(TransactionModel).where(TransactionModel.user_id == user_id))
        await db.execute(delete(GoalModel).where(GoalModel.user_id == user_id))

        for t in request.transactions:
            inferred = await infer_category_for_merchant(db, user_id, t.merchant)
            resolved_category = t.category or (inferred["category"] if inferred else "other")
            tx = TransactionModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                merchant=t.merchant,
                amount=t.amount,
                category=resolved_category,
                date=_parse_date(t.date),
                source=t.source,
            )
            db.add(tx)
            await upsert_merchant_category(db, user_id, t.merchant, resolved_category, None, tx.date)

        for g in request.goals:
            goal = GoalModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=g.title,
                target_amount=g.target_amount,
                current_amount=g.current_amount,
                target_date=_parse_date(g.target_date),
                goal_type=g.type,
            )
            db.add(goal)

        await db.commit()
        logger.info(
            f"Synced {len(request.transactions)} transactions and {len(request.goals)} goals to PostgreSQL"
        )
        return SyncResponse(
            transaction_count=len(request.transactions),
            goal_count=len(request.goals),
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sync error: {e}")


@router.get("/transactions")
async def get_transactions(
    limit: int = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    user_id = _DEFAULT_USER_ID
    result = await db.execute(
        select(TransactionModel)
        .where(TransactionModel.user_id == user_id)
        .order_by(TransactionModel.date.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    return {
        "transactions": [
            TransactionOut(
                id=row.id,
                merchant=row.merchant,
                amount=row.amount,
                category=row.category or "other",
                date=row.date.isoformat() if isinstance(row.date, date) else str(row.date),
                source=row.source,
            )
            for row in rows
        ],
        "count": len(rows),
    }


@router.get("/goals")
async def get_goals(db: AsyncSession = Depends(get_db)):
    user_id = _DEFAULT_USER_ID
    result = await db.execute(
        select(GoalModel).where(GoalModel.user_id == user_id).order_by(GoalModel.created_at.desc())
    )
    rows = result.scalars().all()
    return {
        "goals": [
            GoalOut(
                id=row.id,
                title=row.title,
                target_amount=row.target_amount,
                current_amount=row.current_amount,
                target_date=row.target_date.isoformat() if isinstance(row.target_date, date) else str(row.target_date),
                type=row.goal_type or "wealth-growth",
            )
            for row in rows
        ],
        "count": len(rows),
    }


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    user_id = _DEFAULT_USER_ID
    result = await db.execute(
        select(CategoryModel).where(CategoryModel.user_id == user_id).order_by(CategoryModel.name)
    )
    rows = result.scalars().all()
    return {
        "categories": [
            CategoryOut(
                id=row.id,
                name=row.name,
                parent_category=row.parent_category,
                is_custom=row.is_custom,
            )
            for row in rows
        ],
        "count": len(rows),
    }


@router.post("/categories")
async def create_category(cat: CategoryIn, db: AsyncSession = Depends(get_db)):
    row = CategoryModel(
        id=str(uuid.uuid4()),
        user_id=_DEFAULT_USER_ID,
        name=cat.name,
        parent_category=cat.parent_category,
        is_custom=cat.is_custom,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return CategoryOut(
        id=row.id,
        name=row.name,
        parent_category=row.parent_category,
        is_custom=row.is_custom,
    )


@router.get("/category-suggestion")
async def category_suggestion(merchant: str = Query(...), db: AsyncSession = Depends(get_db)):
    suggestion = await infer_category_for_merchant(db, _DEFAULT_USER_ID, merchant)
    return {"merchant": merchant, "suggestion": suggestion}


@router.get("/health")
async def data_health(db: AsyncSession = Depends(get_db)):
    try:
        tx_count = (await db.execute(select(TransactionModel).where(TransactionModel.user_id == _DEFAULT_USER_ID))).scalars().all()
        g_count = (await db.execute(select(GoalModel).where(GoalModel.user_id == _DEFAULT_USER_ID))).scalars().all()
        return {
            "transactions": len(tx_count),
            "goals": len(g_count),
            "status": "operational",
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.delete("/clear")
async def clear_data(db: AsyncSession = Depends(get_db)):
    user_id = _DEFAULT_USER_ID
    await db.execute(delete(TransactionModel).where(TransactionModel.user_id == user_id))
    await db.execute(delete(GoalModel).where(GoalModel.user_id == user_id))
    await db.commit()
    return {"status": "cleared"}
