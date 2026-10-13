from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from app.main import app as api_app
from app.core.database import engine
from conftest import create_case, move, in_review, PROFILE

BASE = "/api/v1/titulacion"


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
