from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    is_broadcast: bool = False
    department_target: Optional[str] = None
    email_sent: bool
    email_recipient: Optional[str] = None
    email_subject: Optional[str] = None
    email_log: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    department: Optional[str] = None   # None = all departments (organization-wide)
    notification_type: NotificationType = NotificationType.ADMIN_ANNOUNCEMENT


class NotificationPreferenceUpdate(BaseModel):
    leave_notifications: Optional[bool] = True
    payroll_notifications: Optional[bool] = True
    attendance_notifications: Optional[bool] = True
    system_notifications: Optional[bool] = True


class UnreadCountResponse(BaseModel):
    unread_count: int
