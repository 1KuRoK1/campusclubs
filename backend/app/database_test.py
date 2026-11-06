from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Для тестов используем SQLite в памяти (быстро и чисто)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_campusclubs.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()