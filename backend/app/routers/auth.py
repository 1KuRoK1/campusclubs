from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import (
    проверить_пароль,
    создать_токен,
    захешировать_пароль,
    получить_текущего_пользователя,
)
from app.database import get_db
from app.models import Пользователь
from app.schemas import ПользовательСоздать, ПользовательЧитать, Токен

router = APIRouter(prefix="/api/auth", tags=["аутентификация"])


@router.post("/register", response_model=ПользовательЧитать, status_code=status.HTTP_201_CREATED)
def зарегистрироваться(данные: ПользовательСоздать, db: Session = Depends(get_db)):
    существующий = db.query(Пользователь).filter(Пользователь.email == данные.email).first()
    if существующий:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    пользователь = Пользователь(
        email=данные.email,
        password_hash=захешировать_пароль(данные.password),
        full_name=данные.full_name,
        role=данные.role,
        faculty=данные.faculty,
        group=данные.group,
    )
    db.add(пользователь)
    db.commit()
    db.refresh(пользователь)
    return пользователь


@router.post("/login", response_model=Токен)
def войти(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    пользователь = db.query(Пользователь).filter(Пользователь.email == form_data.username).first()
    if not пользователь or not проверить_пароль(form_data.password, пользователь.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    токен = создать_токен({"sub": str(пользователь.id), "role": пользователь.role.value})
    return {"access_token": токен, "token_type": "bearer"}


@router.get("/me", response_model=ПользовательЧитать)
def мой_профиль(текущий: Пользователь = Depends(получить_текущего_пользователя)):
    return текущий