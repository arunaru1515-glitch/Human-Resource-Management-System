from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import engine, Base
import app.models  # Ensure all models are registered with Base.metadata

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable, role-based Human Resource Management System (HRMS) API",
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 1,
        "docExpansion": "list"
    }
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static media files (Documents, Salary Slips)
app.mount("/media", StaticFiles(directory=str(settings.MEDIA_DIR)), name="media")

# Include API Routers under /api
from app.routers import (
    auth,
    employees,
    attendance,
    leaves,
    payroll,
    salary_slips,
    reports,
    notifications,
    audit_logs,
    holidays,
    shifts,
    salary_components
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(leaves.router, prefix=settings.API_V1_STR)
app.include_router(payroll.router, prefix=settings.API_V1_STR)
app.include_router(salary_slips.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)
app.include_router(holidays.router, prefix=settings.API_V1_STR)
app.include_router(shifts.router, prefix=settings.API_V1_STR)
app.include_router(salary_components.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "system": "Human Resource Management System (HRMS)",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health": "healthy"
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "database": "connected"}

# Custom OpenAPI schema: Clean, intermediate-level schemas list
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Scalable, role-based Human Resource Management System (HRMS) API",
        routes=app.routes,
    )
    # Intermediate core schemas representing each business domain
    core_schemas = {
        "LoginRequest",
        "Token",
        "EmployeeCreate",
        "EmployeeResponse",
        "AttendanceCheckIn",
        "AttendanceResponse",
        "LeaveApplyRequest",
        "LeaveResponse",
        "LeaveBalanceResponse",
        "PayrollResponse",
        "SalarySlipResponse",
        "DashboardSummaryResponse",
        "AuditLogResponse",
        "NotificationResponse"
    }
    if "components" in openapi_schema and "schemas" in openapi_schema["components"]:
        openapi_schema["components"]["schemas"] = {
            k: v for k, v in openapi_schema["components"]["schemas"].items()
            if k in core_schemas
        }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
