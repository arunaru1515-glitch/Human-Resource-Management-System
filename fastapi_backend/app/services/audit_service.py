from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

def log_action(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Create an immutable timestamped audit log entry."""
    audit_entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else "SYSTEM",
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id else None,
        details=details,
        ip_address=ip_address or "127.0.0.1",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
