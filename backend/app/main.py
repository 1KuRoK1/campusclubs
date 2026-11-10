import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models
from app.database import Base, engine
from app.routers import (
    applications, auth, events, me, organizations, organizations_extra, admin, news
)

models.Base.metadata.create_all(bind=engine)

# Создаем папку для загрузок, если ее нет
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app = FastAPI(title="CampusClubs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздаем статические файлы (картинки)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(applications.router)
app.include_router(me.router)
app.include_router(events.router)
app.include_router(organizations_extra.router)
app.include_router(admin.router)
app.include_router(news.router)

@app.get("/api/health", tags=["служебные"])
def health_check():
    return {"status": "ok"}