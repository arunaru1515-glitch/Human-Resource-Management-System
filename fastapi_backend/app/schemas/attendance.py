from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus

class AttendanceCheckIn(BaseModel):
    employee_id: Optional[int] = None  # Admin/HR can clock in for employee, or current user by default

class AttendanceCheckOut(BaseModel):
    employee_id: Optional[int] = None

class AttendanceOverride(BaseModel):
    employee_id: int
    date: date
    status: AttendanceStatus
    working_hours: Optional[float] = 8.0
    override_reason: str

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    working_hours: float
    status: AttendanceStatus
    is_override: bool
    override_reason: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceTodayStatus(BaseModel):
    has_checked_in: bool
    has_checked_out: bool
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    working_hours: float = 0.0
    status: Optional[str] = None

class MonthlyAttendanceSummary(BaseModel):
    employee_id: int
    employee_name: str
    month: int
    year: int
    total_days: int
    present_days: float
    half_days: float
    absent_days: float
    on_leave_days: float
    total_hours_worked: float
