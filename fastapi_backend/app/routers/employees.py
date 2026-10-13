import shutil
from pathlib import Path
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, Employee, UserRole
from app.models.document import EmployeeDocument
from app.models.leave import LeaveBalance
from app.models.notification import NotificationType
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeDetailResponse, DocumentResponse
)
from app.routers.deps import get_current_user, require_hr_or_admin, require_admin
from app.services.notification_service import send_notification
from app.services.audit_service import log_action

router = APIRouter(prefix="/employees", tags=["Employee Management"])

def generate_employee_code(db: Session) -> str:
    """Generate sequential employee code like EMP-001, EMP-002."""
    count = db.query(Employee).count() + 1
    return f"EMP-{count:03d}"

@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List employees with optional filters (accessible to all authenticated users)."""
    query = db.query(Employee).join(User, Employee.user_id == User.id)
    
    if department:
        query = query.filter(Employee.department == department)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_fmt)) |
            (Employee.last_name.ilike(search_fmt)) |
            (Employee.employee_code.ilike(search_fmt)) |
            (Employee.department.ilike(search_fmt)) |
            (Employee.designation.ilike(search_fmt)) |
            (User.email.ilike(search_fmt))
        )
        
    employees = query.all()
    results = []
    for emp in employees:
        results.append(EmployeeResponse(
            id=emp.id,
            user_id=emp.user_id,
            employee_code=emp.employee_code,
            email=emp.user.email,
            role=emp.user.role.value,
            first_name=emp.first_name,
            last_name=emp.last_name,
            phone=emp.phone,
            department=emp.department,
            designation=emp.designation,
            joining_date=emp.joining_date,
            date_of_birth=emp.date_of_birth,
            address=emp.address,
            basic_salary=emp.basic_salary,
            hra=emp.hra,
            allowances=emp.allowances,
            deductions=emp.deductions,
            gross_salary=emp.gross_salary,
            is_active=emp.is_active,
            created_at=emp.created_at,
            updated_at=emp.updated_at
        ))
    return results

@router.post("", response_model=EmployeeDetailResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR can onboard a new employee, creates user account and initial leave balance."""
    # Check email duplicate
    existing_user = db.query(User).filter(User.email == emp_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # 1. Create User
    new_user = User(
        email=emp_in.email,
        hashed_password=hash_password(emp_in.password or "Company@2026"),
        role=emp_in.role,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # 2. Create Employee Profile
    emp_code = generate_employee_code(db)
    new_emp = Employee(
        user_id=new_user.id,
        employee_code=emp_code,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        phone=emp_in.phone,
        department=emp_in.department,
        designation=emp_in.designation,
        joining_date=emp_in.joining_date,
        date_of_birth=emp_in.date_of_birth,
        address=emp_in.address,
        basic_salary=emp_in.basic_salary,
        hra=emp_in.hra,
        allowances=emp_in.allowances,
        deductions=emp_in.deductions,
        is_active=True
    )
    db.add(new_emp)
    db.flush()

    # 3. Create Default Leave Balance for Current Year
    current_year = datetime.utcnow().year
    leave_bal = LeaveBalance(
        employee_id=new_emp.id,
        year=current_year,
        casual_allocated=12.0,
        casual_used=0.0,
        sick_allocated=10.0,
        sick_used=0.0,
        paid_allocated=15.0,
        paid_used=0.0,
        lop_days=0.0
    )
    db.add(leave_bal)
    db.commit()
    db.refresh(new_emp)

    # 4. Onboarding Email Notification
    send_notification(
        db=db,
        user=new_user,
        notification_type=NotificationType.ONBOARDING,
        context={
            "name": new_emp.full_name,
            "employee_code": new_emp.employee_code,
            "department": new_emp.department,
            "designation": new_emp.designation,
            "email": new_user.email
        }
    )

    # 5. Audit Log
    log_action(
        db=db,
        action="EMPLOYEE_ONBOARDED",
        entity="Employee",
        entity_id=str(new_emp.id),
        details=f"Onboarded {new_emp.full_name} ({new_emp.employee_code}) into {new_emp.department}",
        user=current_user
    )

    return EmployeeDetailResponse(
        id=new_emp.id,
        user_id=new_emp.user_id,
        employee_code=new_emp.employee_code,
        email=new_user.email,
        role=new_user.role.value,
        first_name=new_emp.first_name,
        last_name=new_emp.last_name,
        phone=new_emp.phone,
        department=new_emp.department,
        designation=new_emp.designation,
        joining_date=new_emp.joining_date,
        date_of_birth=new_emp.date_of_birth,
        address=new_emp.address,
        basic_salary=new_emp.basic_salary,
        hra=new_emp.hra,
        allowances=new_emp.allowances,
        deductions=new_emp.deductions,
        gross_salary=new_emp.gross_salary,
        is_active=new_emp.is_active,
        created_at=new_emp.created_at,
        updated_at=new_emp.updated_at,
        documents=[]
    )

@router.get("/{employee_id}", response_model=EmployeeDetailResponse)
def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete employee profile with documents."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Check permissions: Employee can only view their own unless Admin/HR
    if current_user.role == UserRole.EMPLOYEE and emp.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    docs = [
        DocumentResponse(
            id=d.id,
            title=d.title,
            document_type=d.document_type,
            file_name=d.file_name,
            file_path=d.file_path,
            file_size=d.file_size,
            uploaded_at=d.uploaded_at
        )
        for d in emp.documents
    ]

    return EmployeeDetailResponse(
        id=emp.id,
        user_id=emp.user_id,
        employee_code=emp.employee_code,
        email=emp.user.email,
        role=emp.user.role.value,
        first_name=emp.first_name,
        last_name=emp.last_name,
        phone=emp.phone,
        department=emp.department,
        designation=emp.designation,
        joining_date=emp.joining_date,
        date_of_birth=emp.date_of_birth,
        address=emp.address,
        basic_salary=emp.basic_salary,
        hra=emp.hra,
        allowances=emp.allowances,
        deductions=emp.deductions,
        gross_salary=emp.gross_salary,
        is_active=emp.is_active,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
        documents=docs
    )

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    emp_update: EmployeeUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR can update employee details."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = emp_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if hasattr(emp, field):
            setattr(emp, field, val)

    if emp_update.is_active is not None:
        emp.user.is_active = emp_update.is_active

    db.commit()
    db.refresh(emp)

    log_action(
        db=db,
        action="EMPLOYEE_UPDATED",
        entity="Employee",
        entity_id=str(emp.id),
        details=f"Updated details for {emp.full_name}",
        user=current_user
    )

    return EmployeeResponse(
        id=emp.id,
        user_id=emp.user_id,
        employee_code=emp.employee_code,
        email=emp.user.email,
        role=emp.user.role.value,
        first_name=emp.first_name,
        last_name=emp.last_name,
        phone=emp.phone,
        department=emp.department,
        designation=emp.designation,
        joining_date=emp.joining_date,
        date_of_birth=emp.date_of_birth,
        address=emp.address,
        basic_salary=emp.basic_salary,
        hra=emp.hra,
        allowances=emp.allowances,
        deductions=emp.deductions,
        gross_salary=emp.gross_salary,
        is_active=emp.is_active,
        created_at=emp.created_at,
        updated_at=emp.updated_at
    )

@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin can soft deactivate an employee account."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.is_active = False
    emp.user.is_active = False
    db.commit()

    log_action(
        db=db,
        action="EMPLOYEE_DEACTIVATED",
        entity="Employee",
        entity_id=str(emp.id),
        details=f"Deactivated employee {emp.full_name} ({emp.employee_code})",
        user=current_user
    )

    return {"message": f"Employee {emp.full_name} deactivated successfully"}

@router.post("/{employee_id}/documents", response_model=DocumentResponse)
def upload_employee_document(
    employee_id: int,
    title: str = Form(...),
    document_type: str = Form("Resume"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload documents (Resume, ID proof, certificates) for an employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check permission
    if current_user.role == UserRole.EMPLOYEE and emp.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    emp_doc_dir = settings.DOCUMENTS_DIR / emp.employee_code
    emp_doc_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    clean_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
    target_path = emp_doc_dir / clean_filename

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = target_path.stat().st_size

    new_doc = EmployeeDocument(
        employee_id=emp.id,
        title=title,
        document_type=document_type,
        file_name=file.filename,
        file_path=str(target_path),
        file_size=file_size
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    log_action(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity="EmployeeDocument",
        entity_id=str(new_doc.id),
        details=f"Uploaded {title} ({document_type}) for {emp.full_name}",
        user=current_user
    )

    return DocumentResponse(
        id=new_doc.id,
        title=new_doc.title,
        document_type=new_doc.document_type,
        file_name=new_doc.file_name,
        file_path=new_doc.file_path,
        file_size=new_doc.file_size,
        uploaded_at=new_doc.uploaded_at
    )

@router.get("/documents/{document_id}/download")
def download_employee_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download an uploaded employee document securely."""
    doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == UserRole.EMPLOYEE and doc.employee.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = Path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=doc.file_name,
        media_type="application/octet-stream"
    )
