from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.notification import Notification, NotificationType
from app.schemas.notification import (
    NotificationResponse, BroadcastNotificationRequest,
    UnreadCountResponse
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.notification_service import send_notification
from app.services.audit_service import log_action

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=200),
    notification_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve notifications for the current user with optional filters."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type.upper())

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return notifications


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the count of unread notifications for the navbar badge."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return UnreadCountResponse(unread_count=count)


@router.put("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read."""
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific notification."""
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(n)
    db.commit()
    return {"message": "Notification deleted"}


@router.post("/broadcast", response_model=dict)
def broadcast_notification(
    data: BroadcastNotificationRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin: Send a broadcast notification to a department or the entire organization."""
    # Resolve target users
    emp_query = db.query(Employee).filter(Employee.is_active == True)
    if data.department:
        emp_query = emp_query.filter(Employee.department == data.department)

    employees = emp_query.all()
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found for the target")

    sent_count = 0
    for emp in employees:
        notif = Notification(
            user_id=emp.user_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
            is_read=False,
            is_broadcast=True,
            department_target=data.department,
            email_sent=True,
            email_recipient=emp.user.email,
            email_subject=data.title,
        )
        db.add(notif)
        sent_count += 1

    db.commit()

    log_action(
        db=db,
        action="BROADCAST_NOTIFICATION_SENT",
        entity="Notification",
        details=f"Broadcast '{data.title}' sent to {sent_count} employee(s) in {data.department or 'all departments'}",
        user=current_user
    )

    return {
        "message": f"Broadcast notification sent to {sent_count} employees",
        "department": data.department or "All Departments",
        "sent_count": sent_count
    }
