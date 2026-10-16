from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.salary_component import ComponentType


class SalaryComponentCreate(BaseModel):
    name: str
    component_type: ComponentType
    description: Optional[str] = None
    is_percentage: bool = False
    amount: float = 0.0
    percentage: float = 0.0
    is_variable: bool = False


class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_percentage: Optional[bool] = None
    amount: Optional[float] = None
    percentage: Optional[float] = None
    is_variable: Optional[bool] = None
    is_active: Optional[bool] = None


class SalaryComponentResponse(BaseModel):
    id: int
    name: str
    component_type: ComponentType
    description: Optional[str] = None
    is_percentage: bool
    amount: float
    percentage: float
    is_variable: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CompensationReviseRequest(BaseModel):
    employee_id: int
    basic_salary: Optional[float] = None
    hra: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    bonus: Optional[float] = None
    revision_note: Optional[str] = None
