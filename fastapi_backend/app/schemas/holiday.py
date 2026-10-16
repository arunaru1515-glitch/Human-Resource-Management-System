from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.holiday import HolidayType


class HolidayCreate(BaseModel):
    name: str
    date: date
    holiday_type: HolidayType = HolidayType.NATIONAL
    description: Optional[str] = None
    region: Optional[str] = None


class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    holiday_type: Optional[HolidayType] = None
    description: Optional[str] = None
    region: Optional[str] = None
    is_active: Optional[bool] = None


class HolidayResponse(BaseModel):
    id: int
    name: str
    date: date
    holiday_type: HolidayType
    description: Optional[str] = None
    region: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
