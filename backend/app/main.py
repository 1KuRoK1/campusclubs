from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusClubs API",
    description="Портал управления студенческими организациями",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["служебные"])
def health_check():
    return {"status": "ok"}