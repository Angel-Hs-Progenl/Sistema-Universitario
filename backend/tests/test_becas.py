"""Pruebas del módulo de gestión de becas de la UT de Oriental."""

import pytest
from datetime import timedelta
from app.core.models import now
from app.modules.becas.domain import DOCUMENTOS
from app.modules.becas.domain import calculate_vulnerability_score, evaluate_applicant_rules


def test_vulnerability_score_calculation():
    # Per capita income <= 2000, rented, expenses > income
    score_high = calculate_vulnerability_score(
        monthly_income=4000.0,
        monthly_expenses=4500.0,
        dependents_count=4,
        housing_type="rentada",
    )
    assert score_high >= 80.0

    # Per capita income > 5000, own house
    score_low = calculate_vulnerability_score(
        monthly_income=30000.0,
        monthly_expenses=12000.0,
        dependents_count=2,
        housing_type="propia",
    )
    assert score_low <= 40.0


def test_rules_evaluation():
    # Passing GPA
    res = evaluate_applicant_rules(applicant_gpa=9.2, call_min_gpa=9.0)
    assert res["meets_requirements"] is True
    assert len(res["issues"]) == 0

    # Failing GPA
    res_fail = evaluate_applicant_rules(applicant_gpa=7.8, call_min_gpa=8.5)
    assert res_fail["meets_requirements"] is False
    assert len(res_fail["issues"]) == 1


def test_becas_full_flow(clients):
    student = clients["estudiante"]
    admin = clients["administrador"]
    evaluator = clients["evaluador"]
    auditor = clients["auditor"]

    # 1. Admin creates a scholarship call
    call_payload = {
        "title": "Beca Excelencia Académica Test",
        "modalidad": "academica",
        "description": "Beca de prueba para excelencia académica en UTO.",
        "min_gpa": 9.0,
        "amount": 4500.0,
        "slots": 20,
        "start_date": (now() - timedelta(days=1)).isoformat(),
        "end_date": (now() + timedelta(days=30)).isoformat(),
        "custom_questions": ["¿Participas en proyectos de investigación?"],
    }
    # Student cannot create calls
    res_forbidden = student.post("/api/v1/becas/convocatorias", json=call_payload)
    assert res_forbidden.status_code == 403

    # Admin creates call
    res_call = admin.post("/api/v1/becas/convocatorias", json=call_payload)
    assert res_call.status_code == 200
    call_id = res_call.json()["id"]

    # 2. Student saves socioeconomic digital profile
    socio_payload = {
        "monthly_income": 5000.0,
        "monthly_expenses": 4800.0,
        "dependents_count": 3,
        "housing_type": "rentada",
        "details": {"cuartos": 2, "servicios": ["agua", "luz"]},
    }
    res_socio = student.post("/api/v1/becas/socioeconomico", json=socio_payload)
    assert res_socio.status_code == 200
    assert "vulnerability_score" in res_socio.json()

    # 3. Student submits application
    app_payload = {
        "call_id": call_id,
        "gpa": 9.4,
        "academic_term": "4to Cuatrimestre",
        "major": "Ingeniería en Tecnologías de la Información",
        "custom_answers": {"¿Participas en proyectos de investigación?": "Sí, en robótica"},
    }
    res_app = student.post("/api/v1/becas/solicitudes", json=app_payload)
    assert res_app.status_code == 200
    app_id = res_app.json()["id"]
    assert res_app.json()["status"] == "recibida"
    assert res_app.json()["folio"].startswith("BEC-2026-")

    # Duplicate application rejected
    res_dup = student.post("/api/v1/becas/solicitudes", json=app_payload)
    assert res_dup.status_code == 409

    # 4. Upload document to application
    doc_res = student.post(
        f"/api/v1/becas/solicitudes/{app_id}/documentos",
        data={"kind": "kardex"},
        files={"file": ("kardex_oficial.pdf", b"%PDF-1.4 sample content", "application/pdf")},
    )
    assert doc_res.status_code == 200

    # La aprobación exige evidencia completa, revisada por el área responsable.
    for document in DOCUMENTOS:
        if document["required"] and document["id"] != "kardex":
            assert student.post(
                f"/api/v1/becas/solicitudes/{app_id}/documentos",
                data={"kind": document["id"]},
                files={"file": ("ejemplo.pdf", b"%PDF-1.4 ejemplo ficticio", "application/pdf")},
            ).status_code == 200
    detail = evaluator.get(f"/api/v1/becas/solicitudes/{app_id}").json()
    version = detail["version"]
    for document in detail["documents"]:
        reviewed = evaluator.post(
            f"/api/v1/becas/solicitudes/{app_id}/documentos/{document['id']}/revision",
            json={"status": "validado", "version": version},
        )
        assert reviewed.status_code == 200
        version = reviewed.json()["version"]

    # 5. Evaluator runs automated rules check
    res_eval_rules = evaluator.post(f"/api/v1/becas/solicitudes/{app_id}/evaluar-reglas")
    assert res_eval_rules.status_code == 200
    assert res_eval_rules.json()["meets_requirements"] is True

    # 6. Evaluator issues favorable dictamen
    dictamen_payload = {
        "decision": "aprobada",
        "committee_notes": "Cumple ampliamente con el promedio y perfil socioeconómico.",
        "version": version,
    }
    res_dictamen = evaluator.post(f"/api/v1/becas/solicitudes/{app_id}/dictamen", json=dictamen_payload)
    assert res_dictamen.status_code == 200
    assert res_dictamen.json()["status"] == "aprobada"

    # 7. Generate payment order for approved application
    order_payload = {
        "application_id": app_id,
        "period": "Parcial 1 - Mayo 2026",
        "scheduled_date": "2026-05-15T12:00:00Z",
    }
    res_order = clients["tesoreria"].post("/api/v1/becas/ordenes-cobro/generar", json=order_payload)
    assert res_order.status_code == 200
    assert "folio_orden" in res_order.json()

    # 8. Student submits simplified renewal
    renewal_payload = {
        "original_application_id": app_id,
        "current_gpa": 9.5,
        "academic_term": "5to Cuatrimestre",
        "notes": "Mantuve promedio superior a 9.0 en el periodo.",
    }
    res_renewal = student.post("/api/v1/becas/renovaciones", json=renewal_payload)
    assert res_renewal.status_code == 200

    # 9. Check dashboard statistics
    res_stats = admin.get("/api/v1/becas/estadisticas")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_applications"] >= 1
    assert stats["approved"] >= 1
    assert stats["total_committed_funds"] >= 4500.0

    # 10. Auditor accesses audit logs and export
    res_export = auditor.get("/api/v1/becas/reportes/export")
    assert res_export.status_code == 200
    assert "text/csv" in res_export.headers["content-type"]

    res_audit = auditor.get("/api/v1/becas/auditoria")
    assert res_audit.status_code == 200
    assert len(res_audit.json()) >= 1

    # Student cannot access audit logs
    res_audit_forbidden = student.get("/api/v1/becas/auditoria")
    assert res_audit_forbidden.status_code == 403
