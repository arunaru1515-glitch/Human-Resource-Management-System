from datetime import date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class ReportFilterParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    department: Optional[str] = None
    employee_id: Optional[int] = None

class DashboardSummaryResponse(BaseModel):
    total_employees: int
    active_employees: int
    present_today: int
    on_leave_today: int
    pending_leaves: int
    total_payroll_month: float
    payroll_status_month: str
    department_distribution: Dict[str, int]
