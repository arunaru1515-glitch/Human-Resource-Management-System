from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.payroll import PayrollStatus

class PayrollGenerateRequest(BaseModel):
    month: int  # 1-12
    year: int
    employee_id: Optional[int] = None  # None means generate for all active employees

class PayrollAdjustRequest(BaseModel):
    lop_days: Optional[float] = None
    allowances: Optional[float] = None
    tax_deduction: Optional[float] = None
    other_deductions: Optional[float] = None
    notes: Optional[str] = None

class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    month: int
    year: int
    total_working_days: int
    present_days: float
    approved_leave_days: float
    lop_days: float
    basic_salary: float
    hra: float
    allowances: float
    gross_salary: float
    lop_deduction: float
    tax_deduction: float
    other_deductions: float
    total_deductions: float
    net_salary: float
    status: PayrollStatus
    is_locked: bool
    is_credited: bool
    credited_at: Optional[datetime] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SalarySlipResponse(BaseModel):
    id: int
    payroll_id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    month: int
    year: int
    file_name: str
    file_path: str
    download_count: int
    generated_at: datetime

    class Config:
        from_attributes = True
