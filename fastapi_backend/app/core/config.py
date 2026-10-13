import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Human Resource Management System (HRMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hrms-enterprise-secure-jwt-secret-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Defaults to SQLite for instant local execution, supports MySQL via DATABASE_URL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'hrms.db'}"
    )
    
    # Storage Paths
    MEDIA_DIR: Path = BASE_DIR / "media"
    DOCUMENTS_DIR: Path = BASE_DIR / "media" / "documents"
    SALARY_SLIPS_DIR: Path = BASE_DIR / "media" / "salary_slips"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure directories exist
settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
settings.SALARY_SLIPS_DIR.mkdir(parents=True, exist_ok=True)
