from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import (
    AttendanceCheckIn, AttendanceCheckOut, AttendanceOverride,
    AttendanceResponse, AttendanceTodayStatus, MonthlyAttendanceSummary
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

def _get_target_employee(db: Session, current_user: User, req_employee_id: Optional[int]) -> Employee:
    """Helper to resolve target employee depending on role."""
    if req_employee_id and current_user.role in [UserRole.ADMIN, UserRole.HR]:
        emp = db.query(Employee).filter(Employee.id == req_employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    else:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="No employee profile associated with this account")
        return emp

@router.get("/today", response_model=AttendanceTodayStatus)
def get_today_attendance_status(
    employee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's clock-in and clock-out status for the current or specified employee."""
    emp = _get_target_employee(db, current_user, employee_id)
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not record:
        return AttendanceTodayStatus(
            has_checked_in=False,
            has_checked_out=False,
            check_in_time=None,
            check_out_time=None,
            working_hours=0.0,
            status=None
        )

    cin_str = record.check_in_time.isoformat() if record.check_in_time else None
    cout_str = record.check_out_time.isoformat() if record.check_out_time else None
    return AttendanceTodayStatus(
        has_checked_in=record.check_in_time is not None,
        has_checked_out=record.check_out_time is not None,
        check_in_time=record.check_in_time,
        check_out_time=record.check_out_time,
        check_in=cin_str,
        check_out=cout_str,
        working_hours=record.working_hours,
        total_hours=record.working_hours,
        status=record.status.value
    )

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    data: AttendanceCheckIn = AttendanceCheckIn(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Employee clock-in. Prevents duplicate check-ins on the same day."""
    emp = _get_target_employee(db, current_user, data.employee_id)
    today = date.today()
    now = datetime.utcnow()

    # Check for existing record
    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in_time:
        raise HTTPException(
            status_code=400,
            detail=f"Already checked in today at {existing.check_in_time.strftime('%H:%M:%S')} UTC"
        )

    if not existing:
        attendance = Attendance(
            employee_id=emp.id,
            date=today,
            check_in_time=now,
            status=AttendanceStatus.PRESENT,
            working_hours=0.0
        )
        db.add(attendance)
    else:
        existing.check_in_time = now
        existing.status = AttendanceStatus.PRESENT
        attendance = existing

    db.commit()
    db.refresh(attendance)

    log_action(
        db=db,
        action="ATTENDANCE_CHECK_IN",
        entity="Attendance",
        entity_id=str(attendance.id),
        details=f"{emp.full_name} checked in at {now.strftime('%H:%M:%S')}",
        user=current_user
    )

    cin_str = attendance.check_in_time.isoformat() if attendance.check_in_time else None
    cout_str = attendance.check_out_time.isoformat() if attendance.check_out_time else None
    return AttendanceResponse(
        id=attendance.id,
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        department=emp.department,
        date=attendance.date,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        check_in=cin_str,
        check_out=cout_str,
        working_hours=attendance.working_hours,
        total_hours=attendance.working_hours,
        status=attendance.status,
        is_override=attendance.is_override,
        override_reason=attendance.override_reason
    )

@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    data: AttendanceCheckOut = AttendanceCheckOut(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Employee clock-out. Calculates working hours and flags half-day if < 4 hours."""
    emp = _get_target_employee(db, current_user, data.employee_id)
    today = date.today()
    now = datetime.utcnow()

    attendance = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not attendance or not attendance.check_in_time:
        raise HTTPException(status_code=400, detail="Cannot check out: No check-in recorded for today")

    if attendance.check_out_time:
        raise HTTPException(
            status_code=400,
            detail=f"Already checked out today at {attendance.check_out_time.strftime('%H:%M:%S')} UTC"
        )

    attendance.check_out_time = now
    delta_seconds = (now - attendance.check_in_time).total_seconds()
    hours = round(max(0.0, delta_seconds / 3600.0), 2)
    attendance.working_hours = hours

    # Half-day rule: If less than 4 hours, mark as HALF_DAY
    if hours < 4.0:
        attendance.status = AttendanceStatus.HALF_DAY
    else:
        attendance.status = AttendanceStatus.PRESENT

    db.commit()
    db.refresh(attendance)

    log_action(
        db=db,
        action="ATTENDANCE_CHECK_OUT",
        entity="Attendance",
        entity_id=str(attendance.id),
        details=f"{emp.full_name} checked out at {now.strftime('%H:%M:%S')} (Worked: {hours} hrs)",
        user=current_user
    )

    cin_str = attendance.check_in_time.isoformat() if attendance.check_in_time else None
    cout_str = attendance.check_out_time.isoformat() if attendance.check_out_time else None
    return AttendanceResponse(
        id=attendance.id,
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        department=emp.department,
        date=attendance.date,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        check_in=cin_str,
        check_out=cout_str,
        working_hours=attendance.working_hours,
        total_hours=attendance.working_hours,
        status=attendance.status,
        is_override=attendance.is_override,
        override_reason=attendance.override_reason
    )

@router.get("/history", response_model=List[AttendanceResponse])
def get_attendance_history(
    employee_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve attendance history with date, department, and employee filters."""
    query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)

    if current_user.role == UserRole.EMPLOYEE:
        # Employees can only view their own records
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        query = query.filter(Attendance.employee_id == emp.id)
    elif employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if department:
        query = query.filter(Employee.department == department)

    records = query.order_by(Attendance.date.desc()).all()
    results = []
    for r in records:
        cin_str = r.check_in_time.isoformat() if r.check_in_time else None
        cout_str = r.check_out_time.isoformat() if r.check_out_time else None
        results.append(AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee.full_name,
            employee_code=r.employee.employee_code,
            department=r.employee.department,
            date=r.date,
            check_in_time=r.check_in_time,
            check_out_time=r.check_out_time,
            check_in=cin_str,
            check_out=cout_str,
            working_hours=r.working_hours,
            total_hours=r.working_hours,
            status=r.status,
            is_override=r.is_override,
            override_reason=r.override_reason
        ))
    return results

@router.post("/override", response_model=AttendanceResponse)
def admin_override_attendance(
    override_data: AttendanceOverride,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR override capability to fix or mark attendance for an employee."""
    emp = db.query(Employee).filter(Employee.id == override_data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == override_data.date
    ).first()

    if not record:
        record = Attendance(
            employee_id=emp.id,
            date=override_data.date,
            working_hours=override_data.working_hours or 8.0,
            status=override_data.status,
            is_override=True,
            override_reason=override_data.override_reason,
            overridden_by_id=current_user.id
        )
        db.add(record)
    else:
        record.status = override_data.status
        record.working_hours = override_data.working_hours or record.working_hours
        record.is_override = True
        record.override_reason = override_data.override_reason
        record.overridden_by_id = current_user.id

    db.commit()
    db.refresh(record)

    log_action(
        db=db,
        action="ATTENDANCE_OVERRIDE",
        entity="Attendance",
        entity_id=str(record.id),
        details=f"Overrode attendance for {emp.full_name} on {override_data.date} -> {override_data.status}. Reason: {override_data.override_reason}",
        user=current_user
    )

    return AttendanceResponse(
        id=record.id,
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        department=emp.department,
        date=record.date,
        check_in_time=record.check_in_time,
        check_out_time=record.check_out_time,
        working_hours=record.working_hours,
        status=record.status,
        is_override=record.is_override,
        override_reason=record.override_reason
    )

@router.get("/monthly-summary", response_model=List[MonthlyAttendanceSummary])
def get_monthly_attendance_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    employee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and return monthly attendance summary."""
    emp_query = db.query(Employee).filter(Employee.is_active == True)
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        emp_query = emp_query.filter(Employee.id == emp.id)
    elif employee_id:
        emp_query = emp_query.filter(Employee.id == employee_id)

    employees = emp_query.all()
    summaries = []

    for emp in employees:
        records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date >= date(year, month, 1),
            Attendance.date <= date(year, month, 28)  # Approximate month bounds
        ).all()

        present_cnt = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        half_cnt = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
        absent_cnt = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        leave_cnt = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
        total_hours = sum(r.working_hours for r in records)

        summaries.append(MonthlyAttendanceSummary(
            employee_id=emp.id,
            employee_name=emp.full_name,
            month=month,
            year=year,
            total_days=len(records),
            present_days=float(present_cnt),
            half_days=float(half_cnt),
            absent_days=float(absent_cnt),
            on_leave_days=float(leave_cnt),
            total_hours_worked=round(total_hours, 2)
        ))

    return summaries
