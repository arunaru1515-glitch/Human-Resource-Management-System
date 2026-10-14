from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, model_validator
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
    first_name: Optional[str] = "Employee"
    last_name: Optional[str] = "Staff"
    email: EmailStr
    password: Optional[str] = "Company@2026"
    role: UserRole = UserRole.EMPLOYEE

    @model_validator(mode="before")
    @classmethod
    def populate_name_and_salary(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # If full_name was provided
            full_name = values.get("full_name") or values.get("name")
            if full_name:
                parts = str(full_name).strip().split(maxsplit=1)
                if not values.get("first_name"):
                    values["first_name"] = parts[0]
                if not values.get("last_name"):
                    values["last_name"] = parts[1] if len(parts) > 1 else parts[0]
            
            # If first_name given without last_name
            if values.get("first_name") and not values.get("last_name"):
                parts = str(values["first_name"]).strip().split(maxsplit=1)
                values["first_name"] = parts[0]
                values["last_name"] = parts[1] if len(parts) > 1 else parts[0]

            # Fallbacks
            if not values.get("first_name"):
                values["first_name"] = "Employee"
            if not values.get("last_name"):
                values["last_name"] = values["first_name"]

            # Salary mapping
            if "base_salary" in values and ("basic_salary" not in values or not values.get("basic_salary")):
                values["basic_salary"] = values["base_salary"]

            # Date parsing if DD-MM-YYYY was sent
            jd = values.get("joining_date")
            if isinstance(jd, str) and "-" in jd:
                parts = jd.split("-")
                if len(parts) == 3 and len(parts[0]) == 2 and len(parts[2]) == 4:
                    values["joining_date"] = f"{parts[2]}-{parts[1]}-{parts[0]}"
        return values

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
    full_name: Optional[str] = None
    base_salary: Optional[float] = None
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
