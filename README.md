# Human Resource Management System (HRMS)

A full-stack Human Resource Management System with a React frontend, FastAPI REST API, Django administration portal, SQLAlchemy data models, attendance and leave workflows, payroll processing, PDF salary slips, CSV reports, notifications, and audit logs.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend API:** FastAPI, Python, Uvicorn
- **ORM / Database:** SQLAlchemy with SQLite by default; MySQL can be configured through `DATABASE_URL`
- **Administration:** Django Admin
- **Authentication:** JWT-based authentication and role-based access checks
- **Documents and salary slips:** File uploads and PDF generation with ReportLab
- **API testing:** Postman collection and Python backend tests

## Repository Structure

```text
Human-Resource-Management-System-main/
├── database/
│   └── hrms_schema.sql
├── django_admin/
│   ├── admin_app/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   └── models.py
│   ├── hrms_admin_project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
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
│   │   └── test_hrms_backend.py
│   ├── requirements.txt
│   ├── seed_data.py
│   └── reset_database.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── hrms_postman_collection.json
├── screenshots/
└── README.md
```

## Prerequisites

- Python installed and available on your PATH
- Node.js and npm
- Git (optional, for cloning the repository)

## Run the Application Locally

Run the backend, Django admin, and frontend in separate terminals. The commands below are for Windows PowerShell or Command Prompt. Start from the repository root.

### 1. FastAPI backend

```powershell
cd fastapi_backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The FastAPI application creates its SQLAlchemy tables on startup. SQLite is the default database configuration. The database file is generated locally and is not included in this repository archive.

URLs:
- API root: http://localhost:8000/
- Health check: http://localhost:8000/health
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Django admin portal

Open a second terminal:

```powershell
cd django_admin
python -m venv venv
.\venv\Scripts\activate
pip install -r ..\fastapi_backend\requirements.txt
python setup_admin.py
python manage.py runserver 8080
```

Open the admin portal at http://localhost:8080/admin/.

The Django settings point to the SQLite database used by the FastAPI backend. Start FastAPI at least once first so its application tables are created. The setup script creates the initial Django superuser on its first successful run. Review `django_admin/setup_admin.py` before rerunning it on an existing database because its existing-user branch should be checked/fixed.

### 3. React frontend

Open a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite; the configured development port is http://localhost:3000/.

The frontend API service defaults to `http://localhost:8000/api`. To change the API base URL, configure `VITE_API_BASE_URL` in a local frontend environment file as needed.

## Main Features

### Authentication and access control
- JWT-based login and authenticated API requests.
- Role-based access restrictions for management endpoints.
- Frontend session information stored in browser local storage.

### Employee management
- Employee directory and employee records.
- Employee document upload and download endpoints.

### Attendance management
- Check-in and check-out.
- Attendance history and administrative overrides.
- Duplicate check-in prevention.

### Leave management
- Leave applications and review/approval workflow.
- Leave balance retrieval and balance updates.

### Payroll and salary slips
- Payroll generation and salary calculation.
- Simulated salary credit and payroll locking.
- PDF salary slip listing and download.

### Reports, notifications, and audit logs
- Dashboard summary.
- CSV exports for attendance, leave, and payroll data.
- Notifications and audit-log endpoints.

## API Testing

Import `postman/hrms_postman_collection.json` into Postman. Start the FastAPI backend before sending requests. Use the collection's login request to obtain a token, then use that token for authenticated requests.

## Run Backend Tests

From the `fastapi_backend` directory, with the virtual environment activated and dependencies installed:

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
```

Run tests against a disposable/test database where possible. The test suite performs create/update operations and should not be run against important production data.

## Database Notes

- The default database URL is configured in `fastapi_backend/app/core/config.py`.
- To use MySQL, set `DATABASE_URL` to the appropriate SQLAlchemy connection URL in your local environment.
- Do not commit database files, credentials, or production secrets.
- `database/hrms_schema.sql` is a schema artifact; it is not a substitute for configuring and initializing the runtime database.

## Security and Configuration Notes

Before deployment or public hosting:

- Set a unique, strong `SECRET_KEY` through an environment variable; do not use the development fallback.
- Replace the committed Django `SECRET_KEY` with an environment-based secret.
- Set `DEBUG = False` and restrict `ALLOWED_HOSTS` in Django.
- Restrict FastAPI CORS origins to the actual frontend origin instead of allowing every origin.
- Use secure, private credentials for administrator accounts and change any initial/default password.
- Configure HTTPS and review upload permissions and access controls.

## Screenshots

The `screenshots/` folder contains screenshots of the application UI, Django admin, Swagger endpoints, reports, attendance, payroll processing, and the generated salary slip.

## Repository

GitHub: https://github.com/arunaru1515-glitch/Human-Resource-Management-System