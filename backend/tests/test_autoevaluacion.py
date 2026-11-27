from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.models import User


AUTO = "/api/v1/autoevaluacion"


def get_user_id(email: str) -> str:
    """Obtiene el identificador de un usuario creado por la fixture."""
    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(User.email == email)
        )
        assert user is not None
        return user.id


def create_open_evaluation(clients):
    """
    Crea un cuestionario, una evaluación, sus asignaciones
    y abre la evaluación para que los estudiantes respondan.
    """
    admin = clients["administrador"]

    # 1. Crear el cuestionario.
    response = admin.post(
        f"{AUTO}/cuestionarios",
        json={
            "title": "Autoevaluación de prueba",
            "questions": [
                {
                    "id": "esfuerzo",
                    "type": "escala",
                    "text": "¿Cuánto esfuerzo dedicaste?",
                    "required": True,
                    "min_value": 1,
                    "max_value": 5,
                },
                {
                    "id": "reflexion",
                    "type": "texto_libre",
                    "text": "¿Qué aprendiste durante el parcial?",
                    "required": True,
                    "max_length": 300,
                },
            ],
        },
    )

    assert response.status_code == 201, response.text
    questionnaire_id = response.json()["id"]

    # 2. Configurar una evaluación vigente.
    current_time = datetime.now(timezone.utc)

    response = admin.post(
        f"{AUTO}/evaluaciones",
        json={
            "title": "Autoevaluación del primer parcial",
            "questionnaire_id": questionnaire_id,
            "subject": "Programación",
            "group_name": "TI-301",
            "partial": "Primer parcial",
            "start_date": (
                current_time - timedelta(hours=1)
            ).isoformat(),
            "end_date": (
                current_time + timedelta(days=1)
            ).isoformat(),
        },
    )

    assert response.status_code == 201, response.text
    evaluation = response.json()
    evaluation_id = evaluation["id"]

    # 3. Obtener los identificadores de los estudiantes de prueba.
    student_id = get_user_id("estudiante@test.local")
    other_student_id = get_user_id("otro@test.local")

    # 4. Asignar la evaluación a ambos estudiantes.
    response = admin.post(
        f"{AUTO}/evaluaciones/{evaluation_id}/asignaciones",
        json={
            "student_ids": [
                student_id,
                other_student_id,
            ]
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["assigned_count"] == 2

    # 5. Abrir la evaluación.
    response = admin.post(
        f"{AUTO}/evaluaciones/{evaluation_id}/estado",
        json={
            "status": "abierta",
            "version": evaluation["version"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "abierta"

    # 6. Recuperar las asignaciones individuales.
    response = clients["estudiante"].get(
        f"{AUTO}/mis-evaluaciones"
    )

    assert response.status_code == 200, response.text

    student_assignment = next(
        item
        for item in response.json()
        if item["evaluation_id"] == evaluation_id
    )

    response = clients["otro"].get(
        f"{AUTO}/mis-evaluaciones"
    )

    assert response.status_code == 200, response.text

    other_assignment = next(
        item
        for item in response.json()
        if item["evaluation_id"] == evaluation_id
    )

    return {
        "evaluation_id": evaluation_id,
        "student_assignment_id": student_assignment["assignment_id"],
        "other_assignment_id": other_assignment["assignment_id"],
    }


def test_autoevaluacion_flujo_completo_y_respuesta_definitiva(clients):
    """Comprueba el envío, la persistencia y el bloqueo de una segunda respuesta."""
    setup = create_open_evaluation(clients)

    student = clients["estudiante"]
    assignment_id = setup["student_assignment_id"]

    # El estudiante consulta su cuestionario.
    response = student.get(
        f"{AUTO}/asignaciones/{assignment_id}"
    )

    assert response.status_code == 200, response.text

    detail = response.json()

    assert detail["accepting"] is True
    assert detail["submitted"] is False
    assert detail["questionnaire"]["title"] == (
        "Autoevaluación de prueba"
    )

    # El estudiante envía respuestas válidas.
    answers = {
        "esfuerzo": 4,
        "reflexion": "Aprendí a validar datos y trabajar con funciones.",
    }

    response = student.post(
        f"{AUTO}/asignaciones/{assignment_id}/respuesta",
        json={"answers": answers},
    )

    assert response.status_code == 201, response.text
    assert response.json()["submitted"] is True

    # La respuesta no se puede volver a enviar.
    response = student.post(
        f"{AUTO}/asignaciones/{assignment_id}/respuesta",
        json={
            "answers": {
                "esfuerzo": 2,
                "reflexion": "Intento modificar la respuesta.",
            }
        },
    )

    assert response.status_code == 409, response.text

    # La respuesta original permanece guardada.
    response = student.get(
        f"{AUTO}/asignaciones/{assignment_id}"
    )

    assert response.status_code == 200, response.text
    detail = response.json()

    assert detail["submitted"] is True
    assert detail["answers"] == answers

    # El historial incluye la respuesta del estudiante.
    response = student.get(f"{AUTO}/mis-respuestas")

    assert response.status_code == 200, response.text

    history = [
        item
        for item in response.json()
        if item["evaluation_id"] == setup["evaluation_id"]
    ]

    assert len(history) == 1
    assert history[0]["answers"] == answers

    # El administrador puede consultar los resultados.
    response = clients["administrador"].get(
        f"{AUTO}/evaluaciones/{setup['evaluation_id']}/resultados"
    )

    assert response.status_code == 200, response.text

    results = response.json()

    assert results["summary"]["assigned_count"] == 2
    assert results["summary"]["submitted_count"] == 1
    assert results["summary"]["pending_count"] == 1


def test_autoevaluacion_protege_asignaciones_de_otros_estudiantes(clients):
    """Un estudiante no puede consultar ni responder otra asignación."""
    setup = create_open_evaluation(clients)

    student = clients["estudiante"]
    other_assignment_id = setup["other_assignment_id"]

    # No puede consultar el detalle de la asignación ajena.
    response = student.get(
        f"{AUTO}/asignaciones/{other_assignment_id}"
    )

    assert response.status_code == 404

    # Tampoco puede enviar respuestas a esa asignación.
    response = student.post(
        f"{AUTO}/asignaciones/{other_assignment_id}/respuesta",
        json={
            "answers": {
                "esfuerzo": 4,
                "reflexion": "Respuesta no autorizada.",
            }
        },
    )

    assert response.status_code == 404


def test_autoevaluacion_rechaza_respuestas_invalidas(clients):
    """Valida los tipos de respuesta y rechaza preguntas desconocidas."""
    setup = create_open_evaluation(clients)

    student = clients["estudiante"]
    assignment_id = setup["student_assignment_id"]

    # Una escala no puede recibir un valor fuera de sus límites.
    response = student.post(
        f"{AUTO}/asignaciones/{assignment_id}/respuesta",
        json={
            "answers": {
                "esfuerzo": 8,
                "reflexion": "Respuesta de prueba.",
            }
        },
    )

    assert response.status_code == 422, response.text

    # No se aceptan identificadores de preguntas inexistentes.
    response = student.post(
        f"{AUTO}/asignaciones/{assignment_id}/respuesta",
        json={
            "answers": {
                "esfuerzo": 4,
                "reflexion": "Respuesta de prueba.",
                "pregunta_inventada": "Valor",
            }
        },
    )

    assert response.status_code == 422, response.text

    # Una respuesta inválida no debe impedir el envío de una válida.
    response = student.post(
        f"{AUTO}/asignaciones/{assignment_id}/respuesta",
        json={
            "answers": {
                "esfuerzo": 4,
                "reflexion": "Respuesta válida.",
            }
        },
    )

    assert response.status_code == 201, response.text


def test_autoevaluacion_restringe_administracion_a_administradores(clients):
    """Comprueba que los estudiantes no puedan administrar evaluaciones."""
    student = clients["estudiante"]

    response = student.post(
        f"{AUTO}/cuestionarios",
        json={
            "title": "Cuestionario no autorizado",
            "questions": [
                {
                    "id": "esfuerzo",
                    "type": "escala",
                    "text": "¿Cuánto esfuerzo dedicaste?",
                    "required": True,
                    "min_value": 1,
                    "max_value": 5,
                }
            ],
        },
    )

    assert response.status_code == 403, response.text

    response = student.get(f"{AUTO}/evaluaciones")

    assert response.status_code == 403, response.text


def test_autoevaluacion_listado_estudiantes_y_asignaciones(clients):
    """El administrador puede consultar estudiantes disponibles y las asignaciones de una evaluación."""
    setup = create_open_evaluation(clients)
    admin = clients["administrador"]

    # Consultar lista de estudiantes para asignar
    response = admin.get(f"{AUTO}/estudiantes")
    assert response.status_code == 200, response.text
    students = response.json()
    assert len(students) >= 2
    student_emails = {s["email"] for s in students}
    assert "estudiante@test.local" in student_emails

    # Consultar asignaciones de la evaluación
    response = admin.get(f"{AUTO}/evaluaciones/{setup['evaluation_id']}/asignaciones")
    assert response.status_code == 200, response.text
    assignments = response.json()
    assert len(assignments) == 2
    assert {a["student_email"] for a in assignments} == {"estudiante@test.local", "otro@test.local"}
