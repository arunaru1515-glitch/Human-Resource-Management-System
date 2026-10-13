from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.routers.deps import require_admin

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    entity: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Read-only access to audit logs tracking critical system actions (Admin only)."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
