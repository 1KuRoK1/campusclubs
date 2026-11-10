from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import shutil

from app.auth import получить_текущего_пользователя, требуется_роль
from app.database import get_db
from app.models import Новость, Организация, Пользователь, РольПользователя, Членство, Уведомление
from app.schemas import НовостьСоздать, НовостьЧитать

router = APIRouter(prefix="/api/organizations/{org_id}/news", tags=["новости"])

@router.get("", response_model=List[НовостьЧитать])
def новости_организации(org_id: int, db: Session = Depends(get_db)):
    return db.query(Новость).filter(Новость.organization_id == org_id).order_by(Новость.created_at.desc()).all()

@router.post("/upload")
def загрузить_фото_новости(org_id: int, file: UploadFile = File(...), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    расширение = file.filename.split(".")[-1]
    имя_файла = f"news_{uuid.uuid4()}.{расширение}"
    путь = f"uploads/{имя_файла}"
    
    with open(путь, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/uploads/{имя_файла}"}

@router.post("", response_model=НовостьЧитать, status_code=201)
def создать_новость(
    org_id: int, данные: НовостьСоздать, db: Session = Depends(get_db), 
    текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))
):
    организация = db.query(Организация).filter(Организация.id == org_id).first()
    if not организация: raise HTTPException(status_code=404, detail="Организация не найдена")
    if текущий.role == РольПользователя.РУКОВОДИТЕЛЬ and организация.lead_id != текущий.id:
        raise HTTPException(status_code=403, detail="Вы не руководитель")

    новость = Новость(organization_id=org_id, title=данные.title, content=данные.content, image_url=данные.image_url)
    db.add(новость)
    db.flush()

    участники = db.query(Членство).filter(Членство.organization_id == org_id).all()
    for участник in участники:
        db.add(Уведомление(user_id=участник.user_id, type="новость", message=f"Новость в «{организация.name}»: {данные.title}"))

    db.commit()
    db.refresh(новость)
    return новость

@router.delete("/{news_id}", status_code=204)
def удалить_новость(org_id: int, news_id: int, db: Session = Depends(get_db), текущий: Пользователь = Depends(требуется_роль(РольПользователя.РУКОВОДИТЕЛЬ, РольПользователя.АДМИНИСТРАЦИЯ))):
    новость = db.query(Новость).filter(Новость.id == news_id, Новость.organization_id == org_id).first()
    if not новость: raise HTTPException(status_code=404, detail="Не найдена")
    db.delete(новость)
    db.commit()
    return None