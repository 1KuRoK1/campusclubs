from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import получить_текущего_пользователя, требуется_роль
from app.database import get_db
from app.models import (
    Заявка,
    ИсторияСтатусов,
    ОтветАнкеты,
    Организация,
    Пользователь,
    РольПользователя,
    СтатусЗаявки,
    Уведомление,
)
from app.schemas import (
    ЗаявкаСоздать,
    ЗаявкаЧитать,
    ИсторияСтатусовЧитать,
    СменаСтатуса,
)

router = APIRouter(prefix="/api/applications", tags=["заявки"])

ДОПУСТИМЫЕ_ПЕРЕХОДЫ = {
    СтатусЗаявки.ПОДАНА: [СтатусЗаявки.РАССМОТРЕНИЕ],
    СтатусЗаявки.РАССМОТРЕНИЕ: [СтатусЗаявки.СОБЕСЕДОВАНИЕ],
    СтатусЗаявки.СОБЕСЕДОВАНИЕ: [СтатусЗаявки.РЕШЕНИЕ],
    СтатусЗаявки.РЕШЕНИЕ: [],
}


@router.post("", response_model=ЗаявкаЧитать, status_code=201)
def подать_заявку(
    данные: ЗаявкаСоздать,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    организация = db.query(Организация).filter(Организация.id == данные.organization_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    существующая = (
        db.query(Заявка)
        .filter(
            Заявка.user_id == текущий.id,
            Заявка.organization_id == данные.organization_id,
            Заявка.status != СтатусЗаявки.РЕШЕНИЕ,
        )
        .first()
    )
    if существующая:
        raise HTTPException(status_code=400, detail="У вас уже есть активная заявка в эту организацию")

    заявка = Заявка(
        user_id=текущий.id,
        organization_id=данные.organization_id,
        status=СтатусЗаявки.ПОДАНА,
        comment=данные.comment,
    )
    db.add(заявка)
    db.flush()

    for ответ in данные.ответы:
        db.add(ОтветАнкеты(
            application_id=заявка.id,
            question=ответ.question,
            answer=ответ.answer,
        ))

    db.add(ИсторияСтатусов(
        application_id=заявка.id,
        old_status=None,
        new_status=СтатусЗаявки.ПОДАНА.value,
        changed_by=текущий.id,
        comment="Заявка подана",
    ))

    if организация.lead_id:
        db.add(Уведомление(
            user_id=организация.lead_id,
            type="заявка",
            message=f"Новая заявка от {текущий.full_name} в организацию «{организация.name}»",
        ))

    db.commit()
    db.refresh(заявка)
    return заявка


@router.get("/organization/{org_id}", response_model=list[ЗаявкаЧитать])
def заявки_организации(
    org_id: int,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(
        требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ)
    ),
):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ and организация.lead_id != текущий.id:
        raise HTTPException(status_code=403, detail="Вы не руководитель этой организации")

    return (
        db.query(Заявка)
        .filter(Заявка.organization_id == org_id)
        .order_by(Заявка.created_at.desc())
        .all()
    )


@router.get("/{app_id}", response_model=ЗаявкаЧитать)
def получить_заявку(
    app_id: int,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    заявка = db.query(Заявка).filter(Заявка.id == app_id).first()
    if not заявка:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if текущий.role == РольПользователя.СТУДЕНТ and заявка.user_id != текущий.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")

    return заявка


@router.get("/{app_id}/history", response_model=list[ИсторияСтатусовЧитать])
def история_заявки(
    app_id: int,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(получить_текущего_пользователя),
):
    заявка = db.query(Заявка).filter(Заявка.id == app_id).first()
    if not заявка:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if текущий.role == РольПользователя.СТУДЕНТ and заявка.user_id != текущий.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")

    return (
        db.query(ИсторияСтатусов)
        .filter(ИсторияСтатусов.application_id == app_id)
        .order_by(ИсторияСтатусов.changed_at)
        .all()
    )


@router.patch("/{app_id}/status", response_model=ЗаявкаЧитать)
def сменить_статус(
    app_id: int,
    данные: СменаСтатуса,
    db: Session = Depends(get_db),
    текущий: Пользователь = Depends(
        требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ)
    ),
):
    заявка = db.query(Заявка).filter(Заявка.id == app_id).first()
    if not заявка:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ:
        организация = db.query(Организация).filter(Организация.id == заявка.organization_id).first()
        if not организация or организация.lead_id != текущий.id:
            raise HTTPException(status_code=403, detail="Вы не руководитель этой организации")

    старый = заявка.status
    if данные.new_status not in ДОПУСТИМЫЕ_ПЕРЕХОДЫ.get(старый, []):
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый переход из «{старый.value}» в «{данные.new_status.value}»",
        )

    заявка.status = данные.new_status

    db.add(ИсторияСтатусов(
        application_id=заявка.id,
        old_status=старый.value,
        new_status=данные.new_status.value,
        changed_by=текущий.id,
        comment=данные.comment,
    ))

    db.add(Уведомление(
        user_id=заявка.user_id,
        type="заявка",
        message=f"Статус вашей заявки изменён: «{данные.new_status.value}»",
    ))

    db.commit()
    db.refresh(заявка)
    return заявка