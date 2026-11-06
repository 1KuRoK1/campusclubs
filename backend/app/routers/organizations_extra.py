from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.auth import получить_текущего_пользователя, требуется_роль
from app.database import get_db
from app.models import (
    Документ,
    Мероприятие,
    Организация,
    Отчёт,
    Отзыв,
    Пользователь,
    РольПользователя,
    Членство,
    РольОрганизации,
)
from app.schemas import ОтзывСоздать, ОтзывЧитать, РейтингОрганизации, ЧленствоЧитать

router = APIRouter(prefix="/api/organizations", tags=["отзывы и управление"])

class СменаРоли(BaseModel):
    role_id: int

@router.get("/{org_id}/reviews", response_model=list[ОтзывЧитать])
def отзывы_организации(org_id: int, db: Session = Depends(get_db)):
    return db.query(Отзыв).filter(Отзыв.organization_id == org_id).order_by(Отзыв.created_at.desc()).all()

@router.get("/{org_id}/rating", response_model=РейтингОрганизации)
def рейтинг_организации(org_id: int, db: Session = Depends(get_db)):
    результат = db.query(func.avg(Отзыв.rating), func.count(Отзыв.id)).filter(Отзыв.organization_id == org_id).first()
    средний = round(float(результат[0]), 2) if результат[0] is not None else 0.0
    return {"organization_id": org_id, "average_rating": средний, "reviews_count": результат[1] or 0}

@router.post("/{org_id}/reviews", response_model=ОтзывЧитать, status_code=201)
def оставить_отзыв(org_id: int, данные: ОтзывСоздать, db: Session = Depends(get_db), текущий: Пользователь = Depends(получить_текущего_пользователя)):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    существующий = db.query(Отзыв).filter(Отзыв.organization_id == org_id, Отзыв.user_id == текущий.id).first()
    if существующий:
        raise HTTPException(status_code=400, detail="Вы уже оставили отзыв этой организации")

    отзыв = Отзыв(organization_id=org_id, user_id=текущий.id, rating=данные.rating, text=данные.text)
    db.add(отзыв)
    db.commit()
    db.refresh(отзыв)
    return отзыв

@router.get("/{org_id}/members", response_model=list[ЧленствоЧитать])
def состав_организации(org_id: int, db: Session = Depends(get_db)):
    return db.query(Членство).options(joinedload(Членство.пользователь)).filter(Членство.organization_id == org_id).all()

@router.get("/{org_id}/roles")
def роли_организации(org_id: int, db: Session = Depends(get_db)):
    роли = db.query(РольОрганизации).filter(РольОрганизации.organization_id == org_id).all()
    return [{"id": р.id, "name": р.name} for р in роли]

@router.patch("/{org_id}/members/{member_id}/role")
def сменить_роль_участника(org_id: int, member_id: int, данные: СменаРоли, db: Session = Depends(get_db), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    членство = db.query(Членство).filter(Членство.id == member_id, Членство.organization_id == org_id).first()
    if not членство:
        raise HTTPException(status_code=404, detail="Участник не найден")
    
    # Проверка, что текущий - руководитель этой организации
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ and организация.lead_id != текущий.id:
        raise HTTPException(status_code=403, detail="Нет прав")

    членство.role_id = данные.role_id
    db.commit()
    return {"status": "ok"}

@router.get("/{org_id}/report")
def отчёт_организации(org_id: int, db: Session = Depends(get_db), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    членов = db.query(func.count(Членство.id)).filter(Членство.organization_id == org_id).scalar() or 0
    мероприятий = db.query(func.count(Мероприятие.id)).filter(Мероприятие.organization_id == org_id).scalar() or 0
    документов = db.query(func.count(Документ.id)).filter(Документ.organization_id == org_id).scalar() or 0

    отчёт = Отчёт(organization_id=org_id, period="текущий", members_count=членов, events_count=мероприятий, documents_count=документов)
    db.add(отчёт)
    db.commit()
    db.refresh(отчёт)

    return {"id": отчёт.id, "organization_id": org_id, "members_count": членов, "events_count": мероприятий, "documents_count": документов, "created_at": отчёт.created_at}