from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Пользователь, РольПользователя

SECRET_KEY = "campusclubs-dev-secret-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def захешировать_пароль(password: str) -> str:
    пароль_байты = password.encode("utf-8")[:72]
    return bcrypt.hashpw(пароль_байты, bcrypt.gensalt()).decode("utf-8")


def проверить_пароль(password: str, password_hash: str) -> bool:
    пароль_байты = password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(пароль_байты, password_hash.encode("utf-8"))
    except ValueError:
        return False


def создать_токен(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def получить_текущего_пользователя(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Пользователь:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    пользователь = db.query(Пользователь).filter(Пользователь.id == int(user_id)).first()
    if пользователь is None:
        raise credentials_exception
    return пользователь


def требуется_роль(*роли: РольПользователя):
    def проверка(текущий: Пользователь = Depends(получить_текущего_пользователя)) -> Пользователь:
        if текущий.role not in роли:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return текущий

    return проверка