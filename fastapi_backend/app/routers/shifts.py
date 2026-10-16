from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.shift import Shift, EmployeeShift
from app.schemas.shift import (
    ShiftCreate, ShiftUpdate, ShiftResponse,
    AssignShiftRequest, EmployeeShiftResponse
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.audit_service import log_action
from app.models.notification import NotificationType
from app.services.notification_service import send_notification

router = APIRouter(prefix="/shifts", tags=["Shift & Work Schedule Management"])


@router.post("", response_model=ShiftResponse)
def create_shift(
    data: ShiftCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Define a new work shift."""
    existing = db.query(Shift).filter(Shift.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A shift with this name already exists")

    shift = Shift(**data.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)

    log_action(db=db, action="SHIFT_CREATED", entity="Shift", entity_id=str(shift.id),
               details=f"Shift '{shift.name}' ({shift.shift_type}) created", user=current_user)
    return shift


@router.get("", response_model=List[ShiftResponse])
def list_shifts(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all defined work shifts."""
    query = db.query(Shift)
    if active_only:
        query = query.filter(Shift.is_active == True)
    return query.order_by(Shift.name).all()


@router.get("/attendance-report", response_model=List[dict])
def get_shift_attendance_report(
    shift_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Shift-wise attendance report showing late check-ins, early checkouts, and overtime."""
    from app.models.attendance import Attendance
    from datetime import date as date_type

    query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)

    if shift_id:
        query = query.filter(Attendance.shift_id == shift_id)
    if department:
        query = query.filter(Employee.department == department)
    if start_date:
        query = query.filter(Attendance.date >= date_type.fromisoformat(start_date))
    if end_date:
        query = query.filter(Attendance.date <= date_type.fromisoformat(end_date))

    records = query.order_by(Attendance.date.desc()).limit(500).all()

    return [
        {
            "attendance_id": r.id,
            "employee_id": r.employee_id,
            "employee_name": r.employee.full_name,
            "employee_code": r.employee.employee_code,
            "department": r.employee.department,
            "date": str(r.date),
            "shift_name": r.shift.name if r.shift else "N/A",
            "shift_type": r.shift.shift_type.value if r.shift else "N/A",
            "check_in": r.check_in_time.isoformat() if r.check_in_time else None,
            "check_out": r.check_out_time.isoformat() if r.check_out_time else None,
            "working_hours": r.working_hours,
            "overtime_hours": r.overtime_hours,
            "is_late": r.is_late,
            "late_minutes": r.late_minutes,
            "is_early_checkout": r.is_early_checkout,
            "status": r.status.value
        }
        for r in records
    ]


@router.get("/{shift_id}", response_model=ShiftResponse)
def get_shift(
    shift_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific shift by ID."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: int,
    data: ShiftUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Update shift configuration."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shift, key, value)

    db.commit()
    db.refresh(shift)

    log_action(db=db, action="SHIFT_UPDATED", entity="Shift", entity_id=str(shift.id),
               details=f"Shift '{shift.name}' updated", user=current_user)
    return shift


@router.delete("/{shift_id}")
def delete_shift(
    shift_id: int,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Deactivate a shift."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    shift.is_active = False
    db.commit()
    return {"message": f"Shift '{shift.name}' has been deactivated"}


@router.post("/assign", response_model=List[EmployeeShiftResponse])
def assign_shift(
    data: AssignShiftRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Assign a shift to an employee or entire department."""
    shift = db.query(Shift).filter(Shift.id == data.shift_id, Shift.is_active == True).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found or inactive")

    # Resolve employees to assign
    emp_query = db.query(Employee).filter(Employee.is_active == True)
    if data.employee_id:
        emp_query = emp_query.filter(Employee.id == data.employee_id)
    elif data.department:
        emp_query = emp_query.filter(Employee.department == data.department)
    else:
        raise HTTPException(status_code=400, detail="Provide either employee_id or department")

    employees = emp_query.all()
    if not employees:
        raise HTTPException(status_code=404, detail="No matching employees found")

    effective_from = data.effective_from or datetime.utcnow()
    results = []

    for emp in employees:
        # Close current active assignment if exists
        active_assignment = db.query(EmployeeShift).filter(
            EmployeeShift.employee_id == emp.id,
            EmployeeShift.effective_to == None
        ).first()
        if active_assignment:
            active_assignment.effective_to = effective_from

        # Create new assignment
        assignment = EmployeeShift(
            employee_id=emp.id,
            shift_id=data.shift_id,
            effective_from=effective_from,
            effective_to=data.effective_to,
            assigned_by_id=current_user.id,
            notes=data.notes
        )
        db.add(assignment)
        db.flush()

        # Notify employee
        send_notification(
            db=db,
            user=emp.user,
            notification_type=NotificationType.SHIFT_CHANGE,
            context={
                "name": emp.full_name,
                "shift_name": shift.name,
                "shift_type": shift.shift_type.value,
                "start_time": str(shift.start_time),
                "end_time": str(shift.end_time)
            },
            custom_title=f"Shift Assignment: {shift.name}",
            custom_message=f"You have been assigned to '{shift.name}' shift ({shift.shift_type.value}) — {shift.start_time} to {shift.end_time}, effective {effective_from.date()}."
        )

        results.append(EmployeeShiftResponse(
            id=assignment.id,
            employee_id=emp.id,
            employee_name=emp.full_name,
            employee_code=emp.employee_code,
            shift_id=shift.id,
            shift_name=shift.name,
            shift_type=shift.shift_type,
            start_time=shift.start_time,
            end_time=shift.end_time,
            effective_from=assignment.effective_from,
            effective_to=assignment.effective_to,
            notes=assignment.notes,
            created_at=assignment.created_at
        ))

    db.commit()

    log_action(db=db, action="SHIFT_ASSIGNED", entity="EmployeeShift",
               details=f"Shift '{shift.name}' assigned to {len(employees)} employee(s)", user=current_user)

    return results


@router.get("/employee/{employee_id}/history", response_model=List[EmployeeShiftResponse])
def get_employee_shift_history(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get shift assignment history for an employee."""
    # EMPLOYEE role can only view their own history
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp.id != employee_id:
            raise HTTPException(status_code=403, detail="Access denied")

    assignments = db.query(EmployeeShift).filter(
        EmployeeShift.employee_id == employee_id
    ).order_by(EmployeeShift.effective_from.desc()).all()

    results = []
    for a in assignments:
        results.append(EmployeeShiftResponse(
            id=a.id,
            employee_id=a.employee_id,
            employee_name=a.employee.full_name,
            employee_code=a.employee.employee_code,
            shift_id=a.shift_id,
            shift_name=a.shift.name,
            shift_type=a.shift.shift_type,
            start_time=a.shift.start_time,
            end_time=a.shift.end_time,
            effective_from=a.effective_from,
            effective_to=a.effective_to,
            notes=a.notes,
            created_at=a.created_at
        ))
    return results


