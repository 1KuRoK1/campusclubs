from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    РольПользователя,
    СтатусЗаявки,
    СтатусЧленства,
    СтатусЗаписи,
)


class ПользовательСоздать(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=2)
    role: РольПользователя = РольПользователя.СТУДЕНТ
    faculty: Optional[str] = None
    group: Optional[str] = None


class ПользовательЧитать(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: РольПользователя
    faculty: Optional[str] = None
    group: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ПользовательОбновить(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2)
    faculty: Optional[str] = None
    group: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None


class СменаРолиПользователя(BaseModel):
    role: РольПользователя


class ВходВСистему(BaseModel):
    email: EmailStr
    password: str


class Токен(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ОрганизацияСоздать(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    direction: Optional[str] = None
    format: Optional[str] = None
    faculty: Optional[str] = None
    size: int = Field(default=0, ge=0)
    contacts: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    lead_id: Optional[int] = None


class ОрганизацияЧитать(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    direction: Optional[str] = None
    format: Optional[str] = None
    faculty: Optional[str] = None
    size: int
    contacts: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    lead_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ОрганизацияКратко(BaseModel):
    id: int
    name: str
    direction: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ОтветАнкетыСоздать(BaseModel):
    question: str = Field(min_length=1)
    answer: Optional[str] = None


class ОтветАнкетыЧитать(BaseModel):
    id: int
    question: str
    answer: Optional[str] = None

    class Config:
        from_attributes = True


class ЗаявкаСоздать(BaseModel):
    organization_id: int = Field(gt=0)
    comment: Optional[str] = None
    priority: int = Field(default=1, ge=1)
    ответы: list[ОтветАнкетыСоздать] = []


class ЗаявкаЧитать(BaseModel):
    id: int
    user_id: int
    organization_id: int
    status: СтатусЗаявки
    priority: int
    created_at: datetime
    updated_at: datetime
    comment: Optional[str] = None
    ответы: list[ОтветАнкетыЧитать] = []
    organization: Optional[ОрганизацияКратко] = None

    class Config:
        from_attributes = True


class СменаСтатуса(BaseModel):
    new_status: СтатусЗаявки
    comment: Optional[str] = None


class ИсторияСтатусовЧитать(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: int
    changed_at: datetime
    comment: Optional[str] = None

    class Config:
        from_attributes = True


class ЧленствоЧитать(BaseModel):
    id: int
    organization_id: int
    role_id: Optional[int] = None
    joined_at: datetime
    status: СтатусЧленства
    user: Optional[ПользовательЧитать] = None
    organization: Optional[ОрганизацияКратко] = None

    class Config:
        from_attributes = True


class УведомлениеЧитать(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class МероприятиеСоздать(BaseModel):
    organization_id: int = Field(gt=0)
    title: str = Field(min_length=3)
    description: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    place: Optional[str] = None


class МероприятиеЧитать(BaseModel):
    id: int
    organization_id: int
    title: str
    description: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    place: Optional[str] = None
    created_by: int

    class Config:
        from_attributes = True


class ОтзывСоздать(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: Optional[str] = None


class ОтзывЧитать(BaseModel):
    id: int
    organization_id: int
    user_id: int
    rating: int
    text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class РейтингОрганизации(BaseModel):
    organization_id: int
    average_rating: float
    reviews_count: int


class НовостьСоздать(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=10)
    image_url: Optional[str] = None


class НовостьЧитать(BaseModel):
    id: int
    organization_id: int
    title: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True