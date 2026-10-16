
# Human Resource Management System (HRMS)

A full-stack web application for managing employee records and HR operations, including attendance, leave, shifts, payroll, salary slips, and reports.

## Technologies Used

- **Frontend:** React 19, Vite 8, JavaScript, CSS, Lucide React
- **Backend:** Python, FastAPI, Pydantic
- **Admin Panel:** Django Admin
- **Database:** SQLite, SQLAlchemy (MySQL configuration supported)
- **Authentication:** JWT
- **PDF Generation:** ReportLab
- **API Testing:** Swagger UI, Postman

## Features

- Employee management and employee self-service portal
- Role-based authentication and access control
- Attendance tracking and check-in/check-out
- Shift and holiday management
- Leave applications and approval
- Payroll processing and PDF salary slips
- Salary component management
- Dashboard and notifications
- CSV reports and data export
- Audit logs
- Django administration panel

## Project Structure

```text
Human-Resource-Management-System/
├── database/
│   └── hrms_schema.sql
├── django_admin/
│   ├── admin_app/
│   ├── hrms_admin_project/
│   ├── manage.py
│   └── setup_admin.py
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
│   ├── seed_data.py
│   └── reset_database.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
├── postman/
├── screenshots/
└── README.md
```

## Installation and Setup

### Prerequisites

Install Python, Node.js, npm, and Git before starting.

Clone the repository:

```bash
git clone https://github.com/arunaru1515-glitch/Human-Resource-Management-System.git
cd Human-Resource-Management-System
```

### 1. Start the FastAPI Backend

Open the first terminal:

```powershell
cd fastapi_backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend uses SQLite by default. Database tables are created when the application starts.

### 2. Start Django Admin

Open the second terminal from the project root:

```powershell
cd django_admin
python -m venv venv
.\venv\Scripts\activate
pip install -r ..\fastapi_backend\requirements.txt
python setup_admin.py
python manage.py runserver 8080
```

The setup script initializes the Django database tables and configures the default admin account.

**Default Django Admin login**

- Username: `admin`
- Password: `admin123`

Change default credentials before using the application outside local testing.

### 3. Start the React Frontend

Open the third terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Vite runs the frontend on port `3000`, as configured in `vite.config.js`.

## Application URLs

| Application | URL |
|---|---|
| React Frontend | http://localhost:3000 |
| FastAPI Backend | http://localhost:8000 |
| Swagger API Documentation | http://localhost:8000/docs |
| ReDoc API Documentation | http://localhost:8000/redoc |
| Backend Health Check | http://localhost:8000/health |
| Django Admin | http://localhost:8080/admin/ |

## Database Configuration

The backend uses SQLite by default and supports MySQL through the `DATABASE_URL` environment variable.

The Django admin is configured to use the same SQLite database file as the FastAPI backend.

## API Testing

Use Swagger UI or the Postman collection in the `postman/` folder to test the API endpoints.

1. Start the FastAPI backend.
2. Open [Swagger UI](http://localhost:8000/docs).
3. Log in using a valid application account.
4. Authorize requests when required.
5. Test the available API endpoints.

## Running Backend Tests

From the `fastapi_backend` directory, activate the virtual environment and run:

```powershell
python -m unittest discover -s tests
```

## Screenshots

The `screenshots/` folder contains application screenshots, including the dashboard, employee portal, attendance, payroll, Django admin, and Swagger UI.

## GitHub Repository

[Human Resource Management System](https://github.com/arunaru1515-glitch/Human-Resource-Management-System)