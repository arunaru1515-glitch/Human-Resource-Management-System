# Enterprise Human Resource Management System (HRMS)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)

A modern, full-stack Human Resource Management System engineered for enterprise workforce governance, payroll automation, and operational compliance. Built with a high-performance **FastAPI** backend, a responsive **React 19** frontend, and a **Django** administration backoffice, the platform delivers role-based access control (RBAC), multi-shift scheduling, dynamic salary component configuration, attendance tracking with GPS geolocation, automated payroll calculation with ReportLab PDF slip generation, and real-time audit logging.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Quick Start: How to Run Locally](#quick-start-how-to-run-locally)
  - [1. FastAPI REST API (Port 8000)](#1-fastapi-rest-api-port-8000)
  - [2. Django Administration Portal (Port 8080)](#2-django-administration-portal-port-8080)
  - [3. React Web Application (Port 3000)](#3-react-web-application-port-3000)
- [Core Functional Modules](#core-functional-modules)
  - [1. Executive Dashboard & Real-Time Alerts](#1-executive-dashboard--real-time-alerts)
  - [2. Shift & Work Schedule Management](#2-shift--work-schedule-management)
  - [3. Dynamic Salary Components & Compensation](#3-dynamic-salary-components--compensation)
  - [4. Holiday Calendar & Announcements](#4-holiday-calendar--announcements)
  - [5. Attendance & Geolocation Web Check-In](#5-attendance--geolocation-web-check-in)
  - [6. Leave Management & Approval Pipeline](#6-leave-management--approval-pipeline)
  - [7. Automated Payroll & PDF Salary Slips](#7-automated-payroll--pdf-salary-slips)
  - [8. Analytics & CSV Data Exports](#8-analytics--csv-data-exports)
  - [9. Employee Self-Service Portal](#9-employee-self-service-portal)
  - [10. Audit Trail & Compliance](#10-audit-trail--compliance)
- [Application Screenshots & Visual Tour](#application-screenshots--visual-tour)
  - [Master Screenshot Index](#master-screenshot-index)
  - [Visual Showcase Gallery](#visual-showcase-gallery)
- [Postman API Collection Testing](#postman-api-collection-testing)
- [Running Backend Automated Tests](#running-backend-automated-tests)
- [Database Architecture & Configuration](#database-architecture--configuration)
- [Production Security Recommendations](#production-security-recommendations)
- [Repository & Source Code](#repository--source-code)

---

## Technology Stack

| Layer | Technologies & Tools |
|---|---|
| **Frontend UI/UX** | React 19, Vite 6, Modern Vanilla CSS Design System with dark/light glassmorphic tokens, Lucide React Icons |
| **Backend REST API** | FastAPI, Python 3.10+, Uvicorn, Pydantic v2 schemas, Dependency Injection |
| **Database & ORM** | SQLAlchemy 2.0 ORM with SQLite (development default) and MySQL production compatibility via `DATABASE_URL` |
| **Administration Backoffice** | Django 5.x Admin Portal (`http://localhost:8080/admin/`) |
| **Authentication & RBAC** | JWT (JSON Web Tokens) with PBKDF2/bcrypt hashing, granular role authorization (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`) |
| **Document & PDF Generation** | ReportLab PDF Engine (custom enterprise pay slip layouts), Python CSV streaming |
| **API Testing & Verification** | 10-module Postman Collection with automated token chaining, Python `unittest` suite |

---

## Repository Structure

```text
Human-Resource-Management-System/
├── database/
│   └── hrms_schema.sql                  # Database schema DDL (tables, indexes, foreign keys)
├── django_admin/
│   ├── admin_app/                       # Django models & admin configuration
│   ├── hrms_admin_project/              # Django settings & routing
│   ├── manage.py                        # Django CLI management script
│   └── setup_admin.py                   # Automated superuser initialization
├── fastapi_backend/
│   ├── app/
│   │   ├── core/                        # JWT authentication, security & environment config
│   │   ├── database/                    # SQLAlchemy database session & engine management
│   │   ├── models/                      # ORM models (User, Employee, Attendance, Shift, Holiday, SalaryComponent, Payroll, Leave, Notification, AuditLog)
│   │   ├── routers/                     # 11 REST API modules (Auth, Employees, Attendance, Shifts, Holidays, SalaryComponents, Leaves, Payroll, Reports, Notifications, AuditLogs)
│   │   ├── schemas/                     # Pydantic v2 request/response schemas
│   │   ├── services/                    # Business logic (Audit logging, Notifications, ReportLab PDF slip generation)
│   │   └── main.py                      # FastAPI application entry point, CORS & router aggregation
│   ├── tests/
│   │   └── test_hrms_backend.py         # Comprehensive backend automated test suite
│   ├── requirements.txt                 # Backend Python package dependencies
│   ├── seed_data.py                     # Initial seed dataset with enterprise role accounts
│   └── reset_database.py                # Database reset & initialization utility
├── frontend/
│   ├── public/                          # Static web assets
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, NotificationCenter, StatCard, Modal dialogs
│   │   ├── context/                     # AuthContext with token session handling & role state
│   │   ├── pages/                       # Dashboard, Employees, Attendance, CheckIn, Shifts, Holidays, SalaryComponents, Leaves, Payroll, Reports, AuditLogs, EmployeePortal
│   │   ├── services/                    # Centralized API fetch client with authorization interceptors
│   │   ├── App.jsx                      # Client routing & layout structure
│   │   ├── index.css                    # Design token system, responsive layout & glassmorphic styling
│   │   └── main.jsx                     # Vite React entry point
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── hrms_postman_collection.json     # Complete 10-module Postman API test collection
├── screenshots/                         # Comprehensive visual verification screenshots (20 views)
└── README.md                            # Complete system documentation
```

---

## Role-Based Access Control (RBAC)

The system enforces strict role-based access control across three user tiers:

| Tier | Role | Capabilities & Scope |
|---|---|---|
| **Tier 1** | **System Administrator (`ADMIN`)** | Full system governance, work shift configurations, compensation structure, payroll processing & locking, system broadcast notifications, audit log inspection, and Django admin backoffice. |
| **Tier 2** | **HR Manager (`HR_MANAGER`)** | Employee onboarding and directory management, department assignments, leave application review/approval workflow, attendance manual overrides, and monthly payroll generation. |
| **Tier 3** | **Employee (`EMPLOYEE`)** | Employee self-service portal access, daily web check-in with GPS geolocation capture, leave balance tracking, personal leave applications, and individual PDF salary slip downloads. |

Database initialization and sample enterprise accounts can be seeded at any time using:
```powershell
python seed_data.py
```
*(Run inside the `fastapi_backend` directory with the virtual environment activated).*

---

## Quick Start: How to Run Locally

Run the backend API, Django administration portal, and React frontend in three separate terminal windows starting from the repository root.

### 1. FastAPI REST API (Port 8000)

```powershell
cd fastapi_backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Django Administration Portal (Port 8080)

Open a second terminal:

```powershell
cd django_admin
python -m venv venv
.\venv\Scripts\activate
pip install -r ..\fastapi_backend\requirements.txt
python setup_admin.py
python manage.py runserver 8080
```

- **Admin Portal URL:** [http://localhost:8080/admin/](http://localhost:8080/admin/)
- **Superuser Access:** Initialized automatically by `setup_admin.py`.

### 3. React Web Application (Port 3000)

Open a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

- **Web Application URL:** [http://localhost:3000/](http://localhost:3000/)
- **API Base URL:** Configured to `http://localhost:8000/api` by default (can be customized via `VITE_API_BASE_URL`).

---

## Core Functional Modules

### 1. Executive Dashboard & Real-Time Alerts
- High-level KPI cards tracking total workforce headcount, active shifts, daily attendance percentage, and pending leave requests.
- Department-wise headcount distribution and real-time attendance status indicators.
- **Floating Notification Center:** Real-time unread badge counter, individual/bulk mark-as-read controls, and administrative broadcast announcements.

### 2. Shift & Work Schedule Management (`/shifts`)
- Define distinct shifts (`GENERAL`, `NIGHT`, `FLEXIBLE`, `REMOTE`) with configurable start/end hours.
- Configurable grace periods (e.g., 15 minutes) and daily overtime thresholds (e.g., 8 hours).
- Assign shifts individually or department-wide with effective date ranges.
- Real-time **Shift Attendance Report** tracking late check-in minutes, early departures, and overtime hours.

### 3. Dynamic Salary Components & Compensation (`/salary-components`)
- Define **Earnings & Allowances** (e.g., Special Allowance, Travel Allowance, Performance Bonus) and **Deductions** (e.g., Provident Fund, Health Insurance, TDS).
- Flexible calculation modes: Fixed amount (₹) or percentage of gross salary (%).
- Interactive **Revise Compensation** modal to update base compensation structures with mandatory audit trail logging.

### 4. Holiday Calendar & Announcements (`/holidays`)
- Annual company calendar showcasing national, regional, and company holidays.
- Centered modal interface with backdrop blur to schedule new holidays.
- Automatic broadcast of notifications to all employees upon holiday creation.

### 5. Attendance & Geolocation Web Check-In (`/check-in` & `/attendance`)
- Browser-based check-in / check-out with automated GPS geolocation capture (`latitude`, `longitude`, `location_name`).
- Real-time validation against assigned shift timings to calculate late arrivals and overtime.
- Administrative manual attendance overrides with mandatory justification notes.

### 6. Leave Management & Approval Pipeline (`/leaves`)
- Real-time leave quota balance cards (Casual Leave, Sick Leave, Earned Leave, Unpaid Leave).
- Application modal with start/end date selectors and justification input.
- Dual-action HR approval pipeline (`Approve` / `Reject`) with reviewer remarks.

### 7. Automated Payroll & PDF Salary Slips (`/payroll`)
- One-click monthly batch payroll processing based on active attendance days, approved leaves, allowances, and statutory deductions.
- Key financial summary metrics: Total Gross, Net Disbursed, Deductions, and Pending Slips.
- Interactive slide-out **Payslip Drawer** for instant itemized inspection.
- On-demand **ReportLab PDF Salary Slip** generation featuring enterprise branding, earnings/deductions breakdown, and net pay banner.

### 8. Analytics & CSV Data Exports (`/reports`)
- Executive analytics dashboard displaying workforce metrics and attendance trends.
- One-click CSV export streams:
  - `Export Attendance CSV` (with custom date range filter)
  - `Export Leaves CSV`
  - `Export Payroll CSV` (with month/year filter)

### 9. Employee Self-Service Portal (`/portal`)
- Personalized employee view for clocking in/out, checking shift assignments, and reviewing personal attendance records.
- Instant access to leave quota balances, leave request tracking, and direct download of generated PDF salary slips.

### 10. Audit Trail & Compliance (`/audit-logs`)
- Automated, immutable security logging for all critical system events (`USER_LOGIN`, `SHIFT_CREATED`, `COMPENSATION_REVISED`, `PAYROLL_GENERATED`, `LEAVE_APPROVED`).
- Captures acting user, action type, target entity, client IP address, and timestamp.

---

## Application Screenshots & Visual Tour

The `screenshots/` directory contains complete visual verification across every module, role, and administrative workflow in the system.

### Master Screenshot Index

| # | Feature / View | File Name | Route / URL | Key Capabilities Displayed |
|:---:|---|---|---|---|
| **1** | **Admin Dashboard** | [`screenshots/Admin_dashboard.png`](screenshots/Admin_dashboard.png) | `/` | Executive KPI cards, department distribution, attendance overview |
| **2** | **Notification Center Drawer** | [`screenshots/Admin_Dashboard_Notifications.png`](screenshots/Admin_Dashboard_Notifications.png) | `/` (bell icon) | Slide-out notification drawer, unread counter, broadcast modal |
| **3** | **Employee Directory** | [`screenshots/Employees_directory.png`](screenshots/Employees_directory.png) | `/employees` | Employee cards, department filters, search, onboarding actions |
| **4** | **Shift Management** | [`screenshots/Shift_Management.png`](screenshots/Shift_Management.png) | `/shifts` | Shift cards, working hours, grace periods, shift assignment table |
| **5** | **Attendance Web Punch-In** | [`screenshots/Attendance_CheckIn.png`](screenshots/Attendance_CheckIn.png) | `/check-in` | GPS geolocation capture, shift schedule status, punch in/out |
| **6** | **Attendance Tracking & Logs** | [`screenshots/Attendance_tracking.png`](screenshots/Attendance_tracking.png) | `/attendance` | Daily attendance log, status badges, manual override tools |
| **7** | **Salary Components** | [`screenshots/Salary_Components.png`](screenshots/Salary_Components.png) | `/salary-components` | Dynamic Earnings & Deductions builder, fixed vs percentage rules |
| **8** | **Holiday Calendar & Modal** | [`screenshots/Holiday_Calendar_Modal.png`](screenshots/Holiday_Calendar_Modal.png) | `/holidays` | Company calendar view, scheduled holidays, add holiday modal |
| **9** | **Payroll Processing** | [`screenshots/Payroll_processing.png`](screenshots/Payroll_processing.png) | `/payroll` | Monthly payroll batch processing table, metrics summary |
| **10** | **Payslip Breakdown Drawer** | [`screenshots/Payroll_Processing_Slip.png`](screenshots/Payroll_Processing_Slip.png) | `/payroll` | Slide-out drawer with itemized earnings, deductions, and net pay |
| **11** | **Generated PDF Salary Slip** | [`screenshots/salary_slip_pdf.png`](screenshots/salary_slip_pdf.png) | Download endpoint | Official ReportLab PDF salary slip with company header & breakdown |
| **12** | **Reports & CSV Export Center** | [`screenshots/Reports_export.png`](screenshots/Reports_export.png) | `/reports` | Executive summary metrics, 1-click CSV export buttons |
| **13** | **Employee Self-Service Portal** | [`screenshots/Employee_portal.png`](screenshots/Employee_portal.png) | `/portal` | Employee personal dashboard, attendance summary, leave balances |
| **14** | **Employee Portal Detailed View** | [`screenshots/Employee_Portal01.png`](screenshots/Employee_Portal01.png) | `/portal` | Detailed employee portal view with leave applications & payslips |
| **15** | **Audit Logs & Security Trail** | [`screenshots/Audit_logs.png`](screenshots/Audit_logs.png) | `/audit-logs` | Tamper-evident audit log table, actor IP tracking, action timestamps |
| **16** | **Django Admin Backoffice** | [`screenshots/Django_admin.png`](screenshots/Django_admin.png) | `http://localhost:8080/admin/` | Django administration portal, model governance, superuser actions |
| **17** | **FastAPI Swagger REST API** | [`screenshots/FastAPI_Swagger_API.jpeg`](screenshots/FastAPI_Swagger_API.jpeg) | `http://localhost:8000/docs` | Comprehensive interactive API documentation (all 11 routers) |
| **18** | **Swagger API Overview** | [`screenshots/Swagger_overview.png`](screenshots/Swagger_overview.png) | `http://localhost:8000/docs` | High-level interactive Swagger REST API route overview |
| **19** | **Swagger Create Employee** | [`screenshots/Swagger_create_employee.png`](screenshots/Swagger_create_employee.png) | `POST /api/employees` | Interactive testing of employee onboarding endpoint with schema validation |
| **20** | **Swagger Dashboard Summary** | [`screenshots/Swagger_dashboard_summary.png`](screenshots/Swagger_dashboard_summary.png) | `GET /api/reports/dashboard` | Interactive testing of executive dashboard analytics endpoint |

---

### Visual Showcase Gallery

#### 1. Executive Dashboard & Real-Time Notifications
| Admin Executive Dashboard | Notification Center Drawer |
|:---:|:---:|
| ![Admin Dashboard](screenshots/Admin_dashboard.png) | ![Notification Drawer](screenshots/Admin_Dashboard_Notifications.png) |
| *Central executive metrics, department distribution, and attendance overview* | *Real-time slide-out notification drawer with broadcast triggers* |

#### 2. Workforce & Shift Schedule Governance
| Employee Directory & Workforce | Shift Management & Grace Periods |
|:---:|:---:|
| ![Employee Directory](screenshots/Employees_directory.png) | ![Shift Management](screenshots/Shift_Management.png) |
| *Workforce listing with department filters, status badges, and search* | *Multi-shift schedule setup with grace periods and overtime policies* |

#### 3. Attendance Tracking & Geolocation Web Punch-In
| Browser Check-In with GPS Geolocation | Attendance Tracking & Records |
|:---:|:---:|
| ![Attendance Check-In](screenshots/Attendance_CheckIn.png) | ![Attendance Tracking](screenshots/Attendance_tracking.png) |
| *Web check-in capturing GPS latitude, longitude, and shift timing* | *Comprehensive daily attendance log with status badges and override controls* |

#### 4. Compensation Structure & Holiday Calendar
| Dynamic Salary Components | Holiday Calendar & Announcement Modal |
|:---:|:---:|
| ![Salary Components](screenshots/Salary_Components.png) | ![Holiday Calendar Modal](screenshots/Holiday_Calendar_Modal.png) |
| *Customizable Earnings & Allowances vs Statutory Deductions* | *Company annual holiday scheduler with backdrop blur and broadcast modal* |

#### 5. Payroll Processing & PDF Salary Slips
| Monthly Batch Payroll Processing | Slide-Out Payslip Inspection Drawer |
|:---:|:---:|
| ![Payroll Processing](screenshots/Payroll_processing.png) | ![Payroll Processing Slip](screenshots/Payroll_Processing_Slip.png) |
| *Automated monthly batch payroll generation with disbursement metrics* | *Interactive slide-out drawer displaying itemized earnings and deductions* |

| Official ReportLab PDF Salary Slip | Executive Analytics & CSV Export Hub |
|:---:|:---:|
| ![Salary Slip PDF](screenshots/salary_slip_pdf.png) | ![Reports & Exports](screenshots/Reports_export.png) |
| *Generated enterprise PDF salary slip with company branding and breakdown* | *Executive dashboard with 1-click CSV streaming data export buttons* |

#### 6. Employee Self-Service Portal
| Employee Self-Service Portal | Detailed Employee Portal View |
|:---:|:---:|
| ![Employee Portal](screenshots/Employee_portal.png) | ![Employee Portal View](screenshots/Employee_Portal01.png) |
| *Personal employee view showing attendance history and leave quota* | *Detailed employee portal displaying leave management and payslip history* |

#### 7. Security Audit Trail & Django Backoffice
| Security Audit Logs & Compliance | Django 5.x Administration Backoffice |
|:---:|:---:|
| ![Audit Logs](screenshots/Audit_logs.png) | ![Django Admin](screenshots/Django_admin.png) |
| *Immutable security log tracking user actions, entity changes, and client IPs* | *Django admin portal for administrative database governance* |

#### 8. Interactive FastAPI Swagger REST API Documentation
| Interactive FastAPI Swagger API | Swagger Endpoints Overview |
|:---:|:---:|
| ![FastAPI Swagger API](screenshots/FastAPI_Swagger_API.jpeg) | ![Swagger Overview](screenshots/Swagger_overview.png) |
| *Interactive Swagger REST API documentation across all 11 router groups* | *Complete endpoint listing and OpenAPI schema definitions* |

| Swagger: Employee Creation Endpoint | Swagger: Dashboard Summary Analytics |
|:---:|:---:|
| ![Swagger Create Employee](screenshots/Swagger_create_employee.png) | ![Swagger Dashboard Summary](screenshots/Swagger_dashboard_summary.png) |
| *Interactive testing of employee onboarding with Pydantic request validation* | *Live execution of executive KPI analytics summary endpoint* |

---

## Postman API Collection Testing

A fully configured Postman collection is included in the repository, covering all 11 router groups across 10 organized collection folders with automated authentication token chaining.

- **Collection File:** [`postman/hrms_postman_collection.json`](postman/hrms_postman_collection.json)

### How to Import and Run:
1. Launch Postman and click **Import**.
2. Select [`postman/hrms_postman_collection.json`](postman/hrms_postman_collection.json).
3. Ensure the FastAPI backend is running on `http://localhost:8000`.
4. Open folder **`1. Authentication`** and execute **`Login - Admin (Auto Sets Token)`**.
5. The post-response test script automatically extracts the JWT `access_token` and sets it into the collection-level `{{token}}` variable.
6. All subsequent requests across all 9 remaining folders will automatically authenticate without manual token copying.

### Collection Modules:
1. `1. Authentication` (Admin, HR Manager, Employee Login, Profile `/me`)
2. `2. Employee Management` (List, Onboard, Update, Deactivate)
3. `3. Attendance Management` (Today's Status, Punch-In with Geolocation, Punch-Out, History, Admin Override)
4. `4. Shift & Work Schedule Management` (List Shifts, Create Shift, Assign Shift, Attendance Report)
5. `5. Holiday & Company Calendar` (List Holidays, Create Holiday, Upcoming Holidays)
6. `6. Salary Components & Compensation` (List Components, Create Earning/Deduction, Revise Structure)
7. `7. Leave Management` (Quota Balances, Apply for Leave, List Requests, Approve/Reject)
8. `8. Payroll & Salary Slips` (Generate Monthly Payroll, List Records, Simulate Credit, Lock, Download PDF Slip)
9. `9. Reports & Analytics (CSV Exports)` (Dashboard Summary, Attendance CSV, Leaves CSV, Payroll CSV)
10. `10. Notifications & Audit Logs` (My Notifications, Unread Count, Mark Read, Broadcast, Audit Trail)

---

## Running Backend Automated Tests

To execute the backend automated test suite:

```powershell
cd fastapi_backend
.\venv\Scripts\activate
python -m unittest discover -s tests -p "test_*.py" -v
```

The test suite exercises authentication, role authorization guards, employee lifecycle, attendance recording, shift assignment, salary component calculation, leave approvals, and payroll locking.

---

## Database Architecture & Configuration

- **Zero-Configuration Default:** The application defaults to SQLite (`hrms.db`), requiring no external database installation for local development. Tables are automatically initialized by SQLAlchemy on startup.
- **Production MySQL Compatibility:** To connect to a MySQL or PostgreSQL database in production, set the `DATABASE_URL` environment variable:
  ```env
  DATABASE_URL=mysql+pymysql://username:password@localhost:3306/hrms_db
  ```
- **DDL Schema Reference:** The formal database schema script is available at [`database/hrms_schema.sql`](database/hrms_schema.sql).

---

## Production Security Recommendations

1. **Secret Key Management:** Replace development fallback secret keys in `app/core/config.py` and `hrms_admin_project/settings.py` with cryptographically secure values loaded via environment variables (`SECRET_KEY`).
2. **CORS Restrictions:** Restrict FastAPI CORS origins (`allow_origins`) to verified production frontend domains rather than wildcard `*`.
3. **Database Credentials:** Avoid storing database credentials in plain text; use secure secret managers or protected `.env` files outside version control.
4. **HTTPS & Reverse Proxy:** Terminate TLS using a reverse proxy (e.g., Nginx, Caddy, or AWS ALB) in front of Uvicorn.
5. **Django Security Settings:** In production, set `DEBUG = False` and explicitly define `ALLOWED_HOSTS` in `django_admin/hrms_admin_project/settings.py`.

---

## Repository & Source Code

- **GitHub Repository:** [https://github.com/arunaru1515-glitch/Human-Resource-Management-System](https://github.com/arunaru1515-glitch/Human-Resource-Management-System)
- **Author:** Arun ([@arunaru1515-glitch](https://github.com/arunaru1515-glitch))

---

## License

This project is licensed under the [MIT License](LICENSE).