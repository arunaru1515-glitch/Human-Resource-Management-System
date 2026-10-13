import csv
import io
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.schemas.report import DashboardSummaryResponse
from app.routers.deps import get_current_user, require_hr_or_admin

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin/HR dashboard overview metrics."""
    today = date.today()
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()

    present_today = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY])
    ).count()

    on_leave_today = db.query(LeaveRequest).filter(
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).count()

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).count()

    # Payroll summary for current month
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    month_payrolls = db.query(Payroll).filter(
        Payroll.month == current_month,
        Payroll.year == current_year
    ).all()

    total_payroll_month = sum(p.net_salary for p in month_payrolls)
    payroll_status_month = "PROCESSED" if month_payrolls else "NOT_GENERATED"

    # Department distribution
    all_emps = db.query(Employee).all()
    dept_dist = {}
    for e in all_emps:
        dept_dist[e.department] = dept_dist.get(e.department, 0) + 1

    return DashboardSummaryResponse(
        total_employees=total_employees,
        active_employees=active_employees,
        present_today=present_today,
        on_leave_today=on_leave_today,
        pending_leaves=pending_leaves,
        total_payroll_month=total_payroll_month,
        payroll_status_month=payroll_status_month,
        department_distribution=dept_dist
    )

@router.get("/attendance/export")
def export_attendance_report(
    format: str = Query("csv", regex="^(csv)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Export Attendance Report in CSV format."""
    query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if department:
        query = query.filter(Employee.department == department)

    records = query.order_by(Attendance.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Employee Code", "Employee Name", "Department", "Status", "Working Hours", "Check In", "Check Out", "Overridden"])

    for r in records:
        writer.writerow([
            str(r.date),
            r.employee.employee_code,
            r.employee.full_name,
            r.employee.department,
            r.status.value,
            r.working_hours,
            r.check_in_time.strftime("%H:%M:%S") if r.check_in_time else "N/A",
            r.check_out_time.strftime("%H:%M:%S") if r.check_out_time else "N/A",
            "Yes" if r.is_override else "No"
        ])

    output.seek(0)
    filename = f"attendance_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/leaves/export")
def export_leaves_report(
    format: str = Query("csv", regex="^(csv)$"),
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Export Leave Report in CSV format."""
    query = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id)
    if department:
        query = query.filter(Employee.department == department)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)

    records = query.order_by(LeaveRequest.applied_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Request ID", "Employee Code", "Employee Name", "Department", "Leave Type", "Start Date", "End Date", "Total Days", "Status", "Is LOP", "Reason", "Applied Date"])

    for r in records:
        writer.writerow([
            r.id,
            r.employee.employee_code,
            r.employee.full_name,
            r.employee.department,
            r.leave_type.value,
            str(r.start_date),
            str(r.end_date),
            r.total_days,
            r.status.value,
            "Yes" if r.is_lop else "No",
            r.reason,
            r.applied_at.strftime("%Y-%m-%d %H:%M")
        ])

    output.seek(0)
    filename = f"leave_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/payroll/export")
def export_payroll_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    department: Optional[str] = Query(None),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Export Payroll Summary in CSV format."""
    query = db.query(Payroll).join(Employee, Payroll.employee_id == Employee.id).filter(
        Payroll.month == month,
        Payroll.year == year
    )
    if department:
        query = query.filter(Employee.department == department)

    records = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee Code", "Employee Name", "Department", "Period", "Gross Salary", "LOP Days", "LOP Deduction", "Tax Deduction", "Total Deductions", "Net Salary", "Status", "Is Credited", "Payment Ref"])

    for r in records:
        writer.writerow([
            r.employee.employee_code,
            r.employee.full_name,
            r.employee.department,
            f"{month}/{year}",
            r.gross_salary,
            r.lop_days,
            r.lop_deduction,
            r.tax_deduction,
            r.total_deductions,
            r.net_salary,
            r.status.value,
            "Yes" if r.is_credited else "No",
            r.payment_reference or "N/A"
        ])

    output.seek(0)
    filename = f"payroll_summary_{month}_{year}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
