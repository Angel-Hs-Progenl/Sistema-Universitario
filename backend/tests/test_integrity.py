from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from app.main import app as api_app
from app.core.database import engine
from conftest import create_case, move, in_review, PROFILE
import json
from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.models import User
from app.modules.titulacion.models import Application

BASE = "/api/v1/titulacion"


def test_case_does_not_expose_account_metadata_or_snapshot_it(clients):
    with SessionLocal() as db:
        owner = db.scalar(select(User).where(User.email == "estudiante@test.local"))
        owner.login_phone = "+12025550100"
        owner.google_sub = "synthetic-google-sub"
        owner.display_name = "Alias de prueba"
        db.commit()

    case = in_review(clients)
    expected = {"id", "name", "email", "profile"}
    assert set(case["student"]) == expected
    with SessionLocal() as db:
        record = db.get(Application, case["id"])
        snapshot = json.loads(record.profile_snapshot)
        assert set(snapshot) == expected
        # Una instantánea heredada conserva su archivo original, pero no lo expone.
        record.profile_snapshot = json.dumps(
            {
                **snapshot,
                "login_phone": "+12025550100",
                "google_linked": True,
                "display_name": "Alias antiguo",
            }
        )
        db.commit()

    for role in (
        "estudiante", "escolares", "administrador", "tesoreria", "vinculacion"
    ):
        detail = clients[role].get(f"{BASE}/applications/{case['id']}")
        assert detail.status_code == 200
        assert set(detail.json()["student"]) == expected
        listed = clients[role].get(f"{BASE}/applications").json()
        assert all(set(item["student"]) == expected for item in listed)

    account = clients["estudiante"].get("/api/v1/auth/me").json()["user"]
    assert account["login_phone"] == "+12025550100"
    assert account["google_linked"] is True


def test_profile_rejects_whitespace_and_impossible_generation(clients):
    c = clients["estudiante"]
    assert c.put("/api/v1/profile", json={**PROFILE, "name": "   "}).status_code == 422
    assert (
        c.put(
            "/api/v1/profile", json={**PROFILE, "generacion": "2026-2022"}
        ).status_code
        == 422
    )


def test_concurrent_creation_is_unique(clients):
    if engine.dialect.name != "postgresql":
        import pytest

        pytest.skip("Bloqueo de fila verificado únicamente en PostgreSQL.")
    c = clients["estudiante"]
    assert c.put("/api/v1/profile", json=PROFILE).status_code == 200

    def create(_):
        with TestClient(api_app) as other:
            other.cookies.update(c.cookies)
            other.headers.update(c.headers)
            return other.post(f"{BASE}/applications").status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(create, range(2)))
    assert sorted(results) == [201, 409]
    assert len(c.get(f"{BASE}/applications").json()) == 1


def test_validated_file_cannot_be_replaced_during_correction(clients):
    a = in_review(clients)
    d = next(d for d in a["documents"] if d["kind"] == "acta")
    r = clients["escolares"].post(
        f"{BASE}/documents/{d['id']}/review", json={"status": "validado"}
    )
    assert r.status_code == 200
    r = move(
        clients["escolares"], r.json(), "incompleta", note="Corregir otro documento."
    )
    assert r.status_code == 200
    assert (
        clients["estudiante"]
        .post(
            f"{BASE}/applications/{a['id']}/documents",
            data={"kind": "acta"},
            files={"file": ("otro.pdf", b"%PDF-1.4")},
        )
        .status_code
        == 409
    )


def test_logout_revokes_session(clients):
    c = clients["estudiante"]
    assert c.post("/api/v1/auth/logout").status_code == 200
    assert c.get("/api/v1/auth/me").status_code == 401


def test_clearance_rejects_blank_note(clients):
    a = in_review(clients)
    assert (
        clients["vinculacion"]
        .post(
            f"{BASE}/applications/{a['id']}/clearance",
            json={"approved": True, "note": "     "},
        )
        .status_code
        == 422
    )
