from datetime import datetime, date
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.payroll import Payroll, SalarySlip, PayrollStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.notification import NotificationType
from app.schemas.payroll import (
    PayrollGenerateRequest, PayrollAdjustRequest, PayrollResponse
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.pdf_service import generate_salary_slip_pdf
from app.services.notification_service import send_notification
from app.services.audit_service import log_action

router = APIRouter(prefix="/payroll", tags=["Payroll & Salary Processing"])

def compute_employee_payroll(
    emp: Employee,
    month: int,
    year: int,
    db: Session,
    total_working_days: int = 30,
    bonus: float = 0.0,
    performance_allowance: float = 0.0
) -> dict:
    """Calculate attendance, LOP, shift overtime, earnings, and deductions for an employee."""
    start_dt = date(year, month, 1)
    end_dt = date(year, month, 28)  # Approximate month boundary

    # Count attendance
    attendances = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= start_dt,
        Attendance.date <= end_dt
    ).all()

    present_days = sum(1.0 for a in attendances if a.status == AttendanceStatus.PRESENT)
    present_days += sum(0.5 for a in attendances if a.status == AttendanceStatus.HALF_DAY)

    # Approved leaves
    approved_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == emp.id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date >= start_dt,
        LeaveRequest.end_date <= end_dt
    ).all()

    approved_leave_days = sum(l.total_days for l in approved_leaves if not l.is_lop)
    lop_days = sum(l.total_days for l in approved_leaves if l.is_lop)

    # Also count absent days as LOP if unaccounted
    absent_days = sum(1.0 for a in attendances if a.status == AttendanceStatus.ABSENT)
    lop_days += absent_days

    # Overtime pay: sum of overtime_hours across all attendance records
    total_overtime_hours = sum(a.overtime_hours for a in attendances)
    hourly_rate = (emp.basic_salary + emp.hra + emp.allowances) / max(total_working_days * 8, 1)
    overtime_pay = round(total_overtime_hours * hourly_rate * 1.5, 2)  # 1.5x multiplier

    # Daily rate
    daily_rate = (emp.basic_salary + emp.hra + emp.allowances) / max(total_working_days, 1)
    lop_deduction = round(lop_days * daily_rate, 2)

    gross_salary = round(emp.basic_salary + emp.hra + emp.allowances + bonus + overtime_pay + performance_allowance, 2)
    tax_deduction = round(gross_salary * 0.05, 2)  # Standard 5% TDS
    pf_deduction = round(emp.basic_salary * 0.12, 2)  # 12% PF on basic
    professional_tax = 200.0  # Fixed professional tax
    other_deductions = round(emp.deductions, 2)
    total_deductions = round(lop_deduction + tax_deduction + pf_deduction + professional_tax + other_deductions, 2)
    net_salary = max(0.0, round(gross_salary - total_deductions, 2))

    return {
        "total_working_days": total_working_days,
        "present_days": present_days,
        "approved_leave_days": approved_leave_days,
        "lop_days": lop_days,
        "basic_salary": emp.basic_salary,
        "hra": emp.hra,
        "allowances": emp.allowances,
        "bonus": bonus,
        "overtime_pay": overtime_pay,
        "performance_allowance": performance_allowance,
        "gross_salary": gross_salary,
        "lop_deduction": lop_deduction,
        "tax_deduction": tax_deduction,
        "pf_deduction": pf_deduction,
        "professional_tax": professional_tax,
        "other_deductions": other_deductions,
        "total_deductions": total_deductions,
        "net_salary": net_salary
    }

