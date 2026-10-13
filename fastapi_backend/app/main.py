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
    redoc_url="/redoc"
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
    audit_logs
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
