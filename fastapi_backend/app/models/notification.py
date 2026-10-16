import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class NotificationType(str, enum.Enum):
    ONBOARDING = "ONBOARDING"
    LEAVE_APPLICATION = "LEAVE_APPLICATION"
    LEAVE_APPROVAL = "LEAVE_APPROVAL"
    LEAVE_REJECTION = "LEAVE_REJECTION"
    PAYROLL_GENERATED = "PAYROLL_GENERATED"
    SALARY_SLIP = "SALARY_SLIP"
    ATTENDANCE_ALERT = "ATTENDANCE_ALERT"
    SHIFT_CHANGE = "SHIFT_CHANGE"
    HOLIDAY_ANNOUNCEMENT = "HOLIDAY_ANNOUNCEMENT"
    ADMIN_ANNOUNCEMENT = "ADMIN_ANNOUNCEMENT"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Broadcast fields
    is_broadcast = Column(Boolean, default=False, nullable=False)
    department_target = Column(String(100), nullable=True)  # None = all departments

    # Template-based email simulation details
    email_sent = Column(Boolean, default=True, nullable=False)
    email_recipient = Column(String(255), nullable=True)
    email_subject = Column(String(255), nullable=True)
    email_log = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="notifications")
