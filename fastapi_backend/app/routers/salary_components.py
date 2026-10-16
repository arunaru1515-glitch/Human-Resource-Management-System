from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, Employee, UserRole
from app.models.salary_component import SalaryComponent, ComponentType
from app.schemas.salary_component import (
    SalaryComponentCreate, SalaryComponentUpdate,
    SalaryComponentResponse, CompensationReviseRequest
)
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/salary-components", tags=["Salary Components & Compensation"])


@router.post("", response_model=SalaryComponentResponse)
def create_salary_component(
    data: SalaryComponentCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Create a new salary component (earning or deduction)."""
    existing = db.query(SalaryComponent).filter(SalaryComponent.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A salary component with this name already exists")

    component = SalaryComponent(**data.model_dump())
    db.add(component)
    db.commit()
    db.refresh(component)

    log_action(db=db, action="SALARY_COMPONENT_CREATED", entity="SalaryComponent",
               entity_id=str(component.id),
               details=f"Component '{component.name}' ({component.component_type}) created",
               user=current_user)
    return component


@router.get("", response_model=List[SalaryComponentResponse])
def list_salary_components(
    component_type: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all salary components with optional type filter."""
    query = db.query(SalaryComponent)
    if active_only:
        query = query.filter(SalaryComponent.is_active == True)
    if component_type:
        query = query.filter(SalaryComponent.component_type == component_type.upper())
    return query.order_by(SalaryComponent.name).all()


@router.get("/{component_id}", response_model=SalaryComponentResponse)
def get_salary_component(
    component_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific salary component."""
    component = db.query(SalaryComponent).filter(SalaryComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Salary component not found")
    return component


@router.put("/{component_id}", response_model=SalaryComponentResponse)
def update_salary_component(
    component_id: int,
    data: SalaryComponentUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Update a salary component configuration."""
    component = db.query(SalaryComponent).filter(SalaryComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Salary component not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(component, key, value)

    db.commit()
    db.refresh(component)

    log_action(db=db, action="SALARY_COMPONENT_UPDATED", entity="SalaryComponent",
               entity_id=str(component.id),
               details=f"Component '{component.name}' updated", user=current_user)
    return component


@router.delete("/{component_id}")
def delete_salary_component(
    component_id: int,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Deactivate a salary component."""
    component = db.query(SalaryComponent).filter(SalaryComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Salary component not found")

    component.is_active = False
    db.commit()
    return {"message": f"Salary component '{component.name}' deactivated"}


@router.post("/revise-compensation")
def revise_employee_compensation(
    data: CompensationReviseRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Revise an employee's base salary structure."""
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    old_gross = emp.gross_salary

    if data.basic_salary is not None:
        emp.basic_salary = data.basic_salary
    if data.hra is not None:
        emp.hra = data.hra
    if data.allowances is not None:
        emp.allowances = data.allowances
    if data.deductions is not None:
        emp.deductions = data.deductions

    db.commit()
    db.refresh(emp)
    new_gross = emp.gross_salary

    log_action(
        db=db,
        action="COMPENSATION_REVISED",
        entity="Employee",
        entity_id=str(emp.id),
        details=f"Compensation revised for {emp.full_name}. Gross: ₹{old_gross:,.2f} → ₹{new_gross:,.2f}. Note: {data.revision_note or 'N/A'}",
        user=current_user
    )

    return {
        "message": f"Compensation updated for {emp.full_name}",
        "employee_id": emp.id,
        "employee_name": emp.full_name,
        "old_gross_salary": old_gross,
        "new_gross_salary": new_gross,
        "basic_salary": emp.basic_salary,
        "hra": emp.hra,
        "allowances": emp.allowances,
        "deductions": emp.deductions
    }
