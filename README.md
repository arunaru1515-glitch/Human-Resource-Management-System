# Enterprise Human Resource Management System (HRMS)

A production-grade, full-stack Human Resource Management System featuring a modern React frontend, high-performance FastAPI REST API, Django administration backoffice, SQLAlchemy ORM with SQLite/MySQL support, JWT role-based access control (RBAC), multi-shift scheduling, dynamic salary components, automated payroll generation with ReportLab PDF slips, CSV analytics export, real-time notification center, and comprehensive audit trails.

---

## Technology Stack

- **Frontend:** React 19, Vite, JavaScript (ES6+), Modern Vanilla CSS Design System with dark/light glassmorphic tokens, Lucide Icons
- **Backend REST API:** FastAPI, Python 3.10+, Uvicorn, Pydantic v2
- **ORM & Database:** SQLAlchemy with SQLite (default) and MySQL production compatibility via `DATABASE_URL`
- **Administration Backoffice:** Django 5.x Admin Portal (`http://localhost:8080/admin/`)
- **Security & Authentication:** JWT (JSON Web Tokens) with PBKDF2/bcrypt hashing, granular role-based authorization (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`)
- **PDF Slip & Reporting:** ReportLab PDF salary slip engine, Python CSV stream exports
- **API Testing & Verification:** Comprehensive Postman Collection (10 modules) and automated Python unittest suite

---

## Repository Structure

```text
Human-Resource-Management-System/
├── database/
│   └── hrms_schema.sql                  # Database schema DDL
├── django_admin/
│   ├── admin_app/                       # Django models & admin configuration
│   ├── hrms_admin_project/              # Django settings & routing
│   ├── manage.py                        # Django CLI
│   └── setup_admin.py                   # Automated superuser initialization
├── fastapi_backend/
│   ├── app/
│   │   ├── core/                        # JWT auth, security, app configuration
│   │   ├── database/                    # DB session & connection management
│   │   ├── models/                      # SQLAlchemy models (User, Employee, Attendance, Shift, Holiday, SalaryComponent, Payroll, Leave, Notification, AuditLog)
│   │   ├── routers/                     # 11 REST API routers (Auth, Employees, Attendance, Shifts, Holidays, SalaryComponents, Leaves, Payroll, Reports, Notifications, AuditLogs)
│   │   ├── schemas/                     # Pydantic v2 request/response schemas
│   │   ├── services/                    # Business logic (Audit, Notifications, PDF generation)
│   │   └── main.py                      # FastAPI app entry point with CORS & router wiring
│   ├── tests/
│   │   └── test_hrms_backend.py         # Full backend automated test suite
│   ├── requirements.txt                 # Backend Python dependencies
│   ├── seed_data.py                     # Initial seed dataset with 8 enterprise accounts
│   └── reset_database.py                # Database reset & initialization utility
├── frontend/
│   ├── public/                          # Static assets
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, NotificationCenter, StatCard, etc.
│   │   ├── context/                     # AuthContext with token session handling
│   │   ├── pages/                       # Dashboard, Employees, Attendance, CheckIn, Shifts, Holidays, SalaryComponents, Leaves, Payroll, Reports, AuditLogs, EmployeePortal
│   │   ├── services/                    # Centralized fetch API wrapper with token interceptors
│   │   ├── App.jsx                      # Client router & navigation structure
│   │   ├── index.css                    # Global design tokens & CSS system
│   │   └── main.jsx                     # Vite React entry point
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── hrms_postman_collection.json     # Complete 10-module Postman API collection
├── screenshots/                         # Submission verification screenshots
└── README.md                            # Complete system documentation
```

---

## Test & Evaluation Credentials

The system comes pre-seeded with 8 active enterprise accounts across all access tiers:

| Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **Admin** | `admin@hrms.com` | `admin123` | Full system access: Shifts, Compensation, Payroll, Audit Logs, Settings |
| **HR Manager** | `hr@hrms.com` | `hr123` | Employee management, Leave approvals, Attendance override, Payroll |
| **HR Specialist** | `priya@hrms.com` | `priya123` | Onboarding, Shift assignments, Holiday announcements |
| **Employee (Dev)** | `shyam@hrms.com` | `shyam123` | Employee portal, Web check-in, Leave requests, View/Download payslips |
| **Employee (Dev)** | `rahul@hrms.com` | `rahul123` | Employee portal, Attendance tracking, Personal payslip history |
| **Employee (Sales)** | `anita@hrms.com` | `anita123` | Employee portal, Personal leave balance, Check-in/out |
| **Employee (Marketing)**| `vikram@hrms.com` | `vikram123` | Employee portal, Profile & Document viewing |
| **Employee (Support)** | `sneha@hrms.com` | `sneha123` | Employee portal, Roster schedule, Attendance punch |

*Note: All seed passwords follow the `<name>123` pattern.*

---

## How to Run Locally

Run the backend, Django admin, and frontend in three separate terminal windows from the repository root:

### 1. FastAPI Backend API (`Port 8000`)

```powershell
cd fastapi_backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Django Administration Portal (`Port 8080`)

```powershell
cd django_admin
python -m venv venv
.\venv\Scripts\activate
pip install -r ..\fastapi_backend\requirements.txt
python setup_admin.py
python manage.py runserver 8080
```
- **Admin Portal:** [http://localhost:8080/admin/](http://localhost:8080/admin/)
- **Default Superuser:** `admin@hrms.com` / `admin123`

### 3. React Frontend Web Application (`Port 3000`)

```powershell
cd frontend
npm install
npm run dev
```
- **Web App URL:** [http://localhost:3000/](http://localhost:3000/)

---

## Core Feature Modules

### 1. Shift & Work Schedule Management (`/shifts`)
- Define custom shifts (`GENERAL`, `NIGHT`, `FLEXIBLE`, `REMOTE`) with configurable start/end times.
- Set flexible grace periods (e.g., 15 minutes) and daily overtime thresholds (e.g., 8 hours).
- Assign shifts individually or department-wide with effective date ranges.
- Real-time **Shift Attendance Report** tracking late check-in minutes, early checkouts, and computed overtime hours.

### 2. Dynamic Salary Components & Compensation (`/salary-components`)
- Define distinct **Earnings & Allowances** (e.g., Special Allowance, Travel Allowance, Performance Bonus) and **Deductions** (e.g., PF, Health Insurance, TDS).
- Support for both fixed amounts (₹) and percentage of gross salary (%) calculations with optional variable tags.
- Interactive **Revise Compensation** tool to instantly update an employee's base salary structure with historical audit trail logging.

### 3. Holiday Calendar & Announcements (`/holidays`)
- Comprehensive annual company calendar displaying national, regional, and company holidays.
- Modal popup interface with backdrop blur to schedule new holidays.
- Automatic broadcast of notifications to all employees upon holiday creation.

### 4. Real-time Notification Center (`NotificationCenter.jsx`)
- Interactive floating notification drawer accessible via the top navigation bell.
- Unread badge counter with real-time refresh.
- Mark individual or all notifications as read.
- Broadcast announcement modal for Admins and HR Managers.

### 5. Attendance & Geolocation Web Check-In (`/check-in` & `/attendance`)
- Browser-based check-in / check-out with automatic GPS geolocation capture (`latitude`, `longitude`, `location_name`).
- Validation against assigned shift timings to automatically flag late arrivals and compute overtime.
- Administrative manual attendance overrides with mandatory justification notes.

### 6. Leave Management & Approval Pipeline (`/leaves`)
- Real-time leave balance cards (Casual, Sick, Earned, Unpaid).
- Leave application modal with start/end date pickers and reason inputs.
- Dual-action HR approval pipeline (`Approve` / `Reject`) with reviewer remarks.

### 7. Payroll Processing & PDF Salary Slips (`/payroll`)
- One-click monthly payroll generation for all active employees based on actual attendance days, deductions, and allowances.
- Executive summary metrics (Total Gross, Net Disbursed, Deductions, Pending Slips).
- Payroll actions: **Simulate Credit**, **Lock Payroll Record**, and **Download PDF Slip**.
- Interactive slide-out **Pay Slip Drawer** for immediate breakdown inspection without downloading.

### 8. Analytics & CSV Exports (`/reports`)
- Executive dashboard summary cards with department-wise headcounts and attendance rates.
- One-click CSV export endpoints:
  - `Export Attendance CSV` (with date range filter)
  - `Export Leaves CSV`
  - `Export Payroll CSV` (with month/year filter)

### 9. Audit Trail & Compliance (`/audit-logs`)
- Automatic security logging of all critical actions (`USER_LOGIN`, `SHIFT_CREATED`, `COMPENSATION_REVISED`, `PAYROLL_GENERATED`, `LEAVE_APPROVED`).
- Tracks acting user, target entity, IP address, timestamp, and metadata changes.

---

## Postman API Collection Testing

The repository contains a fully configured Postman collection with 10 modules and automated token chaining:
- **File:** [postman/hrms_postman_collection.json](file:///c:/Users/HP/Desktop/Backend%20Accessment/Human%20Resource%20Management%20System(HRMS)/Human%20Resource%20Management%20System/postman/hrms_postman_collection.json)

### How to Import & Run in Postman:
1. Open Postman and click **Import**.
2. Select `postman/hrms_postman_collection.json`.
3. Run the first request: **`1. Authentication > Login - Admin (Auto Sets Token)`**.
4. The test script automatically captures `access_token` and saves it to the `{{token}}` collection variable.
5. All subsequent requests in the other 9 folders will automatically authenticate without manual copy-pasting.

### Collection Folders:
1. `1. Authentication` (Admin, HR, Employee Login, Profile `/me`)
2. `2. Employee Management` (List, Onboard, Update, Deactivate)
3. `3. Attendance Management` (Today, Clock-In with Geolocation, Clock-Out, History, Override)
4. `4. Shift & Work Schedule Management` (List Shifts, Create Shift, Assign Shift, Attendance Report)
5. `5. Holiday & Company Calendar` (List Holidays, Create Holiday, Upcoming Holidays)
6. `6. Salary Components & Compensation` (List Components, Create Earning/Deduction, Revise Structure)
7. `7. Leave Management` (Quota Balances, Apply, List, Approve/Reject)
8. `8. Payroll & Salary Slips` (Generate, List, Simulate Credit, Lock, Download PDF Slip)
9. `9. Reports & Analytics (CSV Exports)` (Dashboard Summary, Attendance CSV, Leaves CSV, Payroll CSV)
10. `10. Notifications & Audit Logs` (My Notifications, Unread Count, Mark Read, Broadcast, Audit Trail)

---

## Running Backend Automated Tests

To run the complete test suite against the backend API:

```powershell
cd fastapi_backend
.\venv\Scripts\activate
python -m unittest discover -s tests -p "test_*.py" -v
```

---

## Key Submission Screenshots Guide

The following 8 screenshots capture all critical features required for grading:

| # | Screenshot File Name | Feature / View | URL & Steps to Capture |
|---|---|---|---|
| **1** | `01_Admin_Dashboard_Notifications.png` | **Admin Dashboard & Notification Drawer** | `http://localhost:3000/` (click the top bell icon to open the floating notification drawer) |
| **2** | `02_Shift_Management.png` | **Shift Management & Schedules** | `http://localhost:3000/shifts` (shows shift cards, timings, and grace periods) |
| **3** | `03_Salary_Components.png` | **Salary Components & Structure** | `http://localhost:3000/salary-components` (shows Earnings & Deductions columns with percentage/fixed badges) |
| **4** | `04_Payroll_Processing_Slip.png` | **Payroll Table & Payslip Drawer** | `http://localhost:3000/payroll` (shows period picker, metric cards, and slide-out payslip drawer) |
| **5** | `05_Attendance_CheckIn.png` | **Attendance & Geolocation Punch-In** | `http://localhost:3000/check-in` (shows GPS coordinates, shift schedule, and punch buttons) |
| **6** | `06_Holiday_Calendar_Modal.png` | **Holiday Calendar & Add Holiday Modal** | `http://localhost:3000/holidays` (click "+ Add Holiday" to display centered modal with blur backdrop) |
| **7** | `07_Employee_Portal.png` | **Employee Self-Service Portal** | `http://localhost:3000/portal` (logged in as `emp@hrms.com`, showing personal attendance & leaves) |
| **8** | `08_FastAPI_Swagger_API.png` | **Interactive Swagger REST API Docs** | `http://localhost:8000/docs` (shows all 11 router groups and schemas) |

---

## Production Security Recommendations

1. **Secret Key Management:** Store `SECRET_KEY` in environment variables rather than hardcoding.
2. **CORS Origins:** Configure explicit allowed domains in FastAPI instead of wildcard `*`.
3. **Database Migration:** For enterprise production deployments, connect via `DATABASE_URL` to PostgreSQL or MySQL and manage schema migrations with Alembic.
4. **HTTPS / SSL:** Terminate TLS using a reverse proxy (Nginx or Caddy) in front of Uvicorn.