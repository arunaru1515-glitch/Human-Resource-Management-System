from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.user import User

TEMPLATES = {
    NotificationType.ONBOARDING: {
        "subject": "Welcome to HRMS, {name}!",
        "title": "Welcome Onboard!",
        "body": "Hello {name},\n\nYour employee profile ({employee_code}) has been successfully created. Your department is {department} and designation is {designation}.\n\nYou can now log in using your registered email: {email}.\n\nWelcome to the team!\nHR Operations Team"
    },
    NotificationType.LEAVE_APPLICATION: {
        "subject": "Leave Request Submitted - {leave_type}",
        "title": "Leave Request Submitted",
        "body": "Hello {name},\n\nYour leave application for {total_days} day(s) of {leave_type} leave from {start_date} to {end_date} has been submitted and is pending review by Admin/HR.\n\nReason: {reason}"
    },
    NotificationType.LEAVE_APPROVAL: {
        "subject": "Leave Request Approved - {leave_type}",
        "title": "Leave Request Approved",
        "body": "Hello {name},\n\nGreat news! Your request for {total_days} day(s) of {leave_type} leave ({start_date} to {end_date}) has been APPROVED.\nReviewer Comment: {comment}"
    },
    NotificationType.LEAVE_REJECTION: {
        "subject": "Leave Request Update - Rejected",
        "title": "Leave Request Rejected",
        "body": "Hello {name},\n\nWe regret to inform you that your request for {total_days} day(s) of {leave_type} leave has been REJECTED.\nReason/Comment: {comment}"
    },
    NotificationType.PAYROLL_GENERATED: {
        "subject": "Payroll Processed for {month}/{year}",
        "title": "Monthly Payroll Processed",
        "body": "Hello {name},\n\nYour payroll for the month of {month}/{year} has been computed. Net Pay: ₹{net_salary:,.2f}.\nPresent days: {present_days}, LOP days: {lop_days}."
    },
    NotificationType.SALARY_SLIP: {
        "subject": "Salary Slip Available for {month}/{year}",
        "title": "Salary Slip Ready for Download",
        "body": "Hello {name},\n\nYour official salary slip for {month}/{year} is now available for download in your employee portal. Net amount credited: ₹{net_salary:,.2f}."
    },
    NotificationType.SYSTEM: {
        "subject": "{subject}",
        "title": "{title}",
        "body": "{message}"
    }
}

def send_notification(
    db: Session,
    user: User,
    notification_type: NotificationType,
    context: Dict[str, Any],
    custom_title: Optional[str] = None,
    custom_message: Optional[str] = None
) -> Notification:
    """Send an in-app notification and simulate template-based email dispatch with logging."""
    tpl = TEMPLATES.get(notification_type, TEMPLATES[NotificationType.SYSTEM])
    
    subject = tpl["subject"].format(**context)
    title = custom_title or tpl["title"].format(**context)
    body = custom_message or tpl["body"].format(**context)
    
    email_log = (
        f"--- EMAIL DISPATCH LOG ---\n"
        f"Timestamp: {datetime.utcnow().isoformat()}Z\n"
        f"To: {user.email}\n"
        f"Subject: {subject}\n"
        f"Status: DELIVERED (Simulated SMTP Gateway 250 OK)\n"
        f"Content-Type: text/plain; charset=utf-8\n\n"
        f"{body}\n"
        f"--------------------------"
    )
    
    notification = Notification(
        user_id=user.id,
        title=title,
        message=body,
        notification_type=notification_type,
        is_read=False,
        email_sent=True,
        email_recipient=user.email,
        email_subject=subject,
        email_log=email_log
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
