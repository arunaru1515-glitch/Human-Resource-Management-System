from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.leave import LeaveRequest, LeaveBalance, LeaveType, LeaveStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.notification import NotificationType
from app.schemas.leave import (
    LeaveApplyRequest, LeaveReviewRequest, LeaveResponse, LeaveBalanceResponse
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.notification_service import send_notification
from app.services.audit_service import log_action

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

@router.get("/balance", response_model=LeaveBalanceResponse)
def get_leave_balance(
    employee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current leave balance for an employee."""
    if current_user.role == UserRole.EMPLOYEE or not employee_id:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee profile not found")
        emp_id = emp.id
    else:
        emp_id = employee_id

    current_year = datetime.utcnow().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == emp_id,
        LeaveBalance.year == current_year
    ).first()

    if not balance:
        # Create default balance if missing
        balance = LeaveBalance(
            employee_id=emp_id,
            year=current_year,
            casual_allocated=12.0,
            casual_used=0.0,
            sick_allocated=10.0,
            sick_used=0.0,
            paid_allocated=15.0,
            paid_used=0.0,
            lop_days=0.0
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)

    casual_rem = max(0.0, balance.casual_allocated - balance.casual_used)
    sick_rem = max(0.0, balance.sick_allocated - balance.sick_used)
    paid_rem = max(0.0, balance.paid_allocated - balance.paid_used)
    return LeaveBalanceResponse(
        employee_id=balance.employee_id,
        year=balance.year,
        casual_allocated=balance.casual_allocated,
        casual_used=balance.casual_used,
        casual_available=casual_rem,
        casual_leave_remaining=casual_rem,
        sick_allocated=balance.sick_allocated,
        sick_used=balance.sick_used,
        sick_available=sick_rem,
        sick_leave_remaining=sick_rem,
        paid_allocated=balance.paid_allocated,
        paid_used=balance.paid_used,
        paid_available=paid_rem,
        paid_leave_remaining=paid_rem,
        lop_days=balance.lop_days,
        unpaid_leave_taken=balance.lop_days
    )

@router.post("/apply", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    leave_data: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Employee submits a leave application. Calculates days and flags potential LOP."""
    if current_user.role == UserRole.EMPLOYEE or not leave_data.employee_id:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee profile not found")
    else:
        emp = db.query(Employee).filter(Employee.id == leave_data.employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

    if leave_data.end_date < leave_data.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    # Calculate requested business days
    total_days = float((leave_data.end_date - leave_data.start_date).days + 1)

    # Determine if it qualifies as Loss of Pay (LOP)
    current_year = datetime.utcnow().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == emp.id,
        LeaveBalance.year == current_year
    ).first()

    is_lop = False
    if leave_data.leave_type == LeaveType.UNPAID:
        is_lop = True
    elif balance:
        if leave_data.leave_type == LeaveType.CASUAL and (balance.casual_allocated - balance.casual_used) < total_days:
            is_lop = True
        elif leave_data.leave_type == LeaveType.SICK and (balance.sick_allocated - balance.sick_used) < total_days:
            is_lop = True
        elif leave_data.leave_type == LeaveType.PAID and (balance.paid_allocated - balance.paid_used) < total_days:
            is_lop = True

    new_leave = LeaveRequest(
        employee_id=emp.id,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        total_days=total_days,
        reason=leave_data.reason,
        status=LeaveStatus.PENDING,
        is_lop=is_lop
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    # Notification
    send_notification(
        db=db,
        user=emp.user,
        notification_type=NotificationType.LEAVE_APPLICATION,
        context={
            "name": emp.full_name,
            "total_days": total_days,
            "leave_type": new_leave.leave_type.value,
            "start_date": str(new_leave.start_date),
            "end_date": str(new_leave.end_date),
            "reason": new_leave.reason
        }
    )

    log_action(
        db=db,
        action="LEAVE_APPLIED",
        entity="LeaveRequest",
        entity_id=str(new_leave.id),
        details=f"{emp.full_name} applied for {total_days} days {new_leave.leave_type.value} leave (LOP: {is_lop})",
        user=current_user
    )

    return LeaveResponse(
        id=new_leave.id,
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        department=emp.department,
        leave_type=new_leave.leave_type,
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        total_days=new_leave.total_days,
        days=new_leave.total_days,
        reason=new_leave.reason,
        status=new_leave.status,
        is_lop=new_leave.is_lop,
        reviewed_by_id=new_leave.reviewed_by_id,
        reviewer_comment=new_leave.reviewer_comment,
        reviewed_at=new_leave.reviewed_at,
        applied_at=new_leave.applied_at
    )

@router.get("", response_model=List[LeaveResponse])
def list_leaves(
    status_filter: Optional[LeaveStatus] = Query(None, alias="status"),
    department: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List leave requests. Employees only see their own; Admin/HR see all."""
    query = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id)

    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        query = query.filter(LeaveRequest.employee_id == emp.id)
    elif employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)

    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    if department:
        query = query.filter(Employee.department == department)

    requests = query.order_by(LeaveRequest.applied_at.desc()).all()
    results = []
    for lr in requests:
        results.append(LeaveResponse(
            id=lr.id,
            employee_id=lr.employee_id,
            employee_name=lr.employee.full_name,
            employee_code=lr.employee.employee_code,
            department=lr.employee.department,
            leave_type=lr.leave_type,
            start_date=lr.start_date,
            end_date=lr.end_date,
            total_days=lr.total_days,
            days=lr.total_days,
            reason=lr.reason,
            status=lr.status,
            is_lop=lr.is_lop,
            reviewed_by_id=lr.reviewed_by_id,
            reviewer_comment=lr.reviewer_comment,
            reviewed_at=lr.reviewed_at,
            applied_at=lr.applied_at
        ))
    return results

@router.put("/{leave_id}/review", response_model=LeaveResponse)
def review_leave_request(
    leave_id: int,
    review_data: LeaveReviewRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR can approve or reject a leave request, updating leave balances and attendance."""
    leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave_req.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot review: Request is already {leave_req.status.value}")

    leave_req.status = review_data.status
    leave_req.reviewer_comment = review_data.comment
    leave_req.reviewed_by_id = current_user.id
    leave_req.reviewed_at = datetime.utcnow()

    # Balance adjustments if APPROVED
    if review_data.status == LeaveStatus.APPROVED:
        current_year = leave_req.start_date.year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == leave_req.employee_id,
            LeaveBalance.year == current_year
        ).first()

        if balance:
            days = leave_req.total_days
            if leave_req.leave_type == LeaveType.CASUAL:
                avail = balance.casual_allocated - balance.casual_used
                if avail >= days:
                    balance.casual_used += days
                else:
                    balance.casual_used += max(0.0, avail)
                    balance.lop_days += (days - avail)
                    leave_req.is_lop = True
            elif leave_req.leave_type == LeaveType.SICK:
                avail = balance.sick_allocated - balance.sick_used
                if avail >= days:
                    balance.sick_used += days
                else:
                    balance.sick_used += max(0.0, avail)
                    balance.lop_days += (days - avail)
                    leave_req.is_lop = True
            elif leave_req.leave_type == LeaveType.PAID:
                avail = balance.paid_allocated - balance.paid_used
                if avail >= days:
                    balance.paid_used += days
                else:
                    balance.paid_used += max(0.0, avail)
                    balance.lop_days += (days - avail)
                    leave_req.is_lop = True
            elif leave_req.leave_type == LeaveType.UNPAID:
                balance.lop_days += days
                leave_req.is_lop = True

        # Send Approval Notification
        send_notification(
            db=db,
            user=leave_req.employee.user,
            notification_type=NotificationType.LEAVE_APPROVAL,
            context={
                "name": leave_req.employee.full_name,
                "total_days": leave_req.total_days,
                "leave_type": leave_req.leave_type.value,
                "start_date": str(leave_req.start_date),
                "end_date": str(leave_req.end_date),
                "comment": review_data.comment or "Approved by HR"
            }
        )
    else:
        # Send Rejection Notification
        send_notification(
            db=db,
            user=leave_req.employee.user,
            notification_type=NotificationType.LEAVE_REJECTION,
            context={
                "name": leave_req.employee.full_name,
                "total_days": leave_req.total_days,
                "leave_type": leave_req.leave_type.value,
                "comment": review_data.comment or "Rejected by HR"
            }
        )

    db.commit()
    db.refresh(leave_req)

    log_action(
        db=db,
        action=f"LEAVE_{review_data.status.value}",
        entity="LeaveRequest",
        entity_id=str(leave_req.id),
        details=f"Leave {review_data.status.value} for {leave_req.employee.full_name}. Comment: {review_data.comment}",
        user=current_user
    )

    return LeaveResponse(
        id=leave_req.id,
        employee_id=leave_req.employee_id,
        employee_name=leave_req.employee.full_name,
        employee_code=leave_req.employee.employee_code,
        department=leave_req.employee.department,
        leave_type=leave_req.leave_type,
        start_date=leave_req.start_date,
        end_date=leave_req.end_date,
        total_days=leave_req.total_days,
        days=leave_req.total_days,
        reason=leave_req.reason,
        status=leave_req.status,
        is_lop=leave_req.is_lop,
        reviewed_by_id=leave_req.reviewed_by_id,
        reviewer_comment=leave_req.reviewer_comment,
        reviewed_at=leave_req.reviewed_at,
        applied_at=leave_req.applied_at
    )
