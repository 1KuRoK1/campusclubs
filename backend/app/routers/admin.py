from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.auth import требуется_роль
from app.database import get_db
from app.models import Пользователь, Организация, РольПользователя
from app.schemas import ПользовательЧитать, ОрганизацияЧитать, СменаРолиПользователя

router = APIRouter(prefix="/api/admin", tags=["администрирование"])

def админ_доступ(текущий: Пользователь = Depends(требуется_роль(РольПользователя.АДМИНИСТРАЦИЯ))):
    return текущий

@router.get("/users", response_model=List[ПользовательЧитать])
def все_пользователи(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db), 
    _ = Depends(админ_доступ)
):
    запрос = db.query(Пользователь)
    if q:
        запрос = запрос.filter((Пользователь.full_name.ilike(f"%{q}%")) | (Пользователь.email.ilike(f"%{q}%")))
    if role:
        запрос = запрос.filter(Пользователь.role == role)
    return запрос.order_by(Пользователь.full_name).all()

@router.patch("/users/{user_id}/role", response_model=ПользовательЧитать)
def сменить_роль(user_id: int, данные: СменаРолиПользователя, db: Session = Depends(get_db), _ = Depends(админ_доступ)):
    пользователь = db.query(Пользователь).filter(Пользователь.id == user_id).first()
    if not пользователь:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if данные.role == РольПользователя.АДМИНИСТРАЦИЯ:
        raise HTTPException(status_code=400, detail="Нельзя просто так назначить администратора")
        
    пользователь.role = данные.role
    db.commit()
    db.refresh(пользователь)
    return пользователь

@router.delete("/users/{user_id}", status_code=204)
def удалить_пользователя(user_id: int, db: Session = Depends(get_db), текущий: Пользователь = Depends(админ_доступ)):
    пользователь = db.query(Пользователь).filter(Пользователь.id == user_id).first()
    if not пользователь:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if пользователь.id == текущий.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
        
    db.delete(пользователь)
    db.commit()
    return None

@router.get("/organizations", response_model=List[ОрганизацияЧитать])
def все_организации(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db), 
    _ = Depends(админ_доступ)
):
    запрос = db.query(Организация)
    if q:
        запрос = запрос.filter(Организация.name.ilike(f"%{q}%"))
    return запрос.order_by(Организация.name).all()

@router.delete("/organizations/{org_id}", status_code=204)
def удалить_организацию(org_id: int, db: Session = Depends(get_db), _ = Depends(админ_доступ)):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация:
        raise HTTPException(status_code=404, detail="Организация не найдена")
        
    db.delete(организация)
    db.commit()
    return None