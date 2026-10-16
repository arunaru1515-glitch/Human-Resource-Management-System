import os
import sys
from datetime import date, datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User, Employee, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveBalance, LeaveType, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus, SalarySlip
from app.models.notification import Notification, NotificationType
from app.models.audit_log import AuditLog
from app.models.holiday import Holiday, HolidayType
from app.models.shift import Shift, ShiftType, EmployeeShift
from app.models.salary_component import SalaryComponent, ComponentType
from app.services.pdf_service import generate_salary_slip_pdf

def seed_database():
    print("1. Re-creating all tables cleanly...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    current_year = datetime.utcnow().year
    today = date.today()

    print("2. Seeding users and employee profiles...")

    users_employees_data = [
        {
            "email": "admin@hrms.com",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "code": "EMP-001",
            "first_name": "Admin",
            "last_name": "User",
            "phone": "9000000001",
            "department": "Management",
            "designation": "System Administrator",
            "joining_date": date(2024, 1, 1),
            "dob": date(1990, 1, 1),
            "basic_salary": 100000.0,
            "hra": 30000.0,
            "allowances": 10000.0,
            "deductions": 2000.0,
        },
        {
            "email": "hr@hrms.com",
            "password": "hr123",
            "role": UserRole.HR,
            "code": "EMP-002",
            "first_name": "HR",
            "last_name": "Manager",
            "phone": "9000000002",
            "department": "Human Resources",
            "designation": "HR Specialist",
            "joining_date": date(2024, 1, 1),
            "dob": date(1992, 5, 12),
            "basic_salary": 60000.0,
            "hra": 20000.0,
            "allowances": 5000.0,
            "deductions": 1500.0,
        },
        {
            "email": "employee@hrms.com",
            "password": "employee123",
            "role": UserRole.EMPLOYEE,
            "code": "EMP-003",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "9000000003",
            "department": "Engineering",
            "designation": "Software Developer",
            "joining_date": date(2024, 6, 1),
            "dob": date(1995, 8, 20),
            "basic_salary": 50000.0,
            "hra": 15000.0,
            "allowances": 5000.0,
            "deductions": 1000.0,
        },
        {
            "email": "shyam@hrms.com",
            "password": "shyam123",
            "role": UserRole.EMPLOYEE,
            "code": "EMP-004",
            "first_name": "Shyam",
            "last_name": "Connor",
            "phone": "9888877777",
            "department": "Engineering",
            "designation": "Frontend Developer",
            "joining_date": date(2024, 10, 1),
            "dob": date(1996, 4, 15),
            "basic_salary": 55000.0,
            "hra": 18000.0,
            "allowances": 7000.0,
            "deductions": 2000.0,
        },
        {
            "email": "kavin@hrms.com",
            "password": "kavin123",
            "role": UserRole.EMPLOYEE,
            "code": "EMP-005",
            "first_name": "Kavin",
            "last_name": "Kumar",
            "phone": "9876543211",
            "department": "Engineering",
            "designation": "Backend Developer",
            "joining_date": date(2024, 2, 1),
            "dob": date(1997, 11, 23),
            "basic_salary": 52000.0,
            "hra": 16000.0,
            "allowances": 6000.0,
            "deductions": 1800.0,
        },
        {
            "email": "priya@hrms.com",
            "password": "priya123",
            "role": UserRole.HR,
            "code": "EMP-006",
            "first_name": "Priya",
            "last_name": "Sharma",
            "phone": "9876543212",
            "department": "Human Resources",
            "designation": "Talent Acquisition Specialist",
            "joining_date": date(2024, 3, 1),
            "dob": date(1994, 7, 14),
            "basic_salary": 58000.0,
            "hra": 18000.0,
            "allowances": 5000.0,
            "deductions": 1500.0,
        },
        {
            "email": "rahul@hrms.com",
            "password": "rahul123",
            "role": UserRole.EMPLOYEE,
            "code": "EMP-007",
            "first_name": "Rahul",
            "last_name": "Verma",
            "phone": "9876543213",
            "department": "Marketing",
            "designation": "Digital Marketing Strategist",
            "joining_date": date(2024, 4, 1),
            "dob": date(1996, 9, 8),
            "basic_salary": 48000.0,
            "hra": 15000.0,
            "allowances": 5000.0,
            "deductions": 1200.0,
        },
        {
            "email": "ananya@hrms.com",
            "password": "ananya123",
            "role": UserRole.EMPLOYEE,
            "code": "EMP-008",
            "first_name": "Ananya",
            "last_name": "Reddy",
            "phone": "9876543214",
            "department": "Finance",
            "designation": "Financial Analyst",
            "joining_date": date(2024, 5, 1),
            "dob": date(1998, 3, 19),
            "basic_salary": 49000.0,
            "hra": 15000.0,
            "allowances": 5000.0,
            "deductions": 1500.0,
        }
    ]

    created_users = {}
    created_emps = {}

    for item in users_employees_data:
        u = User(
            email=item["email"],
            hashed_password=hash_password(item["password"]),
            role=item["role"],
            is_active=True
        )
        db.add(u)
        db.flush()
        created_users[item["email"]] = u

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
        created_emps[item["email"]] = e

        # Leave Balance
        db.add(LeaveBalance(
            employee_id=e.id,
            year=current_year,
            casual_allocated=12.0,
            casual_used=1.0,
            sick_allocated=10.0,
            sick_used=0.0,
            paid_allocated=15.0,
            paid_used=0.0,
            lop_days=0.0
        ))

    db.commit()

    print("3. Seeding Shifts...")
    gen_shift = Shift(
        name="General Day Shift",
        shift_type=ShiftType.GENERAL,
        start_time=datetime.strptime("09:00:00", "%H:%M:%S").time(),
        end_time=datetime.strptime("18:00:00", "%H:%M:%S").time(),
        grace_minutes=15,
        overtime_after_hours=8.0,
        description="Standard 9 AM to 6 PM general shift with 15 mins grace period."
    )
    night_shift = Shift(
        name="Night Shift",
        shift_type=ShiftType.NIGHT,
        start_time=datetime.strptime("21:00:00", "%H:%M:%S").time(),
        end_time=datetime.strptime("06:00:00", "%H:%M:%S").time(),
        grace_minutes=15,
        overtime_after_hours=8.0,
        description="Overnight operations shift."
    )
    flex_shift = Shift(
        name="Flexible Shift",
        shift_type=ShiftType.FLEXIBLE,
        start_time=datetime.strptime("10:00:00", "%H:%M:%S").time(),
        end_time=datetime.strptime("19:00:00", "%H:%M:%S").time(),
        grace_minutes=30,
        overtime_after_hours=8.0,
        description="Flexible core hours shift."
    )
    db.add_all([gen_shift, night_shift, flex_shift])
    db.flush()

    for emp in created_emps.values():
        db.add(EmployeeShift(
            employee_id=emp.id,
            shift_id=gen_shift.id,
            effective_from=datetime(2024, 1, 1),
            notes="Default General Day Shift assignment"
        ))

    print("4. Seeding Holidays for calendar...")
    holidays_data = [
        ("New Year's Day", date(current_year, 1, 1), HolidayType.NATIONAL, "New Year Celebration", None),
        ("Republic Day", date(current_year, 1, 26), HolidayType.NATIONAL, "National Republic Day", None),
        ("May Day", date(current_year, 5, 1), HolidayType.NATIONAL, "International Workers Day", None),
        ("Independence Day", date(current_year, 8, 15), HolidayType.NATIONAL, "National Independence Day", None),
        ("Gandhi Jayanti", date(current_year, 10, 2), HolidayType.NATIONAL, "Mahatma Gandhi's Birthday", None),
        ("Diwali", date(current_year, 11, 1), HolidayType.NATIONAL, "Festival of Lights", None),
        ("Christmas", date(current_year, 12, 25), HolidayType.NATIONAL, "Christmas Holiday", None),
        ("Regional Harvest Festival", date(current_year, 1, 15), HolidayType.REGIONAL, "Pongal / Makar Sankranti", "South"),
        ("Spring Cultural Day", date(current_year, 4, 14), HolidayType.OPTIONAL, "Optional cultural celebration", None),
    ]
    for hname, hdate, htype, hdesc, hreg in holidays_data:
        db.add(Holiday(
            name=hname,
            date=hdate,
            holiday_type=htype,
            description=hdesc,
            region=hreg,
            is_active=True
        ))

    print("5. Seeding Salary Components...")
    comps = [
        SalaryComponent(name="Performance Bonus", component_type=ComponentType.EARNING, is_percentage=False, amount=5000.0, is_variable=True, description="Monthly variable incentive"),
        SalaryComponent(name="Special Allowance", component_type=ComponentType.EARNING, is_percentage=False, amount=3000.0, is_variable=False, description="Fixed special corporate allowance"),
        SalaryComponent(name="Health Insurance", component_type=ComponentType.DEDUCTION, is_percentage=False, amount=1200.0, is_variable=False, description="Corporate medical insurance deduction"),
        SalaryComponent(name="Provident Fund (PF)", component_type=ComponentType.DEDUCTION, is_percentage=True, percentage=12.0, is_variable=False, description="12% statutory deduction from basic salary"),
    ]
    db.add_all(comps)

    print("6. Seeding Attendance history...")
    for days_back in range(7, 0, -1):
        dt = today - timedelta(days=days_back)
        if dt.weekday() >= 5:
            continue
        for emp in created_emps.values():
            cin = datetime(dt.year, dt.month, dt.day, 9, 5, 0)
            cout = datetime(dt.year, dt.month, dt.day, 18, 10, 0)
            db.add(Attendance(
                employee_id=emp.id,
                date=dt,
                check_in_time=cin,
                check_out_time=cout,
                working_hours=9.08,
                status=AttendanceStatus.PRESENT,
                shift_id=gen_shift.id,
                is_late=False,
                is_early_checkout=False,
                overtime_hours=1.08,
                late_minutes=5
            ))

    # Today check-in for John and Shyam
    db.add(Attendance(
        employee_id=created_emps["employee@hrms.com"].id,
        date=today,
        check_in_time=datetime(today.year, today.month, today.day, 9, 2, 0),
        status=AttendanceStatus.PRESENT,
        working_hours=0.0,
        shift_id=gen_shift.id
    ))
    db.add(Attendance(
        employee_id=created_emps["shyam@hrms.com"].id,
        date=today,
        check_in_time=datetime(today.year, today.month, today.day, 9, 10, 0),
        status=AttendanceStatus.PRESENT,
        working_hours=0.0,
        shift_id=gen_shift.id
    ))

    print("7. Seeding Leave Requests...")
    db.add(LeaveRequest(
        employee_id=created_emps["shyam@hrms.com"].id,
        leave_type=LeaveType.CASUAL,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=6),
        total_days=2.0,
        reason="Family function and travel",
        status=LeaveStatus.PENDING,
        is_lop=False
    ))
    db.add(LeaveRequest(
        employee_id=created_emps["kavin@hrms.com"].id,
        leave_type=LeaveType.SICK,
        start_date=today - timedelta(days=8),
        end_date=today - timedelta(days=7),
        total_days=2.0,
        reason="Viral fever and rest",
        status=LeaveStatus.APPROVED,
        is_lop=False,
        reviewed_by_id=created_users["hr@hrms.com"].id,
        reviewer_comment="Approved. Take care!",
        reviewed_at=datetime.utcnow() - timedelta(days=9)
    ))

    print("8. Seeding Payroll & Slips for previous month...")
    prev_month = 9 if today.month == 10 else (today.month - 1 or 12)
    prev_year = today.year if today.month > 1 else today.year - 1

    for emp in created_emps.values():
        gross = emp.basic_salary + emp.hra + emp.allowances
        tax = round(gross * 0.05, 2)
        other = emp.deductions
        total_ded = round(tax + other, 2)
        net = round(gross - total_ded, 2)

        p = Payroll(
            employee_id=emp.id,
            month=prev_month,
            year=prev_year,
            total_working_days=30,
            present_days=28.0,
            approved_leave_days=2.0,
            lop_days=0.0,
            basic_salary=emp.basic_salary,
            hra=emp.hra,
            allowances=emp.allowances,
            gross_salary=gross,
            lop_deduction=0.0,
            tax_deduction=tax,
            other_deductions=other,
            total_deductions=total_ded,
            net_salary=net,
            status=PayrollStatus.PAID,
            is_locked=True,
            is_credited=True,
            credited_at=datetime.utcnow() - timedelta(days=10),
            payment_reference=f"TXN-HRMS-{emp.employee_code}",
            processed_by_id=created_users["hr@hrms.com"].id
        )
        db.add(p)
        db.flush()

        pdf_path = generate_salary_slip_pdf(p, emp)
        db.add(SalarySlip(
            payroll_id=p.id,
            employee_id=emp.id,
            file_path=str(pdf_path),
            file_name=pdf_path.name
        ))

    print("9. Seeding Notifications & Audit Log...")
    db.add(Notification(
        user_id=created_users["admin@hrms.com"].id,
        title="Enterprise HRMS Active",
        message="HRMS initialized with enterprise workforce, shift tracking, and payroll configuration.",
        notification_type=NotificationType.SYSTEM,
        is_read=True,
        email_sent=True,
        email_recipient="admin@hrms.com",
        email_subject="Enterprise HRMS Initialized"
    ))
    db.add(AuditLog(
        user_id=created_users["admin@hrms.com"].id,
        user_email="admin@hrms.com",
        action="SYSTEM_INITIALIZED",
        entity="System",
        details="Enterprise database seeded with 8 @hrms.com accounts.",
        ip_address="127.0.0.1"
    ))

    db.commit()
    db.close()
    print("Seeding completed successfully! 8 @hrms.com accounts ready.")

if __name__ == "__main__":
    seed_database()
