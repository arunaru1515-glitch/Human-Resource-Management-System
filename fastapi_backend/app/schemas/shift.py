from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel
from app.models.shift import ShiftType


class ShiftCreate(BaseModel):
    name: str
    shift_type: ShiftType = ShiftType.GENERAL
    start_time: time
    end_time: time
    grace_minutes: int = 15
    overtime_after_hours: float = 8.0
    description: Optional[str] = None


class ShiftUpdate(BaseModel):
    name: Optional[str] = None
    shift_type: Optional[ShiftType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    grace_minutes: Optional[int] = None
    overtime_after_hours: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ShiftResponse(BaseModel):
    id: int
    name: str
    shift_type: ShiftType
    start_time: time
    end_time: time
    grace_minutes: int
    overtime_after_hours: float
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssignShiftRequest(BaseModel):
    employee_id: Optional[int] = None
    department: Optional[str] = None    # Assign to entire department
    shift_id: int
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    notes: Optional[str] = None


class EmployeeShiftResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    shift_id: int
    shift_name: Optional[str] = None
    shift_type: Optional[ShiftType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    effective_from: datetime
    effective_to: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
