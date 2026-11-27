from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.models import User
from app.modules.coevaluacion.models import PeerSubmission


BASE = "/api/v1/coevaluacion"


def student_id(email):
    with SessionLocal() as db:
        return db.scalar(select(User.id).where(User.email == email))


def prepared_activity(clients):
    admin = clients["administrador"]
    questionnaire = admin.post(f"{BASE}/cuestionarios", json={
        "title": "Trabajo de equipo de prueba",
        "criteria": [
            {"id": "cumplimiento", "title": "Cumplimiento", "description": "Cumple las tareas acordadas."},
            {"id": "colaboracion", "title": "Colaboración", "description": "Apoya el trabajo del equipo."},
        ],
    })
    assert questionnaire.status_code == 201, questionnaire.text
    current = datetime.now(timezone.utc)
    activity = admin.post(f"{BASE}/actividades", json={
        "title": "Coevaluación del parcial",
        "questionnaire_id": questionnaire.json()["id"],
        "subject": "Programación",
        "group_name": "TI-301",
        "partial": "Primer parcial",
        "start_date": (current - timedelta(hours=1)).isoformat(),
        "end_date": (current + timedelta(days=1)).isoformat(),
    })
    assert activity.status_code == 201, activity.text
    return activity.json(), student_id("estudiante@test.local"), student_id("otro@test.local")


def test_coevaluacion_roles_asignacion_envio_y_persistencia(clients):
    activity, evaluator_id, peer_id = prepared_activity(clients)
    admin = clients["administrador"]
    student = clients["estudiante"]
    peer = clients["otro"]
    activity_id = activity["id"]

    for role in ("docente", "escolares", "tesoreria", "vinculacion", "evaluador", "auditor"):
        assert clients[role].get(f"{BASE}/mis-asignaciones").status_code == 403
    assert student.get(f"{BASE}/cuestionarios").status_code == 403
    assert student.get(f"{BASE}/actividades").status_code == 403

    pair = {"evaluator_id": evaluator_id, "peer_id": peer_id}
    assert admin.post(f"{BASE}/actividades/{activity_id}/asignaciones", json={"pairs": [{**pair, "peer_id": evaluator_id}]}).status_code == 422
    assigned = admin.post(f"{BASE}/actividades/{activity_id}/asignaciones", json={"pairs": [pair]})
    assert assigned.status_code == 201, assigned.text
    assert admin.post(f"{BASE}/actividades/{activity_id}/asignaciones", json={"pairs": [pair]}).status_code == 409
    assert student.get(f"{BASE}/mis-asignaciones").json() == []

    stale = admin.post(f"{BASE}/actividades/{activity_id}/estado", json={"status": "abierta", "version": activity["version"]})
    assert stale.status_code == 409
    opened = admin.post(f"{BASE}/actividades/{activity_id}/estado", json={"status": "abierta", "version": assigned.json()["version"]})
    assert opened.status_code == 200, opened.text

    assignment_id = student.get(f"{BASE}/mis-asignaciones").json()[0]["assignment_id"]
    detail = student.get(f"{BASE}/asignaciones/{assignment_id}")
    assert detail.status_code == 200
    assert detail.json()["peer_name"] == "otro"
    assert peer.get(f"{BASE}/asignaciones/{assignment_id}").status_code == 404
    assert peer.post(f"{BASE}/asignaciones/{assignment_id}/respuesta", json={"scores": {}}).status_code == 404

    invalid = student.post(f"{BASE}/asignaciones/{assignment_id}/respuesta", json={"scores": {"cumplimiento": 5, "colaboracion": 6}})
    assert invalid.status_code == 422
    sent = student.post(f"{BASE}/asignaciones/{assignment_id}/respuesta", json={
        "scores": {"cumplimiento": 5, "colaboracion": 4},
        "strength": "Cumplió los acuerdos de la actividad.",
        "improvement": "Compartir avances antes de la reunión.",
    })
    assert sent.status_code == 201, sent.text
    assert student.post(f"{BASE}/asignaciones/{assignment_id}/respuesta", json={"scores": {"cumplimiento": 5, "colaboracion": 4}}).status_code == 409
    assert student.get(f"{BASE}/asignaciones/{assignment_id}").json()["response"]["scores"]["colaboracion"] == 4
    assert admin.get(f"{BASE}/actividades/{activity_id}/asignaciones").json()[0]["submitted"] is True
    with SessionLocal() as db:
        assert db.scalar(select(PeerSubmission).where(PeerSubmission.assignment_id == assignment_id))

    closed = admin.post(f"{BASE}/actividades/{activity_id}/estado", json={"status": "cerrada", "version": opened.json()["version"]})
    assert closed.status_code == 200
    assert admin.post(f"{BASE}/actividades/{activity_id}/estado", json={"status": "abierta", "version": closed.json()["version"]}).status_code == 409


def test_coevaluacion_cuestionarios_versionados_y_sin_autorrespuesta(clients):
    activity, evaluator_id, peer_id = prepared_activity(clients)
    admin = clients["administrador"]
    questionnaires = admin.get(f"{BASE}/cuestionarios").json()
    revised = admin.post(f"{BASE}/cuestionarios", json={
        "title": questionnaires[0]["title"],
        "criteria": [{"id": "nuevo", "title": "Nuevo criterio", "description": "Observación nueva de prueba."}],
    })
    assert revised.status_code == 201
    assert revised.json()["version"] == 2
    assert admin.get(f"{BASE}/actividades").json()[0]["questionnaire_id"] == questionnaires[0]["id"]
    assert admin.post(f"{BASE}/actividades/{activity['id']}/asignaciones", json={"pairs": [{"evaluator_id": evaluator_id, "peer_id": evaluator_id}]}).status_code == 422
    assert admin.post(f"{BASE}/actividades/{activity['id']}/asignaciones", json={"pairs": [{"evaluator_id": evaluator_id, "peer_id": "missing"}]}).status_code == 422


def test_coevaluacion_no_acepta_envios_tras_cierre(clients):
    activity, evaluator_id, peer_id = prepared_activity(clients)
    admin = clients["administrador"]
    assigned = admin.post(f"{BASE}/actividades/{activity['id']}/asignaciones", json={
        "pairs": [{"evaluator_id": evaluator_id, "peer_id": peer_id}]
    })
    opened = admin.post(f"{BASE}/actividades/{activity['id']}/estado", json={
        "status": "abierta", "version": assigned.json()["version"]
    })
    assignment_id = clients["estudiante"].get(f"{BASE}/mis-asignaciones").json()[0]["assignment_id"]
    assert admin.post(f"{BASE}/actividades/{activity['id']}/estado", json={
        "status": "cerrada", "version": opened.json()["version"]
    }).status_code == 200
    response = clients["estudiante"].post(f"{BASE}/asignaciones/{assignment_id}/respuesta", json={
        "scores": {"cumplimiento": 5, "colaboracion": 4}
    })
    assert response.status_code == 409
