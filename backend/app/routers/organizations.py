from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import требуется_роль
from app.database import get_db
from app.models import (
    Организация,
    Пользователь,
    РольОрганизации,
    РольПользователя,
)
from app.schemas import ОрганизацияСоздать, ОрганизацияЧитать

router = APIRouter(prefix="/api/organizations", tags=["организации"])


@router.get("", response_model=list[ОрганизацияЧитать])
def список_организаций(
    q: Optional[str] = Query(None, description="поиск по названию и описанию"),
    direction: Optional[str] = Query(None, description="направление деятельности"),
    format: Optional[str] = Query(None, description="формат работы"),
    faculty: Optional[str] = Query(None, description="факультет"),
    size_min: Optional[int] = Query(None, ge=0, description="минимальный размер"),
    size_max: Optional[int] = Query(None, ge=0, description="максимальный размер"),
    db: Session = Depends(get_db),
):
    запрос = db.query(Организация)

    if q:
        шаблон = f"%{q}%"
        запрос = запрос.filter(
            (Организация.name.ilike(шаблон)) | (Организация.description.ilike(шаблон))
        )
    if direction:
        запрос = запрос.filter(Организация.direction == direction)
    if format:
        запрос = запрос.filter(Организация.format == format)
    if faculty:
        запрос = запрос.filter(Организация.faculty == faculty)
    if size_min is not None:
        запрос = запрос.filter(Организация.size >= size_min)
    if size_max is not None:
        запрос = запрос.filter(Организация.size <= size_max)

    return запрос.order_by(Организация.name).all()


@router.get("/filters", tags=["организации"])
def доступные_фильтры(db: Session = Depends(get_db)):
    направления = [r[0] for r in db.query(Организация.direction).distinct().all() if r[0]]
    форматы = [r[0] for r in db.query(Организация.format).distinct().all() if r[0]]
    факультеты = [r[0] for r in db.query(Организация.faculty).distinct().all() if r[0]]
    return {
        "направления": sorted(направления),
        "форматы": sorted(форматы),
        "факультеты": sorted(факультеты),
    }


@router.get("/{org_id}", response_model=ОрганизацияЧитать)
def страница_организации(org_id: int, db: Session = Depends(get_db)):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")
    return организация


@router.get("/{org_id}/roles")
def роли_организации(org_id: int, db: Session = Depends(get_db)):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")
    роли = db.query(РольОрганизации).filter(РольОрганизации.organization_id == org_id).all()
    return [
        {"id": р.id, "name": р.name, "permissions": р.permissions}
        for р in роли
    ]


@router.post("", response_model=ОрганизацияЧитать, status_code=201)
def создать_организацию(
    данные: ОрганизацияСоздать,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ)),
):
    организация = Организация(**данные.model_dump())
    
    # Если создает руководитель, он автоматически становится лидером этой организации
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ:
        организация.lead_id = текущий.id
        
    db.add(организация)
    db.commit()
    db.refresh(организация)
    return организация