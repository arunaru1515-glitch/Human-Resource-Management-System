# Enterprise Human Resource Management System (HRMS)

A production-ready, full-stack Human Resource Management System (HRMS) featuring role-based dashboards, automated payroll computation, attendance tracking with duplicate prevention, multi-type leave approval workflows, ReportLab PDF salary slip generation, and Django admin portal integration.

---

## 🏗️ Architecture & Tech Stack

- **REST API Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11) with async routing, dependency injection guards, and Swagger/OpenAPI documentation.
- **ORM & Database:** SQLAlchemy 2.0 with [SQLite](https://www.sqlite.org/) (active `hrms.db`) & MySQL dump compatibility.
- **Admin Interface:** [Django](https://www.djangoproject.com/) Admin (Port 8080) pointing directly to the identical database models.
- **PDF Generation Engine:** [ReportLab](https://www.reportlab.com/) custom canvas with tabular earnings, statutory deductions, company header, and net pay banner.
- **Frontend:** Responsive, modular multi-page interface (Vanilla HTML5, modern CSS3 design system, and modular ES6 JavaScript).
- **Authentication:** JWT (JSON Web Tokens) with direct `bcrypt` password hashing and role-based access control (Admin, HR, Employee).

---

## 📁 Repository Directory Structure

```text
Human Resource Management System/
├── fastapi_backend/              # FastAPI REST API & Core Engine
│   ├── app/
│   │   ├── core/                 # App configuration & JWT/bcrypt security
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/             # SQLAlchemy engine & session factory
│   │   │   └── session.py
│   │   ├── models/               # Database ORM models
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── document.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   ├── payroll.py
│   │   │   ├── notification.py
│   │   │   └── audit_log.py
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── routers/              # Role-guarded API endpoints
│   │   │   ├── auth.py
│   │   │   ├── employees.py
│   │   │   ├── attendance.py
│   │   │   ├── leaves.py
│   │   │   ├── payroll.py
│   │   │   ├── salary_slips.py
│   │   │   ├── reports.py
│   │   │   ├── audit_logs.py
│   │   │   └── notifications.py
│   │   ├── services/             # ReportLab PDF & business logic
│   │   │   ├── pdf_service.py
│   │   │   ├── audit_service.py
│   │   │   └── notification_service.py
│   │   └── main.py               # FastAPI application entrypoint
│   ├── hrms.db                   # Active SQLite database file
│   └── requirements.txt
│
├── django_admin/                 # Django Administration Portal
│   ├── hrms_admin/               # Django project settings & unmanaged models
│   └── manage.py
│
├── frontend/                     # Modular Multi-Page Web Client
│   ├── index.html                # Smart session router
│   ├── login.html                # Authentication portal with test sign-in pills
│   ├── dashboard.html            # Admin/HR analytics & KPI overview
│   ├── employees.html            # Employee directory & onboarding modals
│   ├── attendance.html           # Attendance stream & admin override
│   ├── leaves.html               # Leave review & balance tracking
│   ├── payroll.html              # Monthly payroll processor & PDF slips
│   ├── reports.html              # CSV export center (Attendance, Leaves, Payroll)
│   ├── audit-logs.html           # Security & mutation audit trail
│   ├── employee-portal.html      # Employee self-service workspace & live clock
│   ├── css/
│   │   ├── base.css              # Design tokens, buttons, forms, tables, modals
│   │   ├── layout.css            # Sidebar, topbar, mobile drawer
│   │   ├── auth.css              # Login screen styling
│   │   └── pages.css             # KPI cards, portal clock, balance widgets
│   └── js/
│       ├── api.js                # Reusable REST client with auth tokens
│       ├── auth.js               # Route guards & toast notifications
│       ├── layout.js             # Role-based sidebar & topbar renderer
│       └── pages/                # Clean page controllers
│           ├── login.js
│           ├── dashboard.js
│           ├── employees.js
│           ├── attendance.js
│           ├── leaves.js
│           ├── payroll.js
│           ├── reports.js
│           ├── audit-logs.js
│           └── employee-portal.js
│
├── database/                     # SQL Database Artifacts
│   ├── hrms_schema.sql           # Pure SQL table schemas & constraints
│   └── hrms_dump.sql             # SQL data dump with seed records
│
├── postman/                      # API Testing Suite
│   └── hrms_postman_collection.json # Complete Postman Collection v2.1.0
│
├── screenshots/                  # Portal screenshots
└── README.md
```

---

## 🔑 User Roles & Access Control

The system supports three distinct access tiers with strict role-based access control (RBAC):
- **Administrator**: System administration, user account management, and full operational control.
- **HR Manager**: Employee onboarding, leave reviews, attendance oversight, and monthly payroll processing.
- **Employee**: Self-service portal for live clock-in/out, leave applications, attendance history, and salary slip downloads.

> ℹ️ *Note: For security best practices, account credentials should be managed via environment variables or provided privately during evaluation submission.*

---

## 🚀 How to Run Locally

### 1. Start the FastAPI Backend (Port 8000)
```powershell
cd "Human Resource Management System\fastapi_backend"
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Start the Django Admin Portal (Port 8080)
```powershell
cd "Human Resource Management System\django_admin"
python manage.py runserver 8080
```
- Django Admin URL: [http://localhost:8080/admin](http://localhost:8080/admin)

### 3. Start the Frontend (Port 3000)
```powershell
cd "Human Resource Management System\frontend"
python -m http.server 3000
```
- Open in your browser: [http://localhost:3000](http://localhost:3000)

---

## 💼 Core Features & Capabilities

### 1. User Authentication & RBAC
- JSON Web Token (JWT) with standard Bearer authorization header.
- Direct `bcrypt` password hashing with salts.
- Automatic session persistence in browser `localStorage`.
- Role-based route guards restricting sensitive management views to Admin/HR.

### 2. Employee Directory & Document Storage
- Automatic employee code generation (`EMP-001`, `EMP-002`, ...).
- Filter by department, designation, and search by name/email/code.
- Onboarding modal for new hires.
- Support for uploading verified employee files (Resume, ID Proof, Employment Contract).

### 3. Attendance Management & Live Clock Widget
- Real-time digital clock with live working hours computation.
- **Duplicate Check-in Prevention:** Prevents multiple clock-ins within the same day.
- **Admin Manual Override:** Admin/HR can adjust check-in/out timestamps and mark statuses (`PRESENT`, `HALF_DAY`, `ABSENT`).

### 4. Leave Management & Loss of Pay (LOP)
- Track distinct leave balances: Casual Leave, Sick Leave, Annual Paid Leave, and Unpaid Leave.
- Approval workflow: HR/Admin can approve or reject with comments.
- Approved unpaid leaves automatically count towards Loss of Pay (LOP) during payroll generation.

### 5. Payroll Processing & PDF Salary Slips
- Attendance-based monthly salary calculation:
  $$\text{Per Day Rate} = \frac{\text{Base Salary}}{30}$$
  $$\text{Deductions} = \text{LOP Days} \times \text{Per Day Rate}$$
  $$\text{Net Salary} = \text{Base Salary} + \text{Allowances} - \text{Deductions}$$
- Salary credit simulation (updates status to `PAID`).
- Payroll record locking to prevent post-disbursement modifications.
- Official ReportLab PDF salary slip generation featuring company header, earnings breakdown, statutory deductions, net payable banner, and date timestamp.

### 6. Reports & CSV Export Center
- 1-click CSV data exports:
  - `attendance_export.csv`
  - `leaves_export.csv`
  - `payroll_export.csv`
- Dynamic date range and month/year filters.

### 7. Security Audit Trail
- Read-only system audit log recording timestamp, actor email, action taken, entity type, entity ID, and client IP address.

---

## 📮 Postman Collection
Import `postman/hrms_postman_collection.json` into Postman.
- The collection includes pre-configured environment variables (`base_url` and `token`).
- Running the **Login - Admin** request automatically extracts the JWT access token and sets it as the active token for all subsequent requests.
