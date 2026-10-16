
# Human Resource Management System (HRMS)

## Project Overview

The Human Resource Management System (HRMS) is a full-stack web application designed to simplify employee management and HR operations.

It helps manage employee records, attendance, leave requests, shifts, payroll, salary slips, and reports through a centralized platform.

## Technologies Used

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** FastAPI, Python
- **Admin Panel:** Django Admin
- **Database:** SQLAlchemy, SQLite / MySQL
- **Authentication:** JWT
- **Reports:** PDF and CSV generation
- **API Testing:** Postman, Swagger UI

## Main Features

- Employee Management
- Role-Based Access Control
- Attendance and Check-In / Check-Out
- Shift Management
- Leave Application and Approval
- Holiday Management
- Payroll Processing
- Salary Component Management
- PDF Salary Slip Generation
- Reports and Data Export
- Notifications
- Audit Logs
- Django Admin Panel

## Project Structure

```text
Human-Resource-Management-System/
│
├── database/
│   └── hrms_schema.sql
│
├── django_admin/
│   ├── admin_app/
│   ├── hrms_admin_project/
│   └── manage.py
│
├── fastapi_backend/
│   ├── app/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── seed_data.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── postman/
├── screenshots/
└── README.md
```

## Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js and npm
- Git
- A configured database (SQLite or MySQL)

## Installation and Setup

Clone the repository:

```bash
git clone https://github.com/arunaru1515-glitch/Human-Resource-Management-System.git
cd Human-Resource-Management-System
```

### 1. Run the FastAPI Backend

Open the first terminal:

```bash
cd fastapi_backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

**Backend URL:** http://127.0.0.1:8000

**Swagger API Documentation:** http://127.0.0.1:8000/docs

### 2. Run the Django Admin Panel

Open the second terminal:

```powershell
cd django_admin
python -m venv venv
.\venv\Scripts\activate
pip install -r ..\fastapi_backend\requirements.txt
python setup_admin.py
python manage.py runserver 8080
```

**Django Admin URL:** http://127.0.0.1:8080/admin/

Use the administrator credentials configured during setup.

### 3. Run the React Frontend

Open the third terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed in the terminal. The default Vite URL is usually:

http://localhost:5173

Ensure the frontend API configuration points to the running FastAPI backend.

## Application URLs

| Component | URL |
|---|---|
| React Frontend | http://localhost:5173 |
| FastAPI Backend | http://127.0.0.1:8000 |
| Swagger Documentation | http://127.0.0.1:8000/docs |
| Django Admin | http://127.0.0.1:8080/admin/ |

## API Testing

The FastAPI endpoints can be tested using Swagger UI or Postman.

1. Start the FastAPI backend.
2. Open the Swagger documentation.
3. Register or log in with a valid account.
4. Authorize requests when authentication is required.
5. Test the employee, attendance, leave, payroll, and other available endpoints.

## Database

The application uses SQLAlchemy for database operations and supports SQLite for development and MySQL when configured.

Make sure the database settings and environment variables are configured before starting the backend.

The SQL schema is available in the `database/` directory.

## Testing

Run the backend tests from the `fastapi_backend` directory:

```bash
python -m unittest discover -s tests
```

## Security

- Password hashing
- JWT-based authentication
- Role-based access control
- Protected API endpoints
- Audit logging

For production use, configure secure environment variables, strong secret keys, and appropriate database credentials.