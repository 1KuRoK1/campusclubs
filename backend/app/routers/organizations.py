import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.auth import требуется_роль
from app.database import get_db
from app.models import Организация, Пользователь, РольОрганизации, РольПользователя
from app.schemas import ОрганизацияСоздать, ОрганизацияЧитать

router = APIRouter(prefix="/api/organizations", tags=["организации"])

# ... (оставляем функции список_организаций, доступные_фильтры, страница_организации, роли_организации) ...
@router.get("", response_model=list[ОрганизацияЧитать])
def список_организаций(
    q: Optional[str] = Query(None), direction: Optional[str] = Query(None),
    format: Optional[str] = Query(None), faculty: Optional[str] = Query(None),
    size_min: Optional[int] = Query(None), size_max: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    запрос = db.query(Организация)
    if q:
        шаблон = f"%{q}%"
        запрос = запрос.filter((Организация.name.ilike(шаблон)) | (Организация.description.ilike(шаблон)))
    if direction: запрос = запрос.filter(Организация.direction == direction)
    if format: запрос = запрос.filter(Организация.format == format)
    if faculty: запрос = запрос.filter(Организация.faculty == faculty)
    if size_min is not None: запрос = запрос.filter(Организация.size >= size_min)
    if size_max is not None: запрос = запрос.filter(Организация.size <= size_max)
    return запрос.order_by(Организация.name).all()

@router.get("/filters")
def доступные_фильтры(db: Session = Depends(get_db)):
    return {
        "направления": sorted([r[0] for r in db.query(Организация.direction).distinct().all() if r[0]]),
        "форматы": sorted([r[0] for r in db.query(Организация.format).distinct().all() if r[0]]),
        "факультеты": sorted([r[0] for r in db.query(Организация.faculty).distinct().all() if r[0]]),
    }

@router.get("/{org_id}", response_model=ОрганизацияЧитать)
def страница_организации(org_id: int, db: Session = Depends(get_db)):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация: raise HTTPException(status_code=404, detail="Организация не найдена")
    return организация

@router.get("/{org_id}/roles")
def роли_организации(org_id: int, db: Session = Depends(get_db)):
    return [{"id": р.id, "name": р.name} for р in db.query(РольОрганизации).filter(РольОрганизации.organization_id == org_id).all()]

# НОВЫЕ ЭНДПОИНТЫ
@router.post("/upload-image")
def загрузить_картинку(file: UploadFile = File(...), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    расширение = file.filename.split(".")[-1]
    имя_файла = f"{uuid.uuid4()}.{расширение}"
    путь = f"uploads/{имя_файла}"
    
    with open(путь, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/uploads/{имя_файла}"}

@router.patch("/{org_id}", response_model=ОрганизацияЧитать)
def редактировать_организацию(
    org_id: int, данные: ОрганизацияСоздать, db: Session = Depends(get_db),
    текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))
):
    org = db.query(Организация).filter(Организация.id == org_id).first()
    if not org: raise HTTPException(status_code=404, detail="Не найдена")
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ and org.lead_id != текущий.id:
        raise HTTPException(status_code=403, detail="Нет прав")

    org.name = данные.name
    org.description = данные.description
    org.avatar_url = данные.avatar_url
    org.cover_url = данные.cover_url
    org.contacts = данные.contacts
    db.commit()
    db.refresh(org)
    return org

@router.post("", response_model=ОрганизацияЧитать, status_code=201)
def создать_организацию(
    данные: ОрганизацияСоздать, db: Session = Depends(get_db),
    текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ)),
):
    организация = Организация(**данные.model_dump())
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ:
        организация.lead_id = текущий.id
    db.add(организация)
    db.commit()
    db.refresh(организация)
    return организация