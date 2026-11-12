"""Datos ficticios, exclusivos del seed de desarrollo. No modifican respuestas existentes."""
from datetime import timedelta
import json
from sqlalchemy import select
from ...core.models import User, now
from .models import Questionnaire, Period, Assignment, Submission, ImprovementPlan


def seed_evaluations(db):
    teacher = db.scalar(select(User).where(User.email == "docente@demo.uto.local"))
    students = list(db.scalars(select(User).where(User.email.in_(("estudiante@demo.uto.local", "egresado2@demo.uto.local"))).order_by(User.email)))
    if not teacher or len(students) != 2:
        return
    title = "Cuestionario de ejemplo · Demo"
    questionnaire = db.scalar(select(Questionnaire).where(Questionnaire.title == title).order_by(Questionnaire.version.desc()))
    questions = [
        {"id": "q1", "section": "Planeación", "text": "¿Se explican los objetivos de la asignatura?", "weight": 1},
        {"id": "q2", "section": "Planeación", "text": "¿Se presentan las actividades y sus fechas?", "weight": 1},
        {"id": "q3", "section": "Desarrollo de clase", "text": "¿Los ejemplos ayudan a comprender los temas?", "weight": 1},
        {"id": "q4", "section": "Desarrollo de clase", "text": "¿Se atienden las dudas durante la clase?", "weight": 1},
        {"id": "q5", "section": "Evaluación", "text": "¿Se explican los criterios de las actividades?", "weight": 1},
        {"id": "q6", "section": "Evaluación", "text": "¿Se ofrece retroalimentación sobre los trabajos?", "weight": 1},
    ]
    if not questionnaire:
        definition = {"questions": questions, "options": [{"value": i + 1, "label": label} for i, label in enumerate(("Nunca", "Rara vez", "A veces", "Casi siempre", "Siempre"))]}
        questionnaire = Questionnaire(title=title, definition=json.dumps(definition, ensure_ascii=False))
        db.add(questionnaire)
        db.flush()
    for published in (False, True):
        period_title = "Evaluación de ejemplo · " + ("Resultados" if published else "Recepción")
        period = db.scalar(select(Period).where(Period.title == period_title))
        if period:
            continue  # No reiniciar periodos ni alterar respuestas de la demostración.
        period = Period(title=period_title, questionnaire_id=questionnaire.id,
            start_date=now() - timedelta(days=60 if published else 1),
            end_date=now() + timedelta(days=-30 if published else 30),
            status="publicado" if published else "abierto", minimum_responses=2)
        db.add(period)
        db.flush()
        for index, student in enumerate(students):
            assignment = Assignment(period_id=period.id, teacher_id=teacher.id, student_id=student.id,
                subject="Desarrollo de aplicaciones · Ejemplo", group_name="TIC-DEMO")
            db.add(assignment)
            db.flush()
            if published:
                db.add(Submission(assignment_id=assignment.id, answers=json.dumps({q["id"]: 4 + (index % 2) for q in questions}),
                    comment="Comentario ficticio de demostración.", public_comment="Ejemplo: mantener una guía de ejercicios para consultar después de clase.", comment_reviewed=True))
        if published:
            db.add(ImprovementPlan(period_id=period.id, teacher_id=teacher.id,
                action="Ejemplo: preparar una guía de ejercicios para las actividades de la asignatura.",
                due_date=now() + timedelta(days=20), evidence="Ejemplo: estructura de la guía en preparación.", status="en_proceso"))
