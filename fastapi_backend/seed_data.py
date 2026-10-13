import os
import sys
from datetime import datetime, date, timedelta

# Ensure app is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, Employee, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveBalance, LeaveType, LeaveStatus
from app.models.payroll import Payroll, SalarySlip, PayrollStatus
from app.models.notification import Notification, NotificationType
from app.models.audit_log import AuditLog
from app.services.pdf_service import generate_salary_slip_pdf

def seed_database():
    print("Dropping existing tables and recreating fresh tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding initial users and employee profiles...")

    # 1. Admin
    admin_user = User(
        email="admin@company.com",
        hashed_password=hash_password("Admin@123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    admin_emp = Employee(
        user_id=admin_user.id,
        employee_code="EMP-001",
        first_name="Prakash",
        last_name="Raj S",
        phone="9876543210",
        department="Executive",
        designation="Managing Director",
        joining_date=date(2023, 1, 10),
        date_of_birth=date(1985, 5, 20),
        address="102 Corporate Avenue, City",
        basic_salary=120000.0,
        hra=40000.0,
        allowances=20000.0,
        deductions=5000.0,
        is_active=True
    )
    db.add(admin_emp)

    # 2. HR Manager
    hr_user = User(
        email="hr@company.com",
        hashed_password=hash_password("Hr@123"),
        role=UserRole.HR,
        is_active=True
    )
    db.add(hr_user)
    db.flush()

    hr_emp = Employee(
        user_id=hr_user.id,
        employee_code="EMP-002",
        first_name="Rithika",
        last_name="Sri K K",
        phone="9876543211",
        department="Human Resources",
        designation="Lead HR Specialist",
        joining_date=date(2023, 6, 1),
        date_of_birth=date(1994, 8, 15),
        address="34 Green Valley Park, City",
        basic_salary=60000.0,
        hra=20000.0,
        allowances=10000.0,
        deductions=3000.0,
        is_active=True
    )
    db.add(hr_emp)

    # 3. Standard Employees
    employees_data = [
        {
            "email": "akshaya@company.com",
            "password": "Emp@123",
            "code": "EMP-003",
            "first_name": "Akshaya",
            "last_name": "J",
            "phone": "9876543212",
            "department": "Engineering",
            "designation": "Senior Fullstack Engineer",
            "joining_date": date(2024, 2, 1),
            "dob": date(1996, 4, 12),
            "basic_salary": 70000.0,
            "hra": 25000.0,
            "allowances": 15000.0,
            "deductions": 4000.0,
        },
        {
            "email": "mohamed@company.com",
            "password": "Emp@123",
            "code": "EMP-004",
            "first_name": "Mohamed",
            "last_name": "Yusuf U",
            "phone": "9876543213",
            "department": "Engineering",
            "designation": "Backend Developer",
            "joining_date": date(2024, 4, 15),
            "dob": date(1998, 11, 25),
            "basic_salary": 50000.0,
            "hra": 18000.0,
            "allowances": 8000.0,
            "deductions": 2500.0,
        },
        {
            "email": "suresh@company.com",
            "password": "Emp@123",
            "code": "EMP-005",
            "first_name": "Suresh",
            "last_name": "V",
            "phone": "9876543214",
            "department": "Sales",
            "designation": "Key Account Manager",
            "joining_date": date(2024, 5, 1),
            "dob": date(1995, 3, 10),
            "basic_salary": 55000.0,
            "hra": 19000.0,
            "allowances": 12000.0,
            "deductions": 2800.0,
        },
        {
            "email": "anushree@company.com",
            "password": "Emp@123",
            "code": "EMP-006",
            "first_name": "Anushree",
            "last_name": "Yadav",
            "phone": "9876543215",
            "department": "Finance",
            "designation": "Financial Analyst",
            "joining_date": date(2024, 7, 1),
            "dob": date(1997, 9, 18),
            "basic_salary": 48000.0,
            "hra": 16000.0,
            "allowances": 7000.0,
            "deductions": 2000.0,
        }
    ]

    all_created_emps = [admin_emp, hr_emp]

    for item in employees_data:
        u = User(
            email=item["email"],
            hashed_password=hash_password(item["password"]),
            role=UserRole.EMPLOYEE,
            is_active=True
        )
        db.add(u)
        db.flush()

        e = Employee(
            user_id=u.id,
            employee_code=item["code"],
            first_name=item["first_name"],
            last_name=item["last_name"],
            phone=item["phone"],
            department=item["department"],
            designation=item["designation"],
            joining_date=item["joining_date"],
            date_of_birth=item["dob"],
            address="Innovation City Tech Hub",
            basic_salary=item["basic_salary"],
            hra=item["hra"],
            allowances=item["allowances"],
            deductions=item["deductions"],
            is_active=True
        )
        db.add(e)
        db.flush()
        all_created_emps.append(e)

        # Allocate Leave Balance
        bal = LeaveBalance(
            employee_id=e.id,
            year=datetime.utcnow().year,
            casual_allocated=12.0,
            casual_used=2.0,
            sick_allocated=10.0,
            sick_used=1.0,
            paid_allocated=15.0,
            paid_used=0.0,
            lop_days=0.0
        )
        db.add(bal)

    # Leave balances for Admin & HR
    for e in [admin_emp, hr_emp]:
        bal = LeaveBalance(
            employee_id=e.id,
            year=datetime.utcnow().year,
            casual_allocated=15.0,
            casual_used=0.0,
            sick_allocated=12.0,
            sick_used=0.0,
            paid_allocated=20.0,
            paid_used=0.0,
            lop_days=0.0
        )
        db.add(bal)

    db.commit()

    # 4. Attendance Seeding (Past 7 days)
    today = date.today()
    for days_back in range(7, 0, -1):
        dt = today - timedelta(days=days_back)
        if dt.weekday() >= 5:  # Skip weekend
            continue

        for emp in all_created_emps:
            cin = datetime(dt.year, dt.month, dt.day, 9, 15, 0)
            cout = datetime(dt.year, dt.month, dt.day, 18, 30, 0)
            att = Attendance(
                employee_id=emp.id,
                date=dt,
                check_in_time=cin,
                check_out_time=cout,
                working_hours=9.25,
                status=AttendanceStatus.PRESENT,
                is_override=False
            )
            db.add(att)

    # Today check-in for Akshaya and Admin
    cin_today = datetime(today.year, today.month, today.day, 9, 0, 0)
    db.add(Attendance(
        employee_id=admin_emp.id,
        date=today,
        check_in_time=cin_today,
        status=AttendanceStatus.PRESENT,
        working_hours=0.0
    ))
    db.add(Attendance(
        employee_id=all_created_emps[2].id,  # Akshaya
        date=today,
        check_in_time=cin_today,
        status=AttendanceStatus.PRESENT,
        working_hours=0.0
    ))

    # 5. Leave Requests
    # Approved leave
    db.add(LeaveRequest(
        employee_id=all_created_emps[2].id,
        leave_type=LeaveType.CASUAL,
        start_date=today - timedelta(days=10),
        end_date=today - timedelta(days=9),
        total_days=2.0,
        reason="Attending family function",
        status=LeaveStatus.APPROVED,
        is_lop=False,
        reviewed_by_id=admin_user.id,
        reviewer_comment="Approved. Enjoy!",
        reviewed_at=datetime.utcnow() - timedelta(days=11)
    ))

    # Pending leave
    db.add(LeaveRequest(
        employee_id=all_created_emps[3].id,  # Mohamed
        leave_type=LeaveType.SICK,
        start_date=today + timedelta(days=2),
        end_date=today + timedelta(days=3),
        total_days=2.0,
        reason="Doctor consultation and rest",
        status=LeaveStatus.PENDING,
        is_lop=False
    ))

    # LOP leave
    db.add(LeaveRequest(
        employee_id=all_created_emps[4].id,  # Suresh
        leave_type=LeaveType.UNPAID,
        start_date=today - timedelta(days=15),
        end_date=today - timedelta(days=14),
        total_days=2.0,
        reason="Extended vacation beyond quota",
        status=LeaveStatus.APPROVED,
        is_lop=True,
        reviewed_by_id=hr_user.id,
        reviewer_comment="Approved with Loss of Pay (LOP)",
        reviewed_at=datetime.utcnow() - timedelta(days=16)
    ))

    # 6. Payroll Seeding & Salary Slip Generation
    prev_month = 9 if today.month == 10 else (today.month - 1)
    prev_year = today.year

    for emp in all_created_emps:
        gross = emp.basic_salary + emp.hra + emp.allowances
        tax = round(gross * 0.05, 2)
        other = emp.deductions
        lop_days = 2.0 if emp.id == all_created_emps[4].id else 0.0
        daily_rate = gross / 30.0
        lop_ded = round(lop_days * daily_rate, 2)
        total_ded = round(lop_ded + tax + other, 2)
        net = round(gross - total_ded, 2)

        p = Payroll(
            employee_id=emp.id,
            month=prev_month,
            year=prev_year,
            total_working_days=30,
            present_days=28.0 - lop_days,
            approved_leave_days=2.0,
            lop_days=lop_days,
            basic_salary=emp.basic_salary,
            hra=emp.hra,
            allowances=emp.allowances,
            gross_salary=gross,
            lop_deduction=lop_ded,
            tax_deduction=tax,
            other_deductions=other,
            total_deductions=total_ded,
            net_salary=net,
            status=PayrollStatus.PAID,
            is_locked=True,
            is_credited=True,
            credited_at=datetime.utcnow() - timedelta(days=10),
            payment_reference=f"SIM-TXN-SEED-{emp.employee_code}",
            processed_by_id=hr_user.id
        )
        db.add(p)
        db.flush()

        # Generate official PDF slip
        pdf_path = generate_salary_slip_pdf(p, emp)

        slip = SalarySlip(
            payroll_id=p.id,
            employee_id=emp.id,
            file_path=str(pdf_path),
            file_name=pdf_path.name
        )
        db.add(slip)

    # 7. Initial Notifications
    db.add(Notification(
        user_id=admin_user.id,
        title="Welcome to HRMS System",
        message="System installed and operational.",
        notification_type=NotificationType.SYSTEM,
        is_read=True,
        email_sent=True,
        email_recipient="admin@company.com",
        email_subject="HRMS Initialized"
    ))

    # 8. Initial Audit Log
    db.add(AuditLog(
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="SYSTEM_INITIALIZED",
        entity="System",
        details="Initial system database and seeder executed successfully.",
        ip_address="127.0.0.1"
    ))

    db.commit()
    db.close()
    print("Database seeding completed successfully with generic enterprise records!")

if __name__ == "__main__":
    seed_database()
