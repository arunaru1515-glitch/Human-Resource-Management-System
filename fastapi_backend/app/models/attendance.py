import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Date, Time, Enum, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    HALF_DAY = "HALF_DAY"
    ABSENT = "ABSENT"
    ON_LEAVE = "ON_LEAVE"

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="unique_employee_attendance_date"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    working_hours = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)

    # Shift-aware fields
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    is_late = Column(Boolean, default=False, nullable=False)
    is_early_checkout = Column(Boolean, default=False, nullable=False)
    overtime_hours = Column(Float, default=0.0, nullable=False)
    late_minutes = Column(Integer, default=0, nullable=False)

    # Admin override fields
    is_override = Column(Boolean, default=False, nullable=False)
    override_reason = Column(String(255), nullable=True)
    overridden_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    employee = relationship("Employee", back_populates="attendance_records")
    overridden_by = relationship("User", foreign_keys=[overridden_by_id])
    shift = relationship("Shift", foreign_keys=[shift_id])
