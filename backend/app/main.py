from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import applications, auth, events, me, organizations, organizations_extra

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

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(applications.router)
app.include_router(me.router)
app.include_router(events.router)
app.include_router(organizations_extra.router)


@app.get("/api/health", tags=["служебные"])
def health_check():
    return {"status": "ok"}