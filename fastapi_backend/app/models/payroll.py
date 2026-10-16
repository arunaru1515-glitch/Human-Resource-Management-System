import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base

class PayrollStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PROCESSED = "PROCESSED"
    LOCKED = "LOCKED"
    PAID = "PAID"

class Payroll(Base):
    __tablename__ = "payrolls"
    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="unique_employee_payroll_period"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    
    # Days computation
    total_working_days = Column(Integer, default=30, nullable=False)
    present_days = Column(Float, default=0.0, nullable=False)
    approved_leave_days = Column(Float, default=0.0, nullable=False)
    lop_days = Column(Float, default=0.0, nullable=False)
    
    # Earnings
    basic_salary = Column(Float, default=0.0, nullable=False)
    hra = Column(Float, default=0.0, nullable=False)
    allowances = Column(Float, default=0.0, nullable=False)
    bonus = Column(Float, default=0.0, nullable=False)
    overtime_pay = Column(Float, default=0.0, nullable=False)
    performance_allowance = Column(Float, default=0.0, nullable=False)
    gross_salary = Column(Float, default=0.0, nullable=False)
    
    # Deductions
    lop_deduction = Column(Float, default=0.0, nullable=False)
    tax_deduction = Column(Float, default=0.0, nullable=False)
    pf_deduction = Column(Float, default=0.0, nullable=False)
    professional_tax = Column(Float, default=0.0, nullable=False)
    other_deductions = Column(Float, default=0.0, nullable=False)
    total_deductions = Column(Float, default=0.0, nullable=False)
    
    # Net Pay
    net_salary = Column(Float, default=0.0, nullable=False)
    
    # Lifecycle flags
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    
    # Payment simulation
    is_credited = Column(Boolean, default=False, nullable=False)
    credited_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True)
    
    # Adjustments notes
    notes = Column(String(255), nullable=True)
    processed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    employee = relationship("Employee", back_populates="payrolls")
    processed_by = relationship("User", foreign_keys=[processed_by_id])
    salary_slip = relationship("SalarySlip", back_populates="payroll", uselist=False, cascade="all, delete-orphan")

class SalarySlip(Base):
    __tablename__ = "salary_slips"
    
    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    payroll = relationship("Payroll", back_populates="salary_slip")
    employee = relationship("Employee", back_populates="salary_slips")
