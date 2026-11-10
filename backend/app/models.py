import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class РольПользователя(str, enum.Enum):
    СТУДЕНТ = "студент"
    РУКОВОДИТЕЛЬ = "руководитель"
    АДМИНИСТРАЦИЯ = "администрация"


class СтатусЗаявки(str, enum.Enum):
    ПОДАНА = "подана"
    РАССМОТРЕНИЕ = "рассмотрение"
    СОБЕСЕДОВАНИЕ = "собеседование"
    РЕШЕНИЕ = "решение"


class СтатусЧленства(str, enum.Enum):
    АКТИВЕН = "активен"
    ПРИОСТАНОВЛЕН = "приостановлен"
    ИСКЛЮЧЕН = "исключён"


class СтатусЗаписи(str, enum.Enum):
    ЗАПИСАН = "записан"
    ОТМЕНЕНА = "отменена"


class Пользователь(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        Enum(РольПользователя, native_enum=False, length=32),
        nullable=False,
        default=РольПользователя.СТУДЕНТ,
    )
    faculty = Column(String(255), nullable=True)
    group = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организации_руководимые = relationship(
        "Организация", back_populates="руководитель", foreign_keys="Организация.lead_id"
    )
    членства = relationship("Членство", back_populates="пользователь", cascade="all, delete-orphan")
    заявки = relationship("Заявка", back_populates="пользователь", cascade="all, delete-orphan")
    изменения_статусов = relationship(
        "ИсторияСтатусов", back_populates="изменивший", foreign_keys="ИсторияСтатусов.changed_by", cascade="all, delete-orphan"
    )
    созданные_мероприятия = relationship(
        "Мероприятие", back_populates="создатель", foreign_keys="Мероприятие.created_by", cascade="all, delete-orphan"
    )
    записи_на_мероприятия = relationship("ЗаписьНаМероприятие", back_populates="пользователь", cascade="all, delete-orphan")
    объявления = relationship(
        "Объявление", back_populates="автор", foreign_keys="Объявление.author_id", cascade="all, delete-orphan"
    )
    загруженные_документы = relationship(
        "Документ", back_populates="загрузивший", foreign_keys="Документ.uploaded_by", cascade="all, delete-orphan"
    )
    отзывы = relationship("Отзыв", back_populates="пользователь", cascade="all, delete-orphan")
    уведомления = relationship("Уведомление", back_populates="пользователь", cascade="all, delete-orphan")


class Организация(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    direction = Column(String(100), nullable=True)
    format = Column(String(50), nullable=True)
    faculty = Column(String(255), nullable=True)
    size = Column(Integer, default=0, nullable=False)
    contacts = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    cover_url = Column(String(500), nullable=True)
    lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    руководитель = relationship(
        "Пользователь", back_populates="организации_руководимые", foreign_keys=[lead_id]
    )
    роли = relationship("РольОрганизации", back_populates="организация", cascade="all, delete-orphan")
    членства = relationship("Членство", back_populates="организация", cascade="all, delete-orphan")
    заявки = relationship("Заявка", back_populates="организация", cascade="all, delete-orphan")
    мероприятия = relationship("Мероприятие", back_populates="организация", cascade="all, delete-orphan")
    объявления = relationship("Объявление", back_populates="организация", cascade="all, delete-orphan")
    новости = relationship("Новость", back_populates="организация", cascade="all, delete-orphan")
    документы = relationship("Документ", back_populates="организация", cascade="all, delete-orphan")
    отчёты = relationship("Отчёт", back_populates="организация", cascade="all, delete-orphan")
    отзывы = relationship("Отзыв", back_populates="организация", cascade="all, delete-orphan")


class РольОрганизации(Base):
    __tablename__ = "organization_roles"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    permissions = Column(Text, nullable=True)

    организация = relationship("Организация", back_populates="роли")
    членства = relationship("Членство", back_populates="роль")


class Членство(Base):
    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("organization_roles.id"), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(
        Enum(СтатусЧленства, native_enum=False, length=32),
        nullable=False,
        default=СтатусЧленства.АКТИВЕН,
    )

    пользователь = relationship("Пользователь", back_populates="членства")
    организация = relationship("Организация", back_populates="членства")
    роль = relationship("РольОрганизации", back_populates="членства")


class Заявка(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    status = Column(
        Enum(СтатусЗаявки, native_enum=False, length=32),
        nullable=False,
        default=СтатусЗаявки.ПОДАНА,
    )
    priority = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    comment = Column(Text, nullable=True)

    пользователь = relationship("Пользователь", back_populates="заявки")
    организация = relationship("Организация", back_populates="заявки")
    ответы = relationship("ОтветАнкеты", back_populates="заявка", cascade="all, delete-orphan")
    история = relationship(
        "ИсторияСтатусов", back_populates="заявка", cascade="all, delete-orphan"
    )


class ОтветАнкеты(Base):
    __tablename__ = "application_answers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=True)

    заявка = relationship("Заявка", back_populates="ответы")


class ИсторияСтатусов(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    old_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    comment = Column(Text, nullable=True)

    заявка = relationship("Заявка", back_populates="история")
    изменивший = relationship(
        "Пользователь", back_populates="изменения_статусов", foreign_keys=[changed_by]
    )


class Мероприятие(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=True)
    place = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    организация = relationship("Организация", back_populates="мероприятия")
    создатель = relationship(
        "Пользователь", back_populates="созданные_мероприятия", foreign_keys=[created_by]
    )
    записи = relationship("ЗаписьНаМероприятие", back_populates="мероприятие", cascade="all, delete-orphan")


class ЗаписьНаМероприятие(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(
        Enum(СтатусЗаписи, native_enum=False, length=32),
        nullable=False,
        default=СтатусЗаписи.ЗАПИСАН,
    )

    мероприятие = relationship("Мероприятие", back_populates="записи")
    пользователь = relationship("Пользователь", back_populates="записи_на_мероприятия")


class Объявление(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организация = relationship("Организация", back_populates="объявления")
    автор = relationship("Пользователь", back_populates="объявления", foreign_keys=[author_id])


class Новость(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организация = relationship("Организация", back_populates="новости")


class Документ(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организация = relationship("Организация", back_populates="документы")
    загрузивший = relationship(
        "Пользователь", back_populates="загруженные_документы", foreign_keys=[uploaded_by]
    )


class Отчёт(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    period = Column(String(50), nullable=False)
    members_count = Column(Integer, default=0, nullable=False)
    events_count = Column(Integer, default=0, nullable=False)
    documents_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организация = relationship("Организация", back_populates="отчёты")


class Отзыв(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    организация = relationship("Организация", back_populates="отзывы")
    пользователь = relationship("Пользователь", back_populates="отзывы")


class Уведомление(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    пользователь = relationship("Пользователь", back_populates="уведомления")