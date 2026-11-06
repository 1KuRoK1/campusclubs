import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.models import РольПользователя, СтатусЗаявки

# Используем тестовую базу
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_campusclubs.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    # Создаем таблицы перед каждым тестом
    Base.metadata.create_all(bind=engine)
    yield
    # Удаляем после
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    """Проверка, что сервер жив"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_and_login():
    """Проверка регистрации и получения токена"""
    # 1. Регистрация
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Тестовый Студент",
        "role": "студент"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

    # 2. Вход
    response = client.post("/api/auth/login", data={
        "username": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_protected_endpoint():
    """Проверка, что без токена доступа нет"""
    response = client.get("/api/me/profile")
    assert response.status_code == 401


def test_full_scenario():
    """Полный сценарий: Руководитель создает организацию -> Студент подает заявку -> Руководитель одобряет"""
    # 1. Регистрация Руководителя
    client.post("/api/auth/register", json={
        "email": "lead@example.com",
        "password": "leadpassword",
        "full_name": "Руководитель Клуба",
        "role": "руководитель"
    })
    resp_login = client.post("/api/auth/login", data={"username": "lead@example.com", "password": "leadpassword"})
    lead_token = resp_login.json()["access_token"]
    
    # 2. Руководитель создает организацию
    resp_org = client.post("/api/organizations", headers={"Authorization": f"Bearer {lead_token}"}, json={
        "name": "Тестовый клуб",
        "description": "Клуб для проверки автотестами",
        "direction": "Наука и техника",
        "format": "Очный",
        "faculty": "ИРИТ-РТФ",
        "size": 1
    })
    assert resp_org.status_code == 201
    org_id = resp_org.json()["id"]

    # 3. Регистрация Студента
    client.post("/api/auth/register", json={
        "email": "student@example.com",
        "password": "studentpassword",
        "full_name": "Студент Заявитель",
        "role": "студент"
    })
    resp_stud_login = client.post("/api/auth/login", data={"username": "student@example.com", "password": "studentpassword"})
    student_token = resp_stud_login.json()["access_token"]

    # 4. Студент подает заявку
    resp_app = client.post("/api/applications", headers={"Authorization": f"Bearer {student_token}"}, json={
        "organization_id": org_id,
        "comment": "Хочу в клуб",
        "ответы": [{"question": "Опыт?", "answer": "Есть"}]
    })
    assert resp_app.status_code == 201
    app_id = resp_app.json()["id"]
    assert resp_app.json()["status"] == "подана"

    # 5. Руководитель переводит в "рассмотрение"
    resp_status1 = client.patch(f"/api/applications/{app_id}/status", headers={"Authorization": f"Bearer {lead_token}"}, json={"new_status": "рассмотрение"})
    assert resp_status1.status_code == 200

    # 6. Руководитель переводит в "собеседование"
    client.patch(f"/api/applications/{app_id}/status", headers={"Authorization": f"Bearer {lead_token}"}, json={"new_status": "собеседование"})

    # 7. Руководитель одобряет заявку ("решение")
    resp_status_final = client.patch(f"/api/applications/{app_id}/status", headers={"Authorization": f"Bearer {lead_token}"}, json={"new_status": "решение"})
    assert resp_status_final.status_code == 200
    
    # 8. Проверка: Студент теперь должен быть в списке участников организации
    resp_members = client.get(f"/api/organizations/{org_id}/members")
    assert resp_members.status_code == 200
    members = resp_members.json()
    
    # Ищем нашего студента в списке участников
    student_joined = any(m["user"]["email"] == "student@example.com" for m in members if m.get("user"))
    assert student_joined, "Студент не был добавлен в состав организации!"