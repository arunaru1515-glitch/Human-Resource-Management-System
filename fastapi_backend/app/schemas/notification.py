from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    email_sent: bool
    email_recipient: Optional[str] = None
    email_subject: Optional[str] = None
    email_log: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
