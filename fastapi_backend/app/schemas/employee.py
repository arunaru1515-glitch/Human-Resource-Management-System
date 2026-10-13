from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class DocumentResponse(BaseModel):
    id: int
    title: str
    document_type: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: str
    designation: str
    joining_date: date
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    basic_salary: float = 0.0
    hra: float = 0.0
    allowances: float = 0.0
    deductions: float = 0.0

class EmployeeCreate(EmployeeBase):
    email: EmailStr
    password: Optional[str] = "Company@2026"
    role: UserRole = UserRole.EMPLOYEE

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    basic_salary: Optional[float] = None
    hra: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    employee_code: str
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: bool
    gross_salary: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmployeeDetailResponse(EmployeeResponse):
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True
