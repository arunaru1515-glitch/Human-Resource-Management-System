from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    document_type = Column(String(50), nullable=False)  # Resume, ID Proof, Contract, Certificate, Other
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # in bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    employee = relationship("Employee", back_populates="documents")