@router.post("/generate", response_model=List[PayrollResponse])
def generate_monthly_payroll(
    req: PayrollGenerateRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Generate or recalculate payroll for active employees for specified month/year."""
    emp_query = db.query(Employee).filter(Employee.is_active == True)
    if req.employee_id:
        emp_query = emp_query.filter(Employee.id == req.employee_id)

    employees = emp_query.all()
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found to generate payroll")

    results = []
    for emp in employees:
        existing = db.query(Payroll).filter(
            Payroll.employee_id == emp.id,
            Payroll.month == req.month,
            Payroll.year == req.year
        ).first()

        if existing and existing.is_locked:
            results.append(existing)
            continue

        calc = compute_employee_payroll(emp, req.month, req.year, db,
                                        bonus=getattr(req, 'bonus', 0.0),
                                        performance_allowance=getattr(req, 'performance_allowance', 0.0))

        if not existing:
            payroll = Payroll(
                employee_id=emp.id,
                month=req.month,
                year=req.year,
                status=PayrollStatus.PROCESSED,
                processed_by_id=current_user.id,
                **calc
            )
            db.add(payroll)
            db.flush()
        else:
            for k, v in calc.items():
                setattr(existing, k, v)
            existing.status = PayrollStatus.PROCESSED
            existing.processed_by_id = current_user.id
            payroll = existing

        # Generate Salary Slip PDF
        slip_path = generate_salary_slip_pdf(payroll, emp)
        slip = db.query(SalarySlip).filter(SalarySlip.payroll_id == payroll.id).first()
        if not slip:
            slip = SalarySlip(
                payroll_id=payroll.id,
                employee_id=emp.id,
                file_path=str(slip_path),
                file_name=slip_path.name
            )
            db.add(slip)
        else:
            slip.file_path = str(slip_path)
            slip.file_name = slip_path.name

        # Trigger notification
        send_notification(
            db=db,
            user=emp.user,
            notification_type=NotificationType.PAYROLL_GENERATED,
            context={
                "name": emp.full_name,
                "month": req.month,
                "year": req.year,
                "net_salary": payroll.net_salary,
                "present_days": payroll.present_days,
                "lop_days": payroll.lop_days
            }
        )

        results.append(payroll)

    db.commit()

    log_action(
        db=db,
        action="PAYROLL_GENERATED",
        entity="Payroll",
        details=f"Processed payroll for {len(results)} employees for {req.month}/{req.year}",
        user=current_user
    )

    out = []
    for p in results:
        db.refresh(p)
        out.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            employee_name=p.employee.full_name,
            employee_code=p.employee.employee_code,
            department=p.employee.department,
            month=p.month,
            year=p.year,
            total_working_days=p.total_working_days,
            present_days=p.present_days,
            approved_leave_days=p.approved_leave_days,
            lop_days=p.lop_days,
            basic_salary=p.basic_salary,
            hra=p.hra,
            allowances=p.allowances,
            bonus=getattr(p, 'bonus', 0.0),
            overtime_pay=getattr(p, 'overtime_pay', 0.0),
            performance_allowance=getattr(p, 'performance_allowance', 0.0),
            gross_salary=p.gross_salary,
            lop_deduction=p.lop_deduction,
            tax_deduction=p.tax_deduction,
            pf_deduction=getattr(p, 'pf_deduction', 0.0),
            professional_tax=getattr(p, 'professional_tax', 0.0),
            other_deductions=p.other_deductions,
            total_deductions=p.total_deductions,
            net_salary=p.net_salary,
            status=p.status,
            is_locked=p.is_locked,
            is_credited=p.is_credited,
            credited_at=p.credited_at,
            payment_reference=p.payment_reference,
            notes=p.notes,
            created_at=p.created_at
        ))
    return out

@router.get("", response_model=List[PayrollResponse])
def list_payrolls(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List payroll records with filters. Employees only see their own history."""
    query = db.query(Payroll).join(Employee, Payroll.employee_id == Employee.id)

    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        query = query.filter(Payroll.employee_id == emp.id)
    elif employee_id:
        query = query.filter(Payroll.employee_id == employee_id)

    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
    if department:
        query = query.filter(Employee.department == department)

    payrolls = query.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    results = []
    for p in payrolls:
        results.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            employee_name=p.employee.full_name,
            employee_code=p.employee.employee_code,
            department=p.employee.department,
            month=p.month,
            year=p.year,
            total_working_days=p.total_working_days,
            present_days=p.present_days,
            approved_leave_days=p.approved_leave_days,
            lop_days=p.lop_days,
            basic_salary=p.basic_salary,
            hra=p.hra,
            allowances=p.allowances,
            gross_salary=p.gross_salary,
            lop_deduction=p.lop_deduction,
            tax_deduction=p.tax_deduction,
            other_deductions=p.other_deductions,
            total_deductions=p.total_deductions,
            net_salary=p.net_salary,
            status=p.status,
            is_locked=p.is_locked,
            is_credited=p.is_credited,
            credited_at=p.credited_at,
            payment_reference=p.payment_reference,
            notes=p.notes,
            created_at=p.created_at
        ))
    return results

