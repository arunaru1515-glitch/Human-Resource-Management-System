from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.holiday import Holiday
from app.schemas.holiday import HolidayCreate, HolidayUpdate, HolidayResponse
from app.routers.deps import get_current_user, require_hr_or_admin
from app.services.audit_service import log_action
from app.models.notification import NotificationType
from app.services.notification_service import send_notification
from app.models.user import Employee, UserRole

router = APIRouter(prefix="/holidays", tags=["Holiday & Calendar Management"])


@router.post("", response_model=HolidayResponse)
def create_holiday(
    data: HolidayCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Create a new holiday entry."""
    existing = db.query(Holiday).filter(Holiday.date == data.date, Holiday.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday with the same name already exists on this date")

    holiday = Holiday(**data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)

    # Broadcast holiday announcement to all employees
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    for emp in employees:
        send_notification(
            db=db,
            user=emp.user,
            notification_type=NotificationType.HOLIDAY_ANNOUNCEMENT,
            context={
                "name": emp.full_name,
                "holiday_name": holiday.name,
                "holiday_date": str(holiday.date),
                "holiday_type": holiday.holiday_type.value
            },
            custom_title=f"Holiday Announced: {holiday.name}",
            custom_message=f"A {holiday.holiday_type.value.lower()} holiday has been announced: {holiday.name} on {holiday.date}. {holiday.description or ''}"
        )

    log_action(db=db, action="HOLIDAY_CREATED", entity="Holiday", entity_id=str(holiday.id),
               details=f"Holiday '{holiday.name}' on {holiday.date} created", user=current_user)

    return holiday


@router.get("", response_model=List[HolidayResponse])
def list_holidays(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    holiday_type: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List holidays with optional year/month/type filters. Accessible by all users."""
    query = db.query(Holiday)
    if active_only:
        query = query.filter(Holiday.is_active == True)
    if year:
        query = query.filter(Holiday.date >= date(year, 1, 1), Holiday.date <= date(year, 12, 31))
    if month and year:
        query = query.filter(
            Holiday.date >= date(year, month, 1),
            Holiday.date <= date(year, month, 28 if month == 2 else 30 if month in [4, 6, 9, 11] else 31)
        )
    if holiday_type:
        query = query.filter(Holiday.holiday_type == holiday_type.upper())

    return query.order_by(Holiday.date.asc()).all()


@router.get("/calendar", response_model=List[HolidayResponse])
def get_calendar_view(
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yearly calendar view of all active holidays for employee dashboard."""
    holidays = db.query(Holiday).filter(
        Holiday.is_active == True,
        Holiday.date >= date(year, 1, 1),
        Holiday.date <= date(year, 12, 31)
    ).order_by(Holiday.date.asc()).all()
    return holidays


@router.get("/{holiday_id}", response_model=HolidayResponse)
def get_holiday(
    holiday_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific holiday by ID."""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday


@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: int,
    data: HolidayUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Update a holiday entry."""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(holiday, key, value)

    db.commit()
    db.refresh(holiday)

    log_action(db=db, action="HOLIDAY_UPDATED", entity="Holiday", entity_id=str(holiday.id),
               details=f"Holiday '{holiday.name}' updated", user=current_user)
    return holiday


@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/HR: Soft-delete a holiday (mark inactive)."""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    holiday.is_active = False
    db.commit()

    log_action(db=db, action="HOLIDAY_DELETED", entity="Holiday", entity_id=str(holiday.id),
               details=f"Holiday '{holiday.name}' deactivated", user=current_user)
    return {"message": f"Holiday '{holiday.name}' has been deactivated"}
