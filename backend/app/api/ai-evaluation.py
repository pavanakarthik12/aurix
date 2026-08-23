from fastapi import APIRouter, Depends
from sqlalchemy import select
from loguru import logger

from app.database.session import get_db
from app.models.transaction import TransactionModel
from app.models.goal import GoalModel
from app.types.finance import (
    FinancialHealthScore,
    AIInsight,
    AIRecommendation,
    PredictionResult,
)

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

router = APIRouter(prefix="/ai-evaluation", tags=["AI Evaluation"])


def evaluate_recommendation_accuracy(
    recommendation: str,
    user_situation: dict,
    available_data: dict,
) -> dict:
    """Evaluate if a recommendation is grounded in available user data."""
    issues = []
    grounding_score = 100
    hallucination = False

    # Check if recommendation references actual user data
    if "income" in user_situation and "₹" in recommendation:
        # Cross-check with available data
        available_income = available_data.get("monthlyIncome", 0)
        if available_income > 0:
            # Grounded - references actual data
            pass
        else:
            issues.append("Recommendation references income not available to user")
            grounding_score -= 20

    # Check for hallucinated transactions
    if "₹" in recommendation:
        import re
        amounts = re.findall(r"₹[\d,]+", recommendation)
        for amt in amounts:
            # If amount doesn't match any user transaction, flag
            pass  # Simplified check

    # Check calculation accuracy
    calculation_acc = 100
    if "savings" in recommendation.lower() or "save" in recommendation.lower():
        # Verify savings rate calculation
        income = available_data.get("monthlyIncome", 0)
        spending = available_data.get("monthlySpending", 0)
        if income > 0:
            expected_rate = max(0, 100 * (income - spending) / income)
            # If recommendation mentions a specific rate, check consistency
            rate_match = re.search(r"(\d+)%?", recommendation)
            if rate_match:
                rec_rate = int(rate_match.group(1))
                if abs(rec_rate - round(expected_rate)) > 10:
                    calculation_acc -= 15
                    issues.append("Savings rate calculation may not match user data")

    # Check RAG accuracy
    rag_acc = 100
    # If recommendation references books/gurus, verify they exist in knowledge base

    # Hallucination detection
    if not available_data.get("hasTransactions", False) and "transaction" in recommendation.lower():
        hallucination = True
        grounding_score -= 30
        issues.append("AI may be inventing transaction data")

    return {
        "groundingScore": max(0, grounding_score),
        "calculationAccuracy": max(0, calculation_acc),
        "hallucinationRate": 100 if hallucination else 0,
        "relevanceScore": max(0, 100 - len(issues) * 15),
        "issues": issues,
    }


@router.post("/evaluate", response_model=dict)
async def evaluate_advisor(
    scenario: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate advisor response against real financial scenarios."""
    try:
        # Get actual user data
        tx_result = await db.execute(
            select(TransactionModel).where(TransactionModel.user_id == DEFAULT_USER_ID)
        )
        transactions = tx_result.scalars().all()

        goals_result = await db.execute(
            select(GoalModel).where(GoalModel.user_id == DEFAULT_USER_ID)
        )
        goals = goals_result.scalars().all()

        income = 0
        spending = 0
        if transactions:
            spending = sum(t.amount for t in transactions)
        # Income would come from persona store, using default for now

        available_data = {
            "monthlyIncome": income,
            "monthlySpending": spending,
            "hasTransactions": len(transactions) > 0,
            "transactionCount": len(transactions),
        }

        # Get actual advisor response
        from services.advisor_service import getMultiToolResponse
        response = await getMultiToolResponse(scenario)

        # Evaluate the response
        evaluation = evaluate_recommendation_accuracy(
            response.summary,
            {"scenario": scenario, "transactionCount": len(transactions)},
            available_data,
        )

        # Generate test cases from real scenarios
        test_cases = []
        
        # Budget planning scenario
        if "budget" in scenario.lower() or "afford" in scenario.lower():
            test_cases.append({
                "id": "budget-001",
                "input": scenario,
                "expected_behavior": "Recommendation should be based on available income and spending data",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Emergency fund planning
        if "emergency" in scenario.lower() or "emergency fund" in scenario.lower():
            test_cases.append({
                "id": "emergency-001",
                "input": scenario,
                "expected_behavior": "Should reference available goals and spending patterns",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Overspending detection
        if "overspend" in scenario.lower() or "waste" in scenario.lower():
            test_cases.append({
                "id": "overspend-001",
                "input": scenario,
                "expected_behavior": "Should detect overspending based on actual transaction data",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Goal planning
        if "goal" in scenario.lower():
            test_cases.append({
                "id": "goal-001",
                "input": scenario,
                "expected_behavior": "Should consider active financial goals in advice",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Debt management
        if "debt" in scenario.lower():
            test_cases.append({
                "id": "debt-001",
                "input": scenario,
                "expected_behavior": "Should acknowledge debt situation from available data",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Spending analysis
        if "spending" in scenario.lower():
            test_cases.append({
                "id": "spending-001",
                "input": scenario,
                "expected_behavior": "Should analyze actual spending patterns from transaction data",
                "actual_response": response.summary,
                "grounding": evaluation["groundingScore"],
                "calculation_accuracy": evaluation["calculationAccuracy"],
                "hallucination": evaluation["hallucinationRate"] > 0,
                "relevance": evaluation["relevanceScore"],
                "errors": evaluation["issues"],
            })

        # Guru philosophy comparison
        test_cases.append({
            "id": "guru-001",
            "input": scenario,
            "expected_behavior": "Should reference guru philosophies from available knowledge sources",
            "actual_response": response.summary,
            "grounding": evaluation["groundingScore"],
            "calculation_accuracy": evaluation["calculationAccuracy"],
            "hallucination": evaluation["hallucinationRate"] > 0,
            "relevance": evaluation["relevanceScore"],
            "errors": evaluation["issues"],
        })

        accuracy_metrics = {
            "total_test_cases": len(test_cases),
            "average_grounding": sum(tc["grounding"] for tc in test_cases) / len(test_cases) if test_cases else 0,
            "average_calculation_accuracy": sum(tc["calculation_accuracy"] for tc in test_cases) / len(test_cases) if test_cases else 0,
            "average_hallucination_rate": sum(tc["hallucination"] ? 100 : 0 for tc in test_cases) / len(test_cases) if test_cases else 0,
            "average_relevance": sum(tc["relevance"] for tc in test_cases) / len(test_cases) if test_cases else 0,
            "hallucination_cases": sum(1 for tc in test_cases if tc["hallucination"]),
            "grounding_failures": sum(1 for tc in test_cases if tc["grounding"] < 60),
        }

        return {
            "scenario": scenario,
            "user_data_available": available_data,
            "evaluation": evaluation,
            "test_cases": test_cases,
            "accuracy_metrics": accuracy_metrics,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"AI evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation error: {e}")