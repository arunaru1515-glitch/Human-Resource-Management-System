import os
import sys

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User, Employee, UserRole
from app.models.leave import LeaveBalance
from datetime import date, datetime

def reset_db():
    print("1. Wiping old database cleanly...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    current_year = datetime.utcnow().year

    print("2. Creating 3 clean, simple test accounts (Admin, HR, Employee)...")

    # 1. Admin Account
    admin_user = User(
        email="admin@hrms.com",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    admin_emp = Employee(
        user_id=admin_user.id,
        employee_code="EMP-001",
        first_name="Admin",
        last_name="User",
        phone="9000000001",
        department="Management",
        designation="System Administrator",
        joining_date=date(2024, 1, 1),
        basic_salary=100000.0,
        hra=30000.0,
        allowances=10000.0,
        deductions=2000.0,
        is_active=True
    )
    db.add(admin_emp)

    # 2. HR Account
    hr_user = User(
        email="hr@hrms.com",
        hashed_password=hash_password("hr123"),
        role=UserRole.HR,
        is_active=True
    )
    db.add(hr_user)
    db.flush()

    hr_emp = Employee(
        user_id=hr_user.id,
        employee_code="EMP-002",
        first_name="HR",
        last_name="Manager",
        phone="9000000002",
        department="Human Resources",
        designation="HR Specialist",
        joining_date=date(2024, 1, 1),
        basic_salary=60000.0,
        hra=20000.0,
        allowances=5000.0,
        deductions=1500.0,
        is_active=True
    )
    db.add(hr_emp)

    # 3. Employee Account
    emp_user = User(
        email="employee@hrms.com",
        hashed_password=hash_password("employee123"),
        role=UserRole.EMPLOYEE,
        is_active=True
    )
    db.add(emp_user)
    db.flush()

    emp_profile = Employee(
        user_id=emp_user.id,
        employee_code="EMP-003",
        first_name="John",
        last_name="Doe",
        phone="9000000003",
        department="Engineering",
        designation="Software Developer",
        joining_date=date(2024, 6, 1),
        basic_salary=50000.0,
        hra=15000.0,
        allowances=5000.0,
        deductions=1000.0,
        is_active=True
    )
    db.add(emp_profile)
    db.flush()

    # Leave balance for Employee (12 Casual, 10 Sick, 15 Paid)
    db.add(LeaveBalance(
        employee_id=emp_profile.id,
        year=current_year,
        casual_allocated=12.0,
        casual_used=0.0,
        sick_allocated=10.0,
        sick_used=0.0,
        paid_allocated=15.0,
        paid_used=0.0,
        lop_days=0.0
    ))

    db.commit()
    db.close()
    print("3. Done! Clean database ready with 3 simple accounts.")

if __name__ == "__main__":
    reset_db()
