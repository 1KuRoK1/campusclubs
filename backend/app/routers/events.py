from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.auth import получить_текущего_пользователя, требуется_роль
from app.database import get_db
from app.models import ЗаписьНаМероприятие, Мероприятие, Организация, Пользователь, РольПользователя
from app.schemas import МероприятиеСоздать, МероприятиеЧитать

router = APIRouter(prefix="/api/events", tags=["мероприятия"])

@router.get("", response_model=list[МероприятиеЧитать])
def список_мероприятий(q: Optional[str] = Query(None), organization_id: Optional[int] = Query(None), place: Optional[str] = Query(None), db: Session = Depends(get_db)):
    запрос = db.query(Мероприятие)
    if q: запрос = запрос.filter((Мероприятие.title.ilike(f"%{q}%")) | (Мероприятие.description.ilike(f"%{q}%")))
    if organization_id: запрос = запрос.filter(Мероприятие.organization_id == organization_id)
    if place: запрос = запрос.filter(Мероприятие.place.ilike(f"%{place}%"))
    return запрос.order_by(Мероприятие.starts_at).all()

@router.get("/{event_id}", response_model=МероприятиеЧитать)
def получить_мероприятие(event_id: int, db: Session = Depends(get_db)):
    событие = db.query(Мероприятие).filter(Мероприятие.id == event_id).first()
    if not событие: raise HTTPException(status_code=404, detail="Не найдено")
    return событие

@router.post("", response_model=МероприятиеЧитать, status_code=201)
def создать_мероприятие(данные: МероприятиеСоздать, db: Session = Depends(get_db), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    организация = db.query(Организация).filter(Организация.id == данные.organization_id).first()
    if not организация: raise HTTPException(status_code=404, detail="Организация не найдена")
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ and организация.lead_id != текущий.id:
        raise HTTPException(status_code=403, detail="Вы не руководитель")
    событие = Мероприятие(**данные.model_dump(), created_by=текущий.id)
    db.add(событие)
    db.commit()
    db.refresh(событие)
    return событие

@router.post("/{event_id}/register", status_code=201)
def записаться_на_мероприятие(event_id: int, db: Session = Depends(get_db), текущий: Пользователь = Depends(получить_текущего_пользователя)):
    событие = db.query(Мероприятие).filter(Мероприятие.id == event_id).first()
    if not событие: raise HTTPException(status_code=404, detail="Не найдено")
    уже = db.query(ЗаписьНаМероприятие).filter(ЗаписьНаМероприятие.event_id == event_id, ЗаписьНаМероприятие.user_id == текущий.id).first()
    if уже: raise HTTPException(status_code=400, detail="Вы уже записаны")
    db.add(ЗаписьНаМероприятие(event_id=event_id, user_id=текущий.id))
    db.commit()
    return {"status": "записан", "event_id": event_id}