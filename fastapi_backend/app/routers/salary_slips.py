from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.payroll import SalarySlip, Payroll
from app.schemas.payroll import SalarySlipResponse
from app.routers.deps import get_current_user
from app.services.pdf_service import generate_salary_slip_pdf
from app.services.audit_service import log_action

router = APIRouter(prefix="/salary-slips", tags=["Salary Slips"])

@router.get("", response_model=List[SalarySlipResponse])
def list_salary_slips(
    employee_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List generated salary slips. Employees only see their own; Admin/HR can see all."""
    query = db.query(SalarySlip).join(Payroll, SalarySlip.payroll_id == Payroll.id).join(Employee, SalarySlip.employee_id == Employee.id)

    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        query = query.filter(SalarySlip.employee_id == emp.id)
    elif employee_id:
        query = query.filter(SalarySlip.employee_id == employee_id)

    if year:
        query = query.filter(Payroll.year == year)

    slips = query.order_by(SalarySlip.generated_at.desc()).all()
    results = []
    for s in slips:
        results.append(SalarySlipResponse(
            id=s.id,
            payroll_id=s.payroll_id,
            employee_id=s.employee_id,
            employee_name=s.employee.full_name,
            employee_code=s.employee.employee_code,
            month=s.payroll.month,
            year=s.payroll.year,
            file_name=s.file_name,
            file_path=s.file_path,
            download_count=s.download_count,
            generated_at=s.generated_at
        ))
    return results

@router.get("/{slip_id}/download")
def download_salary_slip(
    slip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download the official PDF salary slip."""
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Salary slip record not found")

    # Security check: Employee can only download their own
    if current_user.role == UserRole.EMPLOYEE and slip.employee.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = Path(slip.file_path)
    # If file doesn't exist on disk, regenerate it on the fly
    if not file_path.exists():
        file_path = generate_salary_slip_pdf(slip.payroll, slip.employee)
        slip.file_path = str(file_path)

    slip.download_count += 1
    db.commit()

    log_action(
        db=db,
        action="SALARY_SLIP_DOWNLOADED",
        entity="SalarySlip",
        entity_id=str(slip.id),
        details=f"Downloaded salary slip for {slip.employee.full_name} ({slip.payroll.month}/{slip.payroll.year})",
        user=current_user
    )

    return FileResponse(
        path=file_path,
        filename=slip.file_name,
        media_type="application/pdf"
    )
