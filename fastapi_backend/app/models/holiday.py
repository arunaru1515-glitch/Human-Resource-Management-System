import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Enum, Text
from app.database.session import Base


class HolidayType(str, enum.Enum):
    NATIONAL = "NATIONAL"
    REGIONAL = "REGIONAL"
    OPTIONAL = "OPTIONAL"


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, index=True)
    holiday_type = Column(Enum(HolidayType), default=HolidayType.NATIONAL, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # For regional holidays
    region = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