@router.put("/{payroll_id}/adjust", response_model=PayrollResponse)
def adjust_payroll(
    payroll_id: int,
    adj: PayrollAdjustRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR manual payroll adjustments if required before locking."""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    if p.is_locked:
        raise HTTPException(status_code=400, detail="Cannot adjust: Payroll is locked")

    if adj.lop_days is not None:
        p.lop_days = adj.lop_days
        daily_rate = (p.basic_salary + p.hra + p.allowances) / max(p.total_working_days, 1)
        p.lop_deduction = round(p.lop_days * daily_rate, 2)

    if adj.allowances is not None:
        p.allowances = adj.allowances
        p.gross_salary = round(p.basic_salary + p.hra + p.allowances, 2)

    if adj.tax_deduction is not None:
        p.tax_deduction = adj.tax_deduction

    if adj.other_deductions is not None:
        p.other_deductions = adj.other_deductions

    if adj.notes is not None:
        p.notes = adj.notes

    p.total_deductions = round(p.lop_deduction + p.tax_deduction + p.other_deductions, 2)
    p.net_salary = max(0.0, round(p.gross_salary - p.total_deductions, 2))

    # Re-generate PDF
    generate_salary_slip_pdf(p, p.employee)

    db.commit()
    db.refresh(p)

    log_action(
        db=db,
        action="PAYROLL_ADJUSTED",
        entity="Payroll",
        entity_id=str(p.id),
        details=f"Adjusted payroll for {p.employee.full_name}. Net Pay: {p.net_salary}",
        user=current_user
    )

    return PayrollResponse(
        id=p.id,
        employee_id=p.employee_id,
        employee_name=p.employee.full_name,
        employee_code=p.employee.employee_code,
        department=p.employee.department,
        month=p.month,
        year=p.year,
        total_working_days=p.total_working_days,
        present_days=p.present_days,
        approved_leave_days=p.approved_leave_days,
        lop_days=p.lop_days,
        basic_salary=p.basic_salary,
        hra=p.hra,
        allowances=p.allowances,
        gross_salary=p.gross_salary,
        lop_deduction=p.lop_deduction,
        tax_deduction=p.tax_deduction,
        other_deductions=p.other_deductions,
        total_deductions=p.total_deductions,
        net_salary=p.net_salary,
        status=p.status,
        is_locked=p.is_locked,
        is_credited=p.is_credited,
        credited_at=p.credited_at,
        payment_reference=p.payment_reference,
        notes=p.notes,
        created_at=p.created_at
    )

@router.post("/{payroll_id}/lock")
def lock_payroll(
    payroll_id: int,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Lock payroll record after final review to prevent further edits."""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    p.is_locked = True
    p.status = PayrollStatus.LOCKED
    db.commit()

    log_action(
        db=db,
        action="PAYROLL_LOCKED",
        entity="Payroll",
        entity_id=str(p.id),
        details=f"Locked payroll for {p.employee.full_name} ({p.month}/{p.year})",
        user=current_user
    )

    return {"message": f"Payroll for {p.employee.full_name} locked successfully"}

@router.post("/{payroll_id}/simulate-credit")
def simulate_salary_credit(
    payroll_id: int,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Simulate automated salary credit disbursement without real payment gateway."""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    p.is_credited = True
    p.credited_at = datetime.utcnow()
    p.payment_reference = f"SIM-TXN-{uuid.uuid4().hex[:10].upper()}"
    p.status = PayrollStatus.PAID
    p.is_locked = True

    # Re-render slip with credited details
    generate_salary_slip_pdf(p, p.employee)

    # Notify employee
    send_notification(
        db=db,
        user=p.employee.user,
        notification_type=NotificationType.SALARY_SLIP,
        context={
            "name": p.employee.full_name,
            "month": p.month,
            "year": p.year,
            "net_salary": p.net_salary
        }
    )

    db.commit()

    log_action(
        db=db,
        action="SALARY_CREDIT_SIMULATED",
        entity="Payroll",
        entity_id=str(p.id),
        details=f"Simulated salary credit of Rs {p.net_salary} to {p.employee.full_name}. Ref: {p.payment_reference}",
        user=current_user
    )

    return {
        "message": f"Salary credit simulated successfully for {p.employee.full_name}",
        "payment_reference": p.payment_reference,
        "credited_at": p.credited_at,
        "net_salary": p.net_salary
    }
