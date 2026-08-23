import time
import asyncio
import psutil
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from loguru import logger

from app.database.session import get_db, engine
from app.models.transaction import TransactionModel
from app.models.goal import GoalModel
from app.services.ocr_service import process_receipt_ocr
from app.services.rag_service import ingest_document, search_documents
from app.core.config import settings

router = APIRouter(prefix="/benchmark", tags=["Benchmark"])

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.post("/expense-processing", response_model=dict)
async def benchmark_expense_processing(
    transaction_count: int = Query(100, ge=1, le=50000),
    db: AsyncSession = Depends(get_db),
):
    """Benchmark expense processing metrics for given dataset size."""
    try:
        # Load test dataset - generate or fetch transactions
        user_tx = (await db.execute(
            select(TransactionModel).where(TransactionModel.user_id == DEFAULT_USER_ID)
        )).scalars().all()

        if len(user_tx) < transaction_count:
            # Pad with test transactions if not enough data
            base_count = len(user_tx)
            for i in range(transaction_count - base_count):
                tx = TransactionModel(
                    id=str(uuid.uuid4()),
                    user_id=DEFAULT_USER_ID,
                    merchant=f"Test Merchant {i}",
                    amount=1000 + (i * 50),
                    category="food",
                    date=datetime.now().isoformat(),
                    source="manual",
                )
                db.add(tx)
            await db.commit()

        user_tx = (await db.execute(
            select(TransactionModel).where(TransactionModel.user_id == DEFAULT_USER_ID)
            .order_by(text("RANDOM()))
            .limit(transaction_count)
        )).scalars().all()

        # Benchmark OCR processing
        start = time.time()
        ocr_times = []
        for tx in user_tx[:min(20, transaction_count)]:
            if tx.merchant:
                try:
                    result = await process_receipt_ocr({
                        "merchant": tx.merchant,
                        "amount": tx.amount,
                        "date": tx.date,
                        "currency": "INR",
                    })
                    ocr_times.append(time.time() - start)
                except Exception:
                    ocr_times.append(None)
        
        avg_ocr = None
        if ocr_times and any(t is not None for t in ocr_times):
            valid_ocr = [t for t in ocr_times if t is not None]
            avg_ocr = sum(valid_ocr) / len(valid_ocr) * 1000  # convert to ms

        # Benchmark CSV processing
        start = time.time()
        csv_lines = []
        for tx in user_tx[:min(50, transaction_count)]:
            csv_lines.append(f'{tx.date},{tx.merchant},{tx.category},{tx.amount}')
        csv_data = "\n".join(csv_lines)
        csv_process_start = time.time()
        # Simulate CSV parsing validation
        csv_rows = csv_data.split("\n")
        csv_time_ms = (time.time() - csv_process_start) * 1000

        # Benchmark transaction normalization
        start = time.time()
        from lib.financial_engine import computeMonthlyAverages
        avg_data = computeMonthlyAverages(user_tx)
        norm_time_ms = (time.time() - start) * 1000

        # Benchmark categorization
        start = time.time()
        from lib.financial_engine import categoryTotals
        cat_totals = categoryTotals(user_tx)
        cat_time_ms = (time.time() - start) * 1000

        return {
            "dataset_size": transaction_count,
            "ocr_processing_time_ms": avg_ocr or None,
            "csv_processing_time_ms": csv_time_ms,
            "pdf_processing_time_ms": None,
            "transaction_normalization_time_ms": norm_time_ms,
            "categorization_time_ms": cat_time_ms,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": {
                "python_version": "3.12+",
                "fastapi": "0.115.0",
            },
        }
    except Exception as e:
        logger.error(f"Benchmark expense processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Benchmark error: {e}")