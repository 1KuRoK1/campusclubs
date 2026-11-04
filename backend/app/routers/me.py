from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
    ЧленствоЧитать,
    УведомлениеЧитать,
)

router = APIRouter(prefix="/api/me", tags=["личный кабинет"])


@router.get("/profile", response_model=ПользовательЧитать)
def мой_профиль(текущий: Пользователь = Depends(получить_текущего_пользователя)):
    return текущий


@router.get("/applications", response_model=list[ЗаявкаЧитать])
def мои_заявки(
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    return (
        db.query(Заявка)
        .filter(Заявка.user_id == текущий.id)
        .order_by(Заявка.created_at.desc())
        .all()
    )


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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    уведомление.is_read = True
    db.commit()
    db.refresh(уведомление)
    return уведомление