from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.leave import LeaveType, LeaveStatus

class LeaveApplyRequest(BaseModel):
    employee_id: Optional[int] = None  # Optional if logged-in employee
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str

class LeaveReviewRequest(BaseModel):
    status: LeaveStatus  # APPROVED or REJECTED
    comment: Optional[str] = None

class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: LeaveStatus
    is_lop: bool
    reviewed_by_id: Optional[int] = None
    reviewer_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    applied_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    employee_id: int
    year: int
    casual_allocated: float
    casual_used: float
    casual_available: float
    sick_allocated: float
    sick_used: float
    sick_available: float
    paid_allocated: float
    paid_used: float
    paid_available: float
    lop_days: float

    class Config:
        from_attributes = True
