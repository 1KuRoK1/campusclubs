from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import получить_текущего_пользователя
from app.database import get_db
from app.models import (
    Заявка,
    ИсторияСтатусов,
    Пользователь,
    Членство,
    Уведомление,
)
from app.schemas import (
    ЗаявкаЧитать,
    ИсторияСтатусовЧитать,
    ПользовательЧитать,
    ПользовательОбновить,
    ЧленствоЧитать,
    УведомлениеЧитать,
)

router = APIRouter(prefix="/api/me", tags=["личный кабинет"])


@router.get("/profile", response_model=ПользовательЧитать)
def мой_профиль(текущий: Пользователь = Depends(получить_текущего_пользователя)):
    return текущий


@router.patch("/profile", response_model=ПользовательЧитать)
def обновить_профиль(
    данные: ПользовательОбновить,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    if данные.full_name is not None:
        текущий.full_name = данные.full_name
    if данные.faculty is not None:
        текущий.faculty = данные.faculty
    if данные.group is not None:
        текущий.group = данные.group
    if данные.bio is not None:
        текущий.bio = данные.bio
    if данные.portfolio_url is not None:
        текущий.portfolio_url = данные.portfolio_url
        
    db.commit()
    db.refresh(текущий)
    return текущий


@router.get("/applications", response_model=list[ЗаявкаЧитать])
def мои_заявки(
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    заявки = (
        db.query(Заявка)
        .options(joinedload(Заявка.организация), joinedload(Заявка.ответы))
        .filter(Заявка.user_id == текущий.id)
        .order_by(Заявка.priority)
        .all()
    )
    for з in заявки:
        з.organization = з.организация
    return заявки


@router.get("/applications/{app_id}/history", response_model=list[ИсторияСтатусовЧитать])
def история_моей_заявки(
    app_id: int,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    заявка = db.query(Заявка).filter(Заявка.id == app_id, Заявка.user_id == текущий.id).first()
    if not заявка:
        return []
    return (
        db.query(ИсторияСтатусов)
        .filter(ИсторияСтатусов.application_id == app_id)
        .order_by(ИсторияСтатусов.changed_at)
        .all()
    )


@router.get("/memberships", response_model=list[ЧленствоЧитать])
def мои_членства(
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    return db.query(Членство).filter(Членство.user_id == текущий.id).all()


@router.get("/notifications", response_model=list[УведомлениеЧитать])
def мои_уведомления(
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    return (
        db.query(Уведомление)
        .filter(Уведомление.user_id == текущий.id)
        .order_by(Уведомление.created_at.desc())
        .all()
    )


@router.patch("/notifications/{notif_id}/read", response_model=УведомлениеЧитать)
def отметить_прочитанным(
    notif_id: int,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    уведомление = (
        db.query(Уведомление)
        .filter(Уведомление.id == notif_id, Уведомление.user_id == текущий.id)
        .first()
    )
    if not уведомление:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    уведомление.is_read = True
    db.commit()
    db.refresh(уведомление)
    return уведомление