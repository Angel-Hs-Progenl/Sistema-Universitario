from sqlalchemy import select
from app.core.database import SessionLocal, DATA_DIR
from app.core.models import User, Reset
from app.core.security import digest
from app.modules.titulacion.models import Application
from conftest import create_case, move, in_review, PROFILE

BASE = "/api/v1/titulacion"


def test_student_cannot_read_other_case_or_document(clients):
    a = create_case(clients["estudiante"])
    assert clients["otro"].get(f"{BASE}/applications/{a['id']}").status_code == 404
    doc = a["documents"][0]
    assert (
        clients["otro"].get(f"{BASE}/documents/{doc['id']}/download").status_code == 404
    )
    assert clients["escolares"].get(f"{BASE}/applications/{a['id']}").status_code == 404


def test_submission_requires_profile_and_documents(clients):
    c = clients["estudiante"]
    a = create_case(c, False)
    assert move(c, a, "enviada").status_code == 422
    assert move(c, a, "disponible").status_code == 409


def test_duplicate_active_case_and_folio(clients):
    c = clients["estudiante"]
    a = create_case(c, False)
    assert a["folio"].startswith("TIT-")
    assert c.post(f"{BASE}/applications").status_code == 409
    other = create_case(clients["otro"], False)
    assert a["folio"] != other["folio"]


def test_fake_pdf_oversize_and_extension_rejected(clients):
    c = clients["estudiante"]
    a = create_case(c, False)
    url = f"{BASE}/applications/{a['id']}/documents"
    for filename, content in [
        ("archivo.pdf", b"<script>bad</script>"),
        ("archivo.exe", b"%PDF-1.4"),
        ("archivo.jpg", b"%PDF-1.4"),
        ("archivo.pdf", b"%PDF-" + b"x" * (5 * 1024 * 1024)),
    ]:
        response = c.post(
            url, data={"kind": "acta"}, files={"file": (filename, content)}
        )
        assert response.status_code == 422, response.text
    assert c.get(f"{BASE}/applications/{a['id']}").json()["documents"] == []


def test_area_permissions_and_minimum_data(clients):
    a = in_review(clients)
    payment = next(d for d in a["documents"] if d["kind"] == "pago")
    academic = next(d for d in a["documents"] if d["kind"] == "acta")
    for role in ["escolares", "administrador", "vinculacion", "estudiante"]:
        assert (
            clients[role]
            .post(
                f"{BASE}/documents/{payment['id']}/review", json={"status": "validado"}
            )
            .status_code
            == 403
        )
    treasury = clients["tesoreria"]
    detail = treasury.get(f"{BASE}/applications/{a['id']}").json()
    assert [d["kind"] for d in detail["documents"]] == ["pago"]
    assert "curp" not in detail["student"]["profile"]
    assert (
        treasury.get(f"{BASE}/documents/{academic['id']}/download").status_code == 403
    )
    assert (
        treasury.post(
            f"{BASE}/documents/{payment['id']}/review", json={"status": "validado"}
        ).status_code
        == 200
    )


def test_clearance_and_all_documents_required(clients):
    a = in_review(clients)
    assert move(clients["escolares"], a, "validada").status_code == 422
    url = f"{BASE}/applications/{a['id']}/clearance"
    for role in ["administrador", "escolares", "tesoreria", "estudiante"]:
        assert (
            clients[role]
            .post(url, json={"approved": True, "note": "Estadías concluidas"})
            .status_code
            == 403
        )
    assert (
        clients["vinculacion"]
        .post(
            url,
            json={
                "approved": True,
                "note": "Estadías concluidas y seguimiento registrado.",
            },
        )
        .status_code
        == 200
    )


def test_full_workflow_and_notification_persistence(clients):
    a = in_review(clients)
    for d in a["documents"]:
        role = "tesoreria" if d["kind"] == "pago" else "escolares"
        r = clients[role].post(
            f"{BASE}/documents/{d['id']}/review",
            json={"status": "validado", "note": "Documento cotejado."},
        )
        assert r.status_code == 200, r.text
    r = clients["vinculacion"].post(
        f"{BASE}/applications/{a['id']}/clearance",
        json={
            "approved": True,
            "note": "Estadías y seguimiento de egresados concluidos.",
        },
    )
    assert r.status_code == 200
    a = clients["escolares"].get(f"{BASE}/applications/{a['id']}").json()
    for status, extra in [
        ("validada", {}),
        ("proceso", {}),
        ("tramite", {"reference": "REFERENCIA-PRUEBA"}),
        (
            "disponible",
            {"delivery": "Acudir a Servicios Escolares con identificación."},
        ),
        ("concluido", {"note": "Entrega confirmada por el egresado."}),
    ]:
        r = move(clients["escolares"], a, status, **extra)
        assert r.status_code == 200, r.text
        a = r.json()
    saved = clients["estudiante"].get(f"{BASE}/applications/{a['id']}").json()
    assert saved["status"] == "concluido"
    assert len(saved["events"]) >= 15
    notes = clients["estudiante"].get("/api/v1/notifications").json()
    assert any("Trámite concluido" in n["message"] for n in notes)
    assert clients["estudiante"].post("/api/v1/notifications/read").status_code == 200
    assert all(
        n["seen"] for n in clients["estudiante"].get("/api/v1/notifications").json()
    )


