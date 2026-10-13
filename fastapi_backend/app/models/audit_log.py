from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., EMPLOYEE_CREATED, LEAVE_APPROVED, PAYROLL_LOCKED
    entity = Column(String(100), nullable=False)  # e.g., Employee, LeaveRequest, Payroll
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
