from app.database.session import Base

# Import all models so alembic can detect them
from app.models.user import UserModel
from app.models.transaction import TransactionModel
from app.models.goal import GoalModel
from app.models.budget import BudgetModel
from app.models.category import CategoryModel
from app.models.document import DocumentModel

__all__ = [
    "Base",
    "UserModel",
    "TransactionModel",
    "GoalModel",
    "BudgetModel",
    "CategoryModel",
    "DocumentModel",
]
