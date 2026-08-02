from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
import re
import statistics
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import BudgetModel
from app.models.goal import GoalModel
from app.models.merchant_category import MerchantCategoryModel
from app.models.transaction import TransactionModel


MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def normalize_merchant(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()
    return re.sub(r"\s+", " ", cleaned)


def _to_date(value: Any) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)).date()


def _month_key(value: date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def _month_label(month_key: str) -> str:
    year, month = month_key.split("-")
    return f"{MONTH_NAMES[int(month) - 1]} {year}"


def _mean(values: list[float]) -> float:
    return statistics.mean(values) if values else 0.0


def _stdev(values: list[float]) -> float:
    return statistics.pstdev(values) if len(values) > 1 else 0.0


async def load_financial_context(db: AsyncSession, user_id: str) -> dict[str, list[dict[str, Any]]]:
    transactions = (
        await db.execute(
            select(TransactionModel)
            .where(TransactionModel.user_id == user_id)
            .order_by(TransactionModel.date.asc())
        )
    ).scalars().all()
    goals = (
        await db.execute(select(GoalModel).where(GoalModel.user_id == user_id).order_by(GoalModel.created_at.asc()))
    ).scalars().all()
    budgets = (await db.execute(select(BudgetModel).where(BudgetModel.user_id == user_id))).scalars().all()
    categories = (
        await db.execute(
            select(MerchantCategoryModel)
            .where(MerchantCategoryModel.user_id == user_id)
            .order_by(MerchantCategoryModel.updated_at.desc())
        )
    ).scalars().all()

    return {
        "transactions": [
            {
                "id": row.id,
                "merchant": row.merchant,
                "merchant_key": normalize_merchant(row.merchant),
                "amount": float(row.amount),
                "date": _to_date(row.date),
                "category": row.category or "other",
                "subcategory": row.subcategory,
                "source": row.source,
                "confidence": row.confidence,
            }
            for row in transactions
        ],
        "goals": [
            {
                "id": row.id,
                "title": row.title,
                "target_amount": float(row.target_amount),
                "current_amount": float(row.current_amount),
                "target_date": row.target_date,
                "type": row.goal_type or "wealth-growth",
            }
            for row in goals
        ],
        "budgets": [
            {
                "id": row.id,
                "category": row.category,
                "limit_amount": float(row.limit_amount),
                "spent_amount": float(row.spent_amount or 0.0),
                "period": row.period,
            }
            for row in budgets
        ],
        "merchant_categories": [
            {
                "merchant_key": row.merchant_key,
                "merchant_name": row.merchant_name,
                "category": row.category,
                "subcategory": row.subcategory,
                "confidence": float(row.confidence),
                "sample_count": int(row.sample_count),
            }
            for row in categories
        ],
    }


def _group_by_month(transactions: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for tx in transactions:
        grouped[_month_key(tx["date"])].append(tx)
    return dict(sorted(grouped.items()))


def _group_by_category(transactions: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for tx in transactions:
        grouped[tx["category"]].append(tx)
    return grouped


def _insight(title: str, description: str, type_: str, severity: str, metric: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {
        "id": f"ins-{abs(hash((title, description))) % 10**12}",
        "title": title,
        "description": description,
        "type": type_,
        "severity": severity,
    }
    if metric is not None:
        payload["metric"] = metric
    return payload


def _category_analysis(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not transactions:
        return []

    monthly = _group_by_month(transactions)
    month_keys = list(monthly.keys())
    current_month = month_keys[-1]
    current_totals: dict[str, float] = defaultdict(float)
    for tx in monthly[current_month]:
        current_totals[tx["category"]] += float(tx["amount"])

    previous_window = month_keys[-3:]
    six_window = month_keys[-6:]
    current_total = sum(current_totals.values()) or 1.0
    categories = sorted({category for txs in monthly.values() for category in {tx["category"] for tx in txs}})

    analysis: list[dict[str, Any]] = []
    for category in categories:
        current = current_totals.get(category, 0.0)
        avg3 = _mean([sum(float(tx["amount"]) for tx in monthly[m] if tx["category"] == category) for m in previous_window])
        avg6 = _mean([sum(float(tx["amount"]) for tx in monthly[m] if tx["category"] == category) for m in six_window])
        prev = sum(float(tx["amount"]) for tx in monthly[month_keys[-2]] if tx["category"] == category) if len(month_keys) > 1 else 0.0
        change3 = round(((current - avg3) / avg3) * 100) if avg3 > 0 else 0
        change6 = round(((current - avg6) / avg6) * 100) if avg6 > 0 else 0
        change_prev = round(((current - prev) / prev) * 100) if prev > 0 else 0
        trend = "stable"
        if change3 > 10 or change_prev > 15:
            trend = "increasing"
        elif change3 < -10 or change_prev < -15:
            trend = "decreasing"
        analysis.append(
            {
                "category": category,
                "current_month": round(current, 2),
                "average3_month": round(avg3, 2),
                "average6_month": round(avg6, 2),
                "previous_month": round(prev, 2),
                "change_vs_avg3": change3,
                "change_vs_avg6": change6,
                "change_vs_previous": change_prev,
                "percentage_of_total": round((current / current_total) * 100),
                "trend": trend,
                "is_alert": change3 > 15 or (avg3 > 0 and current > avg3 * 1.3),
            }
        )
    return analysis


def _duplicate_insights(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, float, str], list[dict[str, Any]]] = defaultdict(list)
    for tx in transactions:
        grouped[(tx["merchant_key"], float(tx["amount"]), tx["date"].isoformat())].append(tx)

    insights: list[dict[str, Any]] = []
    for (_, amount, date_key), txs in grouped.items():
        if len(txs) < 2:
            continue
        merchant = txs[0]["merchant"]
        insights.append(
            _insight(
                f"Duplicate payment detected for {merchant}",
                f"{len(txs)} identical transactions were recorded on {date_key} totaling ₹{amount * len(txs):,.0f}. Verify the merchant settlement and reverse any duplicate charge.",
                "anomaly",
                "critical",
                {"value": f"{len(txs)} duplicates", "direction": "up", "positive": False},
            )
        )
    return insights


def _subscription_insights(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_merchant: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for tx in transactions:
        by_merchant[tx["merchant_key"]].append(tx)

    insights: list[dict[str, Any]] = []
    for txs in by_merchant.values():
        if len(txs) < 2:
            continue
        ordered = sorted(txs, key=lambda item: item["date"])
        gaps = [(ordered[i]["date"] - ordered[i - 1]["date"]).days for i in range(1, len(ordered))]
        if not gaps:
            continue
        gap_mean = _mean([float(g) for g in gaps])
        gap_sd = _stdev([float(g) for g in gaps])
        amounts = [float(tx["amount"]) for tx in ordered]
        amount_sd = _stdev(amounts)
        amount_mean = _mean(amounts)
        amount_cv = amount_sd / amount_mean if amount_mean > 0 else 0.0
        if 20 <= gap_mean <= 40 and gap_sd <= 10 and amount_cv <= 0.35:
            insights.append(
                _insight(
                    f"Recurring subscription likely at {ordered[0]['merchant']}",
                    f"{len(ordered)} payments recur every {round(gap_mean)} days on average at around ₹{amount_mean:,.0f}. Review whether this service is still needed.",
                    "subscription",
                    "warning",
                    {"value": f"₹{amount_mean:,.0f}/mo", "direction": "up", "positive": False},
                )
            )
    return insights


def _outlier_insights(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_category = _group_by_category(transactions)
    insights: list[dict[str, Any]] = []
    for category, txs in by_category.items():
        amounts = [float(tx["amount"]) for tx in txs]
        if len(amounts) < 5:
            continue
        mean_value = _mean(amounts)
        std_dev = _stdev(amounts)
        sorted_amounts = sorted(amounts)
        q1 = sorted_amounts[max(0, int(len(sorted_amounts) * 0.25) - 1)]
        q3 = sorted_amounts[min(len(sorted_amounts) - 1, int(len(sorted_amounts) * 0.75))]
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr if iqr > 0 else mean_value + 2 * std_dev
        lower = max(0.0, q1 - 1.5 * iqr) if iqr > 0 else max(0.0, mean_value - 2 * std_dev)

        for tx in txs:
            amount = float(tx["amount"])
            z_score = ((amount - mean_value) / std_dev) if std_dev > 0 else 0.0
            if abs(z_score) < 2.75 and not (amount > upper or amount < lower):
                continue
            action = "Review this charge against the source document or receipt before taking action."
            if amount > upper:
                action = "Investigate whether this was an unusually large one-off purchase and set a tighter merchant cap if needed."
            elif amount < lower and amount > 0:
                action = "Check for a refund, partial reversal, or corrected settlement amount."
            insights.append(
                _insight(
                    f"Unusual {tx['merchant']} transaction detected",
                    f"₹{amount:,.0f} is outside the expected range for {category}. Z-score {z_score:.2f}, mean ₹{mean_value:,.0f}, IQR fence ₹{upper:,.0f}. {action}",
                    "anomaly",
                    "critical" if abs(z_score) >= 3.5 or amount > upper * 1.5 else "warning",
                    {"value": f"z={z_score:.2f}", "direction": "up" if z_score > 0 else "down", "positive": z_score < 0},
                )
            )
    return insights


def _seasonal_insights(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    monthly = _group_by_month(transactions)
    if len(monthly) < 6:
        return []
    by_calendar_month: dict[int, list[float]] = defaultdict(list)
    for month_key, txs in monthly.items():
        month = int(month_key.split("-")[1])
        total = sum(float(tx["amount"]) for tx in txs)
        by_calendar_month[month].append(total)

    insights: list[dict[str, Any]] = []
    for month, values in by_calendar_month.items():
        if len(values) < 2:
            continue
        avg = _mean(values)
        latest = values[-1]
        if avg <= 0:
            continue
        delta = ((latest - avg) / avg) * 100
        if abs(delta) >= 25:
            insights.append(
                _insight(
                    f"Seasonal trend detected in {MONTH_NAMES[month - 1]}",
                    f"The latest {MONTH_NAMES[month - 1]} total is ₹{latest:,.0f}, {abs(round(delta))}% {'above' if delta > 0 else 'below'} the historical average of ₹{avg:,.0f}.",
                    "pattern",
                    "warning" if delta > 0 else "info",
                    {"value": f"{delta:+.0f}%", "direction": "up" if delta > 0 else "down", "positive": delta < 0},
                )
            )
    return insights


def _budget_insights(transactions: list[dict[str, Any]], budgets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not budgets:
        return []
    monthly = _group_by_month(transactions)
    if not monthly:
        return []
    current_month = next(reversed(monthly))
    current = monthly[current_month]
    current_totals: dict[str, float] = defaultdict(float)
    for tx in current:
        current_totals[tx["category"]] += float(tx["amount"])

    insights: list[dict[str, Any]] = []
    for budget in budgets:
        limit = float(budget["limit_amount"])
        if limit <= 0:
            continue
        spent = float(current_totals.get(budget["category"], 0.0))
        if spent <= limit:
            continue
        over = spent - limit
        pct = round((over / limit) * 100)
        insights.append(
            _insight(
                f"{budget['category']} budget exceeded by {pct}%",
                f"{_month_label(current_month)} spending in {budget['category']} is ₹{spent:,.0f} against a budget of ₹{limit:,.0f}. Reduce this category by about ₹{over:,.0f} to stay within plan.",
                "spending",
                "critical" if pct >= 25 else "warning",
                {"value": f"+{pct}%", "direction": "up", "positive": False},
            )
        )
    return insights


def build_insights(transactions: list[dict[str, Any]], budgets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    category_rows = _category_analysis(transactions)
    insights: list[dict[str, Any]] = []

    for row in category_rows:
        if not row["is_alert"]:
            continue
        direction = "up" if row["change_vs_avg3"] > 0 else "down"
        insights.append(
            _insight(
                f"{row['category']} spending moved {abs(row['change_vs_avg3'])}% vs 3-month average",
                f"Current month: ₹{row['current_month']:,.0f}, 3-month average: ₹{row['average3_month']:,.0f}. This category now represents {row['percentage_of_total']}% of current-month spending.",
                "spending",
                "critical" if row["change_vs_avg3"] > 25 else "warning",
                {"value": f"{row['change_vs_avg3']:+d}%", "direction": direction, "positive": direction == "down"},
            )
        )

    insights.extend(_duplicate_insights(transactions))
    insights.extend(_subscription_insights(transactions))
    insights.extend(_outlier_insights(transactions))
    insights.extend(_seasonal_insights(transactions))
    insights.extend(_budget_insights(transactions, budgets))

    if not insights and transactions:
        current_month = next(reversed(_group_by_month(transactions)))
        current_total = sum(float(tx["amount"]) for tx in _group_by_month(transactions)[current_month])
        insights.append(
            _insight(
                "No anomalies detected",
                f"{len(transactions)} transactions analyzed. Current-month spending is ₹{current_total:,.0f}.",
                "pattern",
                "info",
                {"value": "clean", "direction": "down", "positive": True},
            )
        )

    return insights


def _score_from_ratio(ratio: float | None) -> float | None:
    if ratio is None:
        return None
    if ratio >= 30:
        return 100
    if ratio >= 20:
        return 85
    if ratio >= 10:
        return 65
    if ratio > 0:
        return 45
    return 0


def _budget_adherence_score(transactions: list[dict[str, Any]], budgets: list[dict[str, Any]]) -> float | None:
    if budgets:
        monthly = _group_by_month(transactions)
        if not monthly:
            return None
        current_month = next(reversed(monthly))
        current = monthly[current_month]
        current_totals: dict[str, float] = defaultdict(float)
        for tx in current:
            current_totals[tx["category"]] += float(tx["amount"])
        scores: list[float] = []
        for budget in budgets:
            limit = float(budget["limit_amount"])
            if limit <= 0:
                continue
            spent = float(current_totals.get(budget["category"], 0.0))
            ratio = spent / limit if limit > 0 else 0.0
            scores.append(100.0 if ratio <= 1 else max(0.0, 100.0 - ((ratio - 1) * 100.0)))
        return _mean(scores) if scores else None

    monthly = _group_by_month(transactions)
    if len(monthly) < 3:
        return None
    totals = [sum(float(tx["amount"]) for tx in txs) for txs in monthly.values()]
    average = _mean(totals)
    if average <= 0:
        return None
    volatility = _stdev(totals) / average if average > 0 else 0.0
    return max(0.0, 100.0 - volatility * 100.0)


def _goal_progress_score(goals: list[dict[str, Any]]) -> float | None:
    if not goals:
        return None
    progress = []
    for goal in goals:
        target = float(goal["target_amount"])
        if target <= 0:
            continue
        progress.append(min(100.0, (float(goal["current_amount"]) / target) * 100.0))
    return _mean(progress) if progress else None


def _emergency_fund_score(goals: list[dict[str, Any]], monthly_spending: float) -> float | None:
    funds = [goal for goal in goals if goal["type"] == "emergency-fund"]
    if not funds or monthly_spending <= 0:
        return None
    target = sum(float(goal["target_amount"]) for goal in funds)
    current = sum(float(goal["current_amount"]) for goal in funds)
    if target <= 0:
        return None
    return max(0.0, min(100.0, (current / target) * 100.0))


def _debt_ratio_score(goals: list[dict[str, Any]], transactions: list[dict[str, Any]]) -> float | None:
    debt_goals = [goal for goal in goals if goal["type"] == "debt-payoff"]
    if debt_goals:
        target = sum(float(goal["target_amount"]) for goal in debt_goals)
        current = sum(float(goal["current_amount"]) for goal in debt_goals)
        if target <= 0:
            return None
        remaining = max(0.0, target - current)
        return max(0.0, min(100.0, 100.0 - (remaining / target) * 100.0))

    debt_spend = sum(float(tx["amount"]) for tx in transactions if tx["category"] == "debt")
    total = sum(float(tx["amount"]) for tx in transactions)
    if total <= 0 or debt_spend <= 0:
        return None
    ratio = (debt_spend / total) * 100.0
    return max(0.0, 100.0 - ratio)


def _income_growth_score(monthly_totals: list[float], income: float) -> float | None:
    if len(monthly_totals) < 2 or income <= 0:
        return None
    delta = monthly_totals[-1] - monthly_totals[-2]
    ratio = (delta / income) * 100.0
    if ratio <= -10:
        return 100.0
    if ratio <= 0:
        return 80.0
    if ratio <= 10:
        return 55.0
    return 25.0


def _spending_consistency_score(monthly_totals: list[float]) -> float | None:
    if len(monthly_totals) < 3:
        return None
    average = _mean(monthly_totals)
    if average <= 0:
        return None
    volatility = _stdev(monthly_totals) / average
    return max(0.0, 100.0 - volatility * 100.0)


def build_health_history(transactions: list[dict[str, Any]], goals: list[dict[str, Any]], income: float) -> list[dict[str, Any]]:
    monthly = _group_by_month(transactions)
    history: list[dict[str, Any]] = []
    ordered_months = list(monthly.keys())[-12:]
    for month_key in ordered_months:
        month_total = sum(float(tx["amount"]) for tx in monthly[month_key])
        savings_rate = _score_from_ratio(((income - month_total) / income) * 100.0 if income > 0 else None)
        consistency = _spending_consistency_score([sum(float(tx["amount"]) for tx in monthly[k]) for k in ordered_months if k <= month_key])
        goal_progress = _goal_progress_score(goals)
        available = [score for score in [savings_rate, consistency, goal_progress] if score is not None]
        history.append(
            {
                "month": _month_label(month_key),
                "overall": round(_mean(available)) if available else 0,
                "savingsRate": round(savings_rate) if savings_rate is not None else None,
                "budgetAdherence": None,
                "goalProgress": round(goal_progress) if goal_progress is not None else None,
            }
        )
    return history


def calculate_health_score(context: dict[str, list[dict[str, Any]]], income: float | None) -> dict[str, Any]:
    if income is None or income <= 0:
        raise ValueError("Monthly income is required to calculate the Financial Health Score")

    transactions = context["transactions"]
    goals = context["goals"]
    budgets = context["budgets"]
    monthly = _group_by_month(transactions)
    monthly_totals = [sum(float(tx["amount"]) for tx in txs) for txs in monthly.values()]
    current_spending = monthly_totals[-1] if monthly_totals else 0.0
    savings_rate_value = ((income - current_spending) / income) * 100.0 if income > 0 else None

    factor_scores: dict[str, float | None] = {
        "savingsRate": _score_from_ratio(savings_rate_value),
        "budgetAdherence": _budget_adherence_score(transactions, budgets),
        "cashFlow": _score_from_ratio(savings_rate_value),
        "spendingConsistency": _spending_consistency_score(monthly_totals),
        "debtRatio": _debt_ratio_score(goals, transactions),
        "emergencyFund": _emergency_fund_score(goals, current_spending),
        "goalProgress": _goal_progress_score(goals),
        "incomeGrowth": _income_growth_score(monthly_totals, income),
        "expenseTrends": _spending_consistency_score(monthly_totals),
    }

    weights = {
        "savingsRate": 0.20,
        "debtRatio": 0.15,
        "emergencyFund": 0.15,
        "spendingConsistency": 0.12,
        "budgetAdherence": 0.12,
        "goalProgress": 0.10,
        "incomeGrowth": 0.08,
        "expenseTrends": 0.08,
    }

    weighted_parts = [
        (weights[factor], score)
        for factor, score in factor_scores.items()
        if score is not None and factor in weights
    ]
    total_weight = sum(weight for weight, _ in weighted_parts)
    overall = round(sum(weight * score for weight, score in weighted_parts) / total_weight) if total_weight > 0 else 0

    missing = [name for name, score in factor_scores.items() if score is None]
    factor_labels = {
        "savingsRate": "Savings Rate",
        "budgetAdherence": "Budget Adherence",
        "cashFlow": "Cash Flow",
        "spendingConsistency": "Spending Consistency",
        "debtRatio": "Debt Ratio",
        "emergencyFund": "Emergency Fund Coverage",
        "goalProgress": "Goal Progress",
        "incomeGrowth": "Income Growth",
        "expenseTrends": "Expense Trend Stability",
    }
    weakest = sorted(
        [(name, score) for name, score in factor_scores.items() if score is not None],
        key=lambda item: item[1],
    )[:3]

    recommendations: list[str] = []
    for factor, _ in weakest:
        if factor == "savingsRate":
            recommendations.append("Increase the gap between income and monthly spending.")
        elif factor == "budgetAdherence":
            recommendations.append("Bring the over-budget categories back under their limits.")
        elif factor == "cashFlow":
            recommendations.append("Improve net monthly cash flow by reducing recurring outflows.")
        elif factor == "spendingConsistency":
            recommendations.append("Stabilize month-to-month spending to reduce volatility.")
        elif factor == "debtRatio":
            recommendations.append("Reduce debt balances or allocate more to debt payoff goals.")
        elif factor == "emergencyFund":
            recommendations.append("Build a larger emergency fund buffer.")
        elif factor == "goalProgress":
            recommendations.append("Increase contributions to underfunded goals.")
        elif factor == "incomeGrowth":
            recommendations.append("Make sure income growth stays ahead of spending growth.")
        elif factor == "expenseTrends":
            recommendations.append("Flatten category trends that are drifting upward over time.")

    if not recommendations:
        recommendations.append("Keep recording transactions so the model has enough data to improve.")

    trend = "stable"
    change = 0
    if len(monthly_totals) >= 2:
        delta = monthly_totals[-1] - monthly_totals[-2]
        change = round(delta)
        if delta < 0:
            trend = "up"
        elif delta > 0:
            trend = "down"

    explanations = [
        f"{factor_labels[name]}: {round(score)}/100" for name, score in weakest
    ]
    if missing:
        explanations.append("Missing data for: " + ", ".join(factor_labels.get(name, name) for name in missing))

    return {
        "overall": max(0, min(100, overall)),
        "savingsRate": factor_scores["savingsRate"],
        "debtRatio": factor_scores["debtRatio"],
        "emergencyFund": factor_scores["emergencyFund"],
        "expenseStability": factor_scores["spendingConsistency"],
        "budgetAdherence": factor_scores["budgetAdherence"],
        "goalProgress": factor_scores["goalProgress"],
        "incomeGrowth": factor_scores["incomeGrowth"],
        "investmentRatio": factor_scores["expenseTrends"],
        "trend": trend,
        "change": change,
        "explanation": f"Financial Health Score: {max(0, min(100, overall))}/100. " + " ".join(explanations),
        "recommendations": recommendations[:4],
        "missingFactors": missing,
        "monthlyHistory": build_health_history(transactions, goals, income),
        "updatedAt": datetime.utcnow().isoformat(),
    }


async def upsert_merchant_category(
    db: AsyncSession,
    user_id: str,
    merchant: str,
    category: str,
    subcategory: str | None,
    seen_at: date,
) -> None:
    merchant_key = normalize_merchant(merchant)
    if not merchant_key or not category:
        return

    row = (
        await db.execute(
            select(MerchantCategoryModel).where(
                MerchantCategoryModel.user_id == user_id,
                MerchantCategoryModel.merchant_key == merchant_key,
            )
        )
    ).scalar_one_or_none()

    if row is None:
        db.add(
            MerchantCategoryModel(
                user_id=user_id,
                merchant_key=merchant_key,
                merchant_name=merchant,
                category=category,
                subcategory=subcategory,
                confidence=1.0,
                sample_count=1,
                last_seen_at=datetime.combine(seen_at, datetime.min.time()),
            )
        )
        return

    row.merchant_name = merchant
    row.category = category
    row.subcategory = subcategory
    row.sample_count = int(row.sample_count or 1) + 1
    row.confidence = min(0.99, 0.55 + (row.sample_count * 0.08))
    row.last_seen_at = datetime.combine(seen_at, datetime.min.time())


async def infer_category_for_merchant(db: AsyncSession, user_id: str, merchant: str) -> dict[str, Any] | None:
    merchant_key = normalize_merchant(merchant)
    if not merchant_key:
        return None

    row = (
        await db.execute(
            select(MerchantCategoryModel).where(
                MerchantCategoryModel.user_id == user_id,
                MerchantCategoryModel.merchant_key == merchant_key,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    return {
        "merchant": row.merchant_name,
        "merchant_key": row.merchant_key,
        "category": row.category,
        "subcategory": row.subcategory,
        "confidence": float(row.confidence),
        "sample_count": int(row.sample_count),
        "source": "learned-history",
    }