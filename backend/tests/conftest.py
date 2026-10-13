import os
import sys
import tempfile
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
test_url = os.getenv("TEST_DATABASE_URL")
if test_url:
    from sqlalchemy.engine import make_url

    if not make_url(test_url).database.endswith("_test"):
        raise RuntimeError(
            "TEST_DATABASE_URL debe señalar una base desechable terminada en _test."
        )
    os.environ["DATABASE_URL"] = test_url
else:
    os.environ["DATABASE_URL"] = (
        "sqlite:///"
        + (Path(tempfile.mkdtemp(prefix="uto-tests-")) / "test.sqlite").as_posix()
    )
os.environ["APP_ENV"] = "test"
# Never inherit live OAuth/SMTP credentials from a developer's .env.
os.environ["GOOGLE_CLIENT_ID"] = ""
os.environ["GOOGLE_CLIENT_SECRET"] = ""
os.environ["SMTP_HOST"] = ""
os.environ["SMTP_PASSWORD"] = ""
os.environ["APP_ORIGIN"] = "http://127.0.0.1:5173"
os.environ["DATA_DIR"] = tempfile.mkdtemp(prefix="uto-files-")
from alembic.config import Config
from alembic import command
from fastapi.testclient import TestClient
from app.core.database import engine, Base, SessionLocal
from app.core.models import User
from app.core.security import hash_password, attempts
from app.main import app

PASSWORD = "Prueba-segura-2026!"
PROFILE = {
    "name": "Estudiante de Prueba",
    "matricula": "202200123",
    "curp": "LOPM040615MPLPRRA2",
    "carrera": "Ingeniería en Tecnologías de la Información",
    "generacion": "2022-2026",
    "telefono": "2221234567",
    "domicilio": "Calle de ejemplo 100, Oriental, Puebla",
}


@pytest.fixture(scope="session", autouse=True)
def schema():
    command.upgrade(Config("backend/alembic.ini"), "head")
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean(schema):
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    attempts.clear()


@pytest.fixture(scope="session")
def password_hash():
    return hash_password(PASSWORD)


@pytest.fixture
def clients(password_hash):
    users = {}
    with SessionLocal() as db:
        for role in [
            "estudiante",
            "escolares",
            "administrador",
            "tesoreria",
            "vinculacion",
            "otro",
        ]:
            user = User(
                email=f"{role}@test.local",
                name=role,
                role=role if role != "otro" else "estudiante",
                password=password_hash,
            )
            db.add(user)
            db.flush()
            users[role] = user.id
        db.commit()
    result = {}
    for role in users:
        client = TestClient(app)
        response = client.post(
            "/api/v1/auth/login",
            json={"email": f"{role}@test.local", "password": PASSWORD},
        )
        assert response.status_code == 200, response.text
        client.headers["X-CSRF-Token"] = response.json()["csrf"]
        result[role] = client
    yield result
    for c in result.values():
        c.close()


def create_case(client, upload=True):
    from app.modules.titulacion.domain import DOCUMENTS

    assert client.put("/api/v1/profile", json=PROFILE).status_code == 200
    r = client.post("/api/v1/titulacion/applications")
    assert r.status_code == 201, r.text
    a = r.json()
    if upload:
        for d in DOCUMENTS:
            if not d["required"]:
                continue
            r = client.post(
                f"/api/v1/titulacion/applications/{a['id']}/documents",
                data={"kind": d["id"]},
                files={
                    "file": (
                        "ejemplo.pdf",
                        b"%PDF-1.4\nDocumento de prueba",
                        "application/pdf",
                    )
                },
            )
            assert r.status_code == 201, r.text
            a = r.json()
    return a


def move(client, a, status, **kwargs):
    return client.post(
        f"/api/v1/titulacion/applications/{a['id']}/transition",
        json={"status": status, "version": a["version"], **kwargs},
    )


def in_review(clients):
    a = create_case(clients["estudiante"])
    r = move(clients["estudiante"], a, "enviada")
    assert r.status_code == 200, r.text
    r = move(clients["escolares"], r.json(), "revision")
    assert r.status_code == 200, r.text
    return r.json()
