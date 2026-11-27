"""Datos ficticios para demostración del módulo de autoevaluación."""
from datetime import timedelta
import json
from sqlalchemy import select
from ...core.models import User, now
from .models import (
    SelfEvaluationQuestionnaire,
    SelfEvaluation,
    SelfEvaluationAssignment,
    SelfEvaluationSubmission,
)


def seed_autoevaluacion(db):
    """Genera cuestionarios, evaluaciones y respuestas de ejemplo para desarrollo."""
    admin = db.scalar(select(User).where(User.email == "administrador@demo.uto.local"))
    students = list(
        db.scalars(
            select(User)
            .where(
                User.email.in_(
                    ("estudiante@demo.uto.local", "egresado2@demo.uto.local")
                )
            )
            .order_by(User.email)
        )
    )

    if not admin or len(students) != 2:
        return

    # 1. Cuestionario de demostración
    title = "Autoevaluación de Desempeño y Competencias"
    questionnaire = db.scalar(
        select(SelfEvaluationQuestionnaire)
        .where(SelfEvaluationQuestionnaire.title == title)
        .order_by(SelfEvaluationQuestionnaire.version.desc())
    )

    questions = [
        {
            "id": "asistencia_puntualidad",
            "type": "escala",
            "text": "¿Cómo calificas tu puntualidad y asistencia a las sesiones de clase?",
            "required": True,
            "min_value": 1,
            "max_value": 5,
        },
        {
            "id": "comprension_temas",
            "type": "escala",
            "text": "¿Cuál es tu nivel de comprensión general de los temas vistos durante este periodo?",
            "required": True,
            "min_value": 1,
            "max_value": 5,
        },
        {
            "id": "entrega_actividades",
            "type": "opcion_unica",
            "text": "¿Cumpliste con la entrega de todas las tareas y proyectos en tiempo y forma?",
            "required": True,
            "options": [
                {"value": "siempre", "label": "Sí, todas en la fecha límite"},
                {"value": "la_mayoria", "label": "La mayoría a tiempo"},
                {"value": "algunas_tarde", "label": "Algunas con retraso"},
                {"value": "incompletas", "label": "Varias actividades pendientes"},
            ],
        },
        {
            "id": "estrategias_estudio",
            "type": "opcion_multiple",
            "text": "¿Qué recursos o estrategias utilizaste para reforzar tu aprendizaje?",
            "required": False,
            "options": [
                {"value": "apuntes", "label": "Apuntes y notas de clase"},
                {"value": "practica_laboratorio", "label": "Prácticas de laboratorio"},
                {"value": "videos_tutoriales", "label": "Videos y tutoriales en línea"},
                {"value": "estudio_grupal", "label": "Estudio con compañeros de equipo"},
            ],
        },
        {
            "id": "compromiso_mejora",
            "type": "texto_libre",
            "text": "¿Qué aspectos consideras que puedes mejorar en el siguiente parcial y qué acciones realizarás?",
            "required": True,
            "max_length": 500,
        },
    ]

    if not questionnaire:
        definition = {"questions": questions}
        questionnaire = SelfEvaluationQuestionnaire(
            title=title,
            version=1,
            definition=json.dumps(definition, ensure_ascii=False),
        )
        db.add(questionnaire)
        db.flush()

    # 2. Evaluación abierta (Mariana tiene pendiente, Diego ya respondió)
    eval_abierta_title = "Autoevaluación Parcial 1 · Tecnologías Web"
    eval_abierta = db.scalar(
        select(SelfEvaluation).where(SelfEvaluation.title == eval_abierta_title)
    )

    if not eval_abierta:
        eval_abierta = SelfEvaluation(
            title=eval_abierta_title,
            questionnaire_id=questionnaire.id,
            subject="Tecnologías Web",
            group_name="TIC-5A",
            partial="Primer parcial",
            start_date=now() - timedelta(days=5),
            end_date=now() + timedelta(days=25),
            status="abierta",
            version=2,
            created_by=admin.id,
        )
        db.add(eval_abierta)
        db.flush()

        # Asignar a ambos estudiantes
        for student in students:
            assignment = SelfEvaluationAssignment(
                evaluation_id=eval_abierta.id,
                student_id=student.id,
            )
            db.add(assignment)
            db.flush()

            # Diego ya respondió
            if student.email == "egresado2@demo.uto.local":
                diego_answers = {
                    "asistencia_puntualidad": 5,
                    "comprension_temas": 4,
                    "entrega_actividades": "siempre",
                    "estrategias_estudio": ["apuntes", "practica_laboratorio"],
                    "compromiso_mejora": "Dedicaré más tiempo a la práctica individual de los frameworks modernos.",
                }
                submission = SelfEvaluationSubmission(
                    assignment_id=assignment.id,
                    answers=json.dumps(diego_answers, ensure_ascii=False),
                    submitted_at=now() - timedelta(days=2),
                )
                db.add(submission)

    # 3. Evaluación en borrador para demostración de administración
    eval_borrador_title = "Autoevaluación Parcial 2 · Programación Móvil"
    eval_borrador = db.scalar(
        select(SelfEvaluation).where(SelfEvaluation.title == eval_borrador_title)
    )

    if not eval_borrador:
        eval_borrador = SelfEvaluation(
            title=eval_borrador_title,
            questionnaire_id=questionnaire.id,
            subject="Programación Móvil",
            group_name="TIC-5A",
            partial="Segundo parcial",
            start_date=now() + timedelta(days=2),
            end_date=now() + timedelta(days=30),
            status="borrador",
            version=1,
            created_by=admin.id,
        )
        db.add(eval_borrador)
        db.flush()
