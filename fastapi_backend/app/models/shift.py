import enum
from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base


class ShiftType(str, enum.Enum):
    GENERAL = "GENERAL"
    NIGHT = "NIGHT"
    FLEXIBLE = "FLEXIBLE"
    REMOTE = "REMOTE"


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    shift_type = Column(Enum(ShiftType), default=ShiftType.GENERAL, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Grace & overtime configuration
    grace_minutes = Column(Integer, default=15, nullable=False)        # Late threshold in minutes
    overtime_after_hours = Column(Float, default=8.0, nullable=False)  # OT starts after N hours

    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee_shifts = relationship("EmployeeShift", back_populates="shift", cascade="all, delete-orphan")


class EmployeeShift(Base):
    """Tracks shift assignments per employee with effective date ranges."""
    __tablename__ = "employee_shifts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    effective_from = Column(DateTime, nullable=False, default=datetime.utcnow)
    effective_to = Column(DateTime, nullable=True)  # None = currently active
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="shift_assignments")
    shift = relationship("Shift", back_populates="employee_shifts")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
