import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class LeaveType(str, enum.Enum):
    CASUAL = "CASUAL"
    SICK = "SICK"
    PAID = "PAID"
    UNPAID = "UNPAID"

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)
    reason = Column(String(500), nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False, index=True)
    is_lop = Column(Boolean, default=False, nullable=False)  # Loss of Pay flag
    
    # Review details
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_comment = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="leave_requests")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False)
    year = Column(Integer, nullable=False)
    
    casual_allocated = Column(Float, default=12.0, nullable=False)
    casual_used = Column(Float, default=0.0, nullable=False)
    
    sick_allocated = Column(Float, default=10.0, nullable=False)
    sick_used = Column(Float, default=0.0, nullable=False)
    
    paid_allocated = Column(Float, default=15.0, nullable=False)
    paid_used = Column(Float, default=0.0, nullable=False)
    
    lop_days = Column(Float, default=0.0, nullable=False)  # Unpaid / LOP days accumulated
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    employee = relationship("Employee", back_populates="leave_balance")