def test_rejection_correction_resubmission(clients):
    a = in_review(clients)
    doc = a["documents"][0]
    url = f"{BASE}/documents/{doc['id']}/review"
    assert (
        clients["escolares"]
        .post(url, json={"status": "rechazado", "note": ""})
        .status_code
        == 422
    )
    r = clients["escolares"].post(
        url, json={"status": "rechazado", "note": "Falta una página legible."}
    )
    assert r.status_code == 200
    r = move(
        clients["escolares"], r.json(), "rechazada", note="Adjuntar documento completo."
    )
    assert r.status_code == 200
    a = r.json()
    r = clients["estudiante"].post(
        f"{BASE}/applications/{a['id']}/documents",
        data={"kind": doc["kind"]},
        files={"file": ("correccion.pdf", b"%PDF-1.4\nCorregido")},
    )
    assert r.status_code == 201
    corrected = next(d for d in r.json()["documents"] if d["kind"] == doc["kind"])
    assert corrected["status"] == "recibido" and corrected["note"] == ""
    assert move(clients["estudiante"], r.json(), "enviada").status_code == 200


def test_submission_locks_profile_and_uploads(clients):
    a = in_review(clients)
    c = clients["estudiante"]
    assert c.put("/api/v1/profile", json=PROFILE).status_code == 409
    assert (
        c.post(
            f"{BASE}/applications/{a['id']}/documents",
            data={"kind": "acta"},
            files={"file": ("x.pdf", b"%PDF-1.4")},
        ).status_code
        == 409
    )
    assert move(c, a, "validada").status_code == 403


def test_stale_version_cannot_overwrite(clients):
    a = in_review(clients)
    r = clients["vinculacion"].post(
        f"{BASE}/applications/{a['id']}/clearance",
        json={"approved": True, "note": "Estadías verificadas."},
    )
    assert r.status_code == 200
    assert (
        move(
            clients["escolares"], a, "incompleta", note="Revisar expediente."
        ).status_code
        == 409
    )


def test_csrf_session_and_origin(clients):
    c = clients["estudiante"]
    c.headers.pop("X-CSRF-Token")
    assert c.post(f"{BASE}/applications").status_code == 403
    assert (
        c.post(
            "/api/v1/auth/login",
            json={"email": "x", "password": "x"},
            headers={"Origin": "https://malicioso.example"},
        ).status_code
        == 403
    )
    c.cookies.clear()
    assert c.get(f"{BASE}/applications").status_code == 401


def test_reset_token_single_use_and_sessions_revoked(clients):
    c = clients["estudiante"]
    assert (
        c.post(
            "/api/v1/auth/forgot-password", json={"email": "estudiante@test.local"}
        ).status_code
        == 200
    )
    outbox = DATA_DIR / "outbox"
    text = max(outbox.glob("*.txt"), key=lambda p: p.stat().st_mtime).read_text(
        encoding="utf8"
    )
    raw = text.split("token=")[1].strip()
    with SessionLocal() as db:
        assert db.get(Reset, digest(raw)) is not None
    payload = {"token": raw, "password": "Nueva-contraseña-2026!"}
    assert c.post("/api/v1/auth/reset-password", json=payload).status_code == 200
    assert c.post("/api/v1/auth/reset-password", json=payload).status_code == 400
    assert c.get("/api/v1/auth/me").status_code == 401


def test_csv_formula_injection_escaped(clients):
    a = in_review(clients)
    with SessionLocal() as db:
        case = db.get(Application, a["id"])
        import json

        snapshot = json.loads(case.profile_snapshot)
        snapshot["name"] = '=HYPERLINK("malicious")'
        case.profile_snapshot = json.dumps(snapshot)
        db.commit()
    response = clients["escolares"].get(f"{BASE}/reports/export")
    assert response.status_code == 200 and "'=HYPERLINK" in response.text
    assert clients["tesoreria"].get(f"{BASE}/reports/export").status_code == 403


def test_rate_limit(clients):
    c = clients["otro"]
    for _ in range(5):
        assert (
            c.post(
                "/api/v1/auth/forgot-password", json={"email": "noexiste@test.local"}
            ).status_code
            == 200
        )
    assert (
        c.post(
            "/api/v1/auth/forgot-password", json={"email": "noexiste@test.local"}
        ).status_code
        == 429
    )
