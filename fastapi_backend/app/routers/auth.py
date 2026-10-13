from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.models.user import User, Employee
from app.schemas.token import Token, LoginRequest
from app.schemas.user import ChangePasswordRequest, UserResponse
from app.routers.deps import get_current_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact HR or Administrator."
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    full_name = employee.full_name if employee else user.role.value
    employee_id = employee.id if employee else None

    # Audit login
    log_action(
        db=db,
        action="USER_LOGIN",
        entity="User",
        entity_id=str(user.id),
        details=f"Successful login for {user.email} (Role: {user.role.value})",
        user=user,
        ip_address=request.client.host if request.client else "127.0.0.1"
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        employee_id=employee_id,
        email=user.email,
        full_name=full_name
    )

@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 password form login compatible with Swagger UI."""
    login_req = LoginRequest(email=form_data.username, password=form_data.password)
    return login(login_req, request, db)

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's profile details."""
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "employee": {
            "id": employee.id,
            "employee_code": employee.employee_code,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "full_name": employee.full_name,
            "phone": employee.phone,
            "department": employee.department,
            "designation": employee.designation,
            "joining_date": str(employee.joining_date),
            "basic_salary": employee.basic_salary,
            "hra": employee.hra,
            "allowances": employee.allowances,
            "gross_salary": employee.gross_salary,
        } if employee else None
    }

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password after verifying old password."""
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    
    log_action(
        db=db,
        action="PASSWORD_CHANGED",
        entity="User",
        entity_id=str(current_user.id),
        details="User password updated successfully",
        user=current_user
    )
    
    return {"message": "Password updated successfully"}
