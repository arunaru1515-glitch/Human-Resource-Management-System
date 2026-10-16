import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum, Text
from app.database.session import Base


class ComponentType(str, enum.Enum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"


class SalaryComponent(Base):
    """Admin-configurable salary components (bonuses, allowances, deductions)."""
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    component_type = Column(Enum(ComponentType), nullable=False)
    description = Column(Text, nullable=True)

    # Fixed amount OR percentage of gross salary
    is_percentage = Column(Boolean, default=False, nullable=False)
    amount = Column(Float, default=0.0, nullable=False)     # Fixed amount value
    percentage = Column(Float, default=0.0, nullable=False) # % of gross if is_percentage

    # Variable components are computed dynamically (e.g., overtime, performance)
    is_variable = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
