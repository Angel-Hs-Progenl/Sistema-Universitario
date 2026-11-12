"""Endpoints del módulo de autoevaluación de clase."""

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.models import AccountEvent, User, now
from ...core.security import current_user, require_role

from .models import (
    SelfEvaluation,
    SelfEvaluationQuestionnaire,
    SelfEvaluationAssignment,
    SelfEvaluationSubmission,
)

from .schemas import (
    QuestionnairePayload,
    EvaluationPayload,
    AssignmentPayload,
    EvaluationTransition,
    SubmissionPayload,
)


router = APIRouter(
    prefix="/api/v1/autoevaluacion",
    tags=["Autoevaluación"],
)


def autoevaluation_user(user=Depends(current_user)):
    """Permite acceder al módulo únicamente a estudiantes y administradores."""
    require_role(user, "estudiante", "administrador")
    return user


def utc(value: datetime) -> datetime:
    """Normaliza fechas para compararlas en UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def event(db: Session, user: User, action: str):
    """Registra un evento sin almacenar las respuestas del estudiante."""
    db.add(
        AccountEvent(
            user_id=user.id,
            actor_id=user.id,
            action=action[:80],
        )
    )


def commit(db: Session):
    """Confirma una transacción y traduce conflictos de integridad."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="El registro ya existe o fue actualizado por otra persona. Recarga la página.",
        )


def evaluation_record(
    db: Session,
    evaluation_id: int,
    lock: bool = False,
) -> SelfEvaluation:
    """Obtiene una evaluación y, si se solicita, bloquea su fila."""
    statement = select(SelfEvaluation).where(
        SelfEvaluation.id == evaluation_id
    )

    if lock:
        statement = statement.with_for_update()

    evaluation = db.scalar(statement)

    if not evaluation:
        raise HTTPException(
            status_code=404,
            detail="Autoevaluación no encontrada.",
        )

    return evaluation


def questionnaire_data(questionnaire: SelfEvaluationQuestionnaire):
    """Convierte el cuestionario almacenado en su representación JSON."""
    return {
        "id": questionnaire.id,
        "title": questionnaire.title,
        "version": questionnaire.version,
        **json.loads(questionnaire.definition),
    }


def assignment_data(
    assignment: SelfEvaluationAssignment,
    evaluation: SelfEvaluation,
    submission: SelfEvaluationSubmission | None,
):
    """Construye una respuesta sin exponer datos de otros estudiantes."""
    current_time = now()

    accepting = (
        evaluation.status == "abierta"
        and utc(evaluation.start_date) <= current_time <= utc(evaluation.end_date)
        and submission is None
    )

    return {
        "assignment_id": assignment.id,
        "evaluation_id": evaluation.id,
        "title": evaluation.title,
        "subject": evaluation.subject,
        "group_name": evaluation.group_name,
        "partial": evaluation.partial,
        "start_date": evaluation.start_date,
        "end_date": evaluation.end_date,
        "status": evaluation.status,
        "submitted": submission is not None,
        "accepting": accepting,
    }


def validate_answers(
    definition: dict[str, Any],
    answers: dict[str, Any],
) -> dict[str, Any]:
    """Valida las respuestas según el tipo y la configuración de cada pregunta."""

    questions = definition.get("questions", [])

    if not isinstance(questions, list):
        raise HTTPException(
            status_code=500,
            detail="La configuración del cuestionario no es válida.",
        )

    questions_by_id = {
        question["id"]: question
        for question in questions
    }

    # Rechazar identificadores que no pertenecen al cuestionario.
    unknown_ids = set(answers) - set(questions_by_id)

    if unknown_ids:
        raise HTTPException(
            status_code=422,
            detail="Se recibieron respuestas para preguntas inexistentes.",
        )

    validated: dict[str, Any] = {}

    for question in questions:
        question_id = question["id"]
        question_type = question["type"]
        required = question.get("required", True)

        if question_id not in answers:
            if required:
                raise HTTPException(
                    status_code=422,
                    detail=f"Falta responder la pregunta: {question_id}.",
                )

            continue

        answer = answers[question_id]

        # Escala numérica.
        if question_type == "escala":
            # bool es una subclase de int en Python; debe rechazarse explícitamente.
            if type(answer) is not int:
                raise HTTPException(
                    status_code=422,
                    detail=f"La respuesta de {question_id} debe ser un número entero.",
                )

            minimum = question.get("min_value")
            maximum = question.get("max_value")

            if (
                minimum is None
                or maximum is None
                or not minimum <= answer <= maximum
            ):
                raise HTTPException(
                    status_code=422,
                    detail=f"El valor de {question_id} está fuera de la escala permitida.",
                )

        # Selección de una sola opción.
        elif question_type == "opcion_unica":
            if not isinstance(answer, str):
                raise HTTPException(
                    status_code=422,
                    detail=f"La respuesta de {question_id} debe ser una opción.",
                )

            allowed = {
                option["value"]
                for option in question.get("options", [])
            }

            if answer not in allowed:
                raise HTTPException(
                    status_code=422,
                    detail=f"La opción seleccionada para {question_id} no es válida.",
                )

        # Selección de varias opciones.
        elif question_type == "opcion_multiple":
            if (
                not isinstance(answer, list)
                or not all(isinstance(value, str) for value in answer)
            ):
                raise HTTPException(
                    status_code=422,
                    detail=f"La respuesta de {question_id} debe ser una lista de opciones.",
                )

            if len(answer) != len(set(answer)):
                raise HTTPException(
                    status_code=422,
                    detail=f"No puedes repetir opciones en {question_id}.",
                )

            if required and not answer:
                raise HTTPException(422, f"Selecciona al menos una opción para {question_id}.")

            allowed = {
                option["value"]
                for option in question.get("options", [])
            }

            if not set(answer).issubset(allowed):
                raise HTTPException(
                    status_code=422,
                    detail=f"Hay opciones no válidas en la respuesta {question_id}.",
                )

        # Respuesta abierta.
        elif question_type == "texto_libre":
            if not isinstance(answer, str):
                raise HTTPException(
                    status_code=422,
                    detail=f"La respuesta de {question_id} debe ser texto.",
                )

            answer = answer.strip()

            if len(answer) > question.get("max_length", 2000):
                raise HTTPException(
                    status_code=422,
                    detail=f"La respuesta de {question_id} supera la longitud permitida.",
                )

            if required and not answer:
                raise HTTPException(
                    status_code=422,
                    detail=f"La pregunta {question_id} requiere una respuesta.",
                )

        else:
            raise HTTPException(
                status_code=500,
                detail=f"El cuestionario contiene un tipo de pregunta no reconocido: {question_id}.",
            )

        validated[question_id] = answer

    return validated


# ============================================================
# CUESTIONARIOS
# ============================================================

@router.get("/cuestionarios")
def list_questionnaires(
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    questionnaires = db.scalars(
        select(SelfEvaluationQuestionnaire).order_by(
            SelfEvaluationQuestionnaire.id.desc()
        )
    )

    return [
        questionnaire_data(questionnaire)
        for questionnaire in questionnaires
    ]


@router.post("/cuestionarios", status_code=201)
def create_questionnaire(
    payload: QuestionnairePayload,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    version = (
        db.scalar(
            select(func.max(SelfEvaluationQuestionnaire.version)).where(
                SelfEvaluationQuestionnaire.title == payload.title
            )
        )
        or 0
    ) + 1

    questionnaire = SelfEvaluationQuestionnaire(
        title=payload.title,
        version=version,
        definition=json.dumps(
            {
                "questions": [
                    question.model_dump()
                    for question in payload.questions
                ]
            },
            ensure_ascii=False,
        ),
    )

    db.add(questionnaire)
    db.flush()

    event(
        db,
        user,
        f"Autoevaluación: cuestionario {questionnaire.id}, versión {version}",
    )

    commit(db)

    return questionnaire_data(questionnaire)


# ============================================================
# ADMINISTRACIÓN DE EVALUACIONES
# ============================================================

@router.get("/evaluaciones")
def list_evaluations(
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    evaluations = db.scalars(
        select(SelfEvaluation).order_by(
            SelfEvaluation.id.desc()
        )
    )

    result = []

    for evaluation in evaluations:
        assigned = db.scalar(
            select(func.count(SelfEvaluationAssignment.id)).where(
                SelfEvaluationAssignment.evaluation_id == evaluation.id
            )
        ) or 0

        submitted = db.scalar(
            select(func.count(SelfEvaluationSubmission.id))
            .join(
                SelfEvaluationAssignment,
                SelfEvaluationSubmission.assignment_id
                == SelfEvaluationAssignment.id,
            )
            .where(
                SelfEvaluationAssignment.evaluation_id == evaluation.id
            )
        ) or 0

        result.append(
            {
                "id": evaluation.id,
                "title": evaluation.title,
                "subject": evaluation.subject,
                "group_name": evaluation.group_name,
                "partial": evaluation.partial,
                "questionnaire_id": evaluation.questionnaire_id,
                "start_date": evaluation.start_date,
                "end_date": evaluation.end_date,
                "status": evaluation.status,
                "version": evaluation.version,
                "assigned_count": assigned,
                "submitted_count": submitted,
                "pending_count": assigned - submitted,
            }
        )

    return result


@router.post("/evaluaciones", status_code=201)
def create_evaluation(
    payload: EvaluationPayload,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    questionnaire = db.get(
        SelfEvaluationQuestionnaire,
        payload.questionnaire_id,
    )

    if not questionnaire:
        raise HTTPException(
            status_code=422,
            detail="Selecciona un cuestionario existente.",
        )

    if utc(payload.end_date) <= now():
        raise HTTPException(
            status_code=422,
            detail="La fecha de cierre debe estar en el futuro.",
        )

    evaluation = SelfEvaluation(
        **payload.model_dump(),
        status="borrador",
        version=1,
        created_by=user.id,
    )

    db.add(evaluation)
    db.flush()

    event(
        db,
        user,
        f"Autoevaluación: evaluación {evaluation.id} creada",
    )

    commit(db)

    return {
        "id": evaluation.id,
        "status": evaluation.status,
        "version": evaluation.version,
    }


@router.post("/evaluaciones/{evaluation_id}/asignaciones", status_code=201)
def create_assignments(
    evaluation_id: int,
    payload: AssignmentPayload,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    evaluation = evaluation_record(db, evaluation_id, lock=True)

    if evaluation.status != "borrador":
        raise HTTPException(
            status_code=409,
            detail="Las asignaciones solo pueden modificarse en borrador.",
        )

    students = db.scalars(
        select(User).where(
            User.id.in_(payload.student_ids),
            User.role == "estudiante",
        )
    ).all()

    students_by_id = {
        student.id: student
        for student in students
    }

    if set(students_by_id) != set(payload.student_ids):
        raise HTTPException(
            status_code=422,
            detail="Uno o más identificadores no corresponden a estudiantes válidos.",
        )

    existing_ids = set(
        db.scalars(
            select(SelfEvaluationAssignment.student_id).where(
                SelfEvaluationAssignment.evaluation_id == evaluation.id,
                SelfEvaluationAssignment.student_id.in_(payload.student_ids),
            )
        ).all()
    )

    if existing_ids:
        raise HTTPException(
            status_code=409,
            detail="Uno o más estudiantes ya están asignados a esta evaluación.",
        )

    assignments = [
        SelfEvaluationAssignment(
            evaluation_id=evaluation.id,
            student_id=student_id,
        )
        for student_id in payload.student_ids
    ]

    db.add_all(assignments)

    event(
        db,
        user,
        f"Autoevaluación: asignaciones registradas para {evaluation.id}",
    )

    commit(db)

    return {
        "evaluation_id": evaluation.id,
        "assigned_count": len(assignments),
    }


@router.get("/estudiantes")
def list_students(
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    """Lista los estudiantes disponibles para asignar a evaluaciones."""
    require_role(user, "administrador")

    students = db.scalars(
        select(User)
        .where(User.role == "estudiante")
        .order_by(User.name)
    ).all()

    return [
        {
            "id": student.id,
            "name": student.name,
            "email": student.email,
        }
        for student in students
    ]


@router.get("/evaluaciones/{evaluation_id}/asignaciones")
def list_evaluation_assignments(
    evaluation_id: int,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    """Consulta los estudiantes asignados a una evaluación específica."""
    require_role(user, "administrador")

    evaluation = evaluation_record(db, evaluation_id)

    rows = db.execute(
        select(SelfEvaluationAssignment, User)
        .join(
            User,
            SelfEvaluationAssignment.student_id == User.id,
        )
        .where(
            SelfEvaluationAssignment.evaluation_id == evaluation.id
        )
        .order_by(User.name)
    ).all()

    return [
        {
            "id": assignment.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "created_at": assignment.created_at,
        }
        for assignment, student in rows
    ]


@router.post("/evaluaciones/{evaluation_id}/estado")
def transition_evaluation(
    evaluation_id: int,
    payload: EvaluationTransition,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    evaluation = evaluation_record(db, evaluation_id, lock=True)

    if evaluation.version != payload.version:
        raise HTTPException(
            status_code=409,
            detail="La evaluación cambió. Recarga antes de continuar.",
        )

    transitions = {
        "borrador": "abierta",
        "abierta": "cerrada",
    }

    if transitions.get(evaluation.status) != payload.status:
        raise HTTPException(
            status_code=409,
            detail="Ese cambio de estado no está permitido.",
        )

    if payload.status == "abierta":
        if utc(evaluation.end_date) <= now():
            raise HTTPException(
                status_code=409,
                detail="La fecha de cierre ya venció.",
            )

        has_assignments = db.scalar(
            select(SelfEvaluationAssignment.id)
            .where(
                SelfEvaluationAssignment.evaluation_id == evaluation.id
            )
            .limit(1)
        )

        if not has_assignments:
            raise HTTPException(
                status_code=409,
                detail="Asigna estudiantes antes de abrir la evaluación.",
            )

    evaluation.status = payload.status
    evaluation.version += 1

    event(
        db,
        user,
        f"Autoevaluación: evaluación {evaluation.id} {payload.status}",
    )

    commit(db)

    return {
        "id": evaluation.id,
        "status": evaluation.status,
        "version": evaluation.version,
    }


# ============================================================
# VISTA DEL ESTUDIANTE
# ============================================================

@router.get("/mis-evaluaciones")
def my_evaluations(
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")

    rows = db.execute(
        select(
            SelfEvaluationAssignment,
            SelfEvaluation,
            SelfEvaluationSubmission,
        )
        .join(
            SelfEvaluation,
            SelfEvaluationAssignment.evaluation_id == SelfEvaluation.id,
        )
        .outerjoin(
            SelfEvaluationSubmission,
            SelfEvaluationSubmission.assignment_id
            == SelfEvaluationAssignment.id,
        )
        .where(
            SelfEvaluationAssignment.student_id == user.id,
            SelfEvaluation.status != "borrador",
        )
        .order_by(SelfEvaluation.id.desc())
    ).all()

    return [
        assignment_data(assignment, evaluation, submission)
        for assignment, evaluation, submission in rows
    ]


@router.get("/asignaciones/{assignment_id}")
def assignment_detail(
    assignment_id: int,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")

    assignment = db.get(
        SelfEvaluationAssignment,
        assignment_id,
    )

    if not assignment or assignment.student_id != user.id:
        raise HTTPException(
            status_code=404,
            detail="Asignación no encontrada.",
        )

    evaluation = evaluation_record(
        db,
        assignment.evaluation_id,
    )

    if evaluation.status == "borrador":
        raise HTTPException(
            status_code=404,
            detail="La evaluación todavía no está disponible.",
        )

    submission = db.scalar(
        select(SelfEvaluationSubmission).where(
            SelfEvaluationSubmission.assignment_id == assignment.id
        )
    )

    questionnaire = db.get(
        SelfEvaluationQuestionnaire,
        evaluation.questionnaire_id,
    )

    return {
        **assignment_data(assignment, evaluation, submission),
        "questionnaire": questionnaire_data(questionnaire),
        "answers": json.loads(submission.answers) if submission else None,
        "submitted_at": submission.submitted_at if submission else None,
    }


@router.post("/asignaciones/{assignment_id}/respuesta", status_code=201)
def submit_answers(
    assignment_id: int,
    payload: SubmissionPayload,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")

    assignment = db.get(
        SelfEvaluationAssignment,
        assignment_id,
    )

    if not assignment or assignment.student_id != user.id:
        raise HTTPException(
            status_code=404,
            detail="Asignación no encontrada.",
        )

    # Bloquea la evaluación para coordinar el envío con su cierre.
    evaluation = evaluation_record(
        db,
        assignment.evaluation_id,
        lock=True,
    )

    if evaluation.status != "abierta":
        raise HTTPException(
            status_code=409,
            detail="La evaluación no está abierta.",
        )

    current_time = now()

    if not (
        utc(evaluation.start_date)
        <= current_time
        <= utc(evaluation.end_date)
    ):
        raise HTTPException(
            status_code=409,
            detail="La evaluación está fuera de su periodo de respuesta.",
        )

    existing = db.scalar(
        select(SelfEvaluationSubmission.id).where(
            SelfEvaluationSubmission.assignment_id == assignment.id
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ya enviaste esta autoevaluación. Las respuestas son definitivas.",
        )

    questionnaire = db.get(
        SelfEvaluationQuestionnaire,
        evaluation.questionnaire_id,
    )

    definition = json.loads(questionnaire.definition)

    validated_answers = validate_answers(
        definition,
        payload.answers,
    )

    submission = SelfEvaluationSubmission(
        assignment_id=assignment.id,
        answers=json.dumps(
            validated_answers,
            ensure_ascii=False,
        ),
    )

    db.add(submission)

    event(
        db,
        user,
        f"Autoevaluación: respuesta enviada para asignación {assignment.id}",
    )

    commit(db)

    return {
        "message": "Autoevaluación enviada correctamente. No puedes modificar tus respuestas.",
        "submitted": True,
    }


@router.get("/mis-respuestas")
def my_submissions(
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")

    rows = db.execute(
        select(
            SelfEvaluationAssignment,
            SelfEvaluation,
            SelfEvaluationSubmission,
        )
        .join(
            SelfEvaluation,
            SelfEvaluationAssignment.evaluation_id == SelfEvaluation.id,
        )
        .join(
            SelfEvaluationSubmission,
            SelfEvaluationSubmission.assignment_id
            == SelfEvaluationAssignment.id,
        )
        .where(
            SelfEvaluationAssignment.student_id == user.id
        )
        .order_by(SelfEvaluationSubmission.submitted_at.desc())
    ).all()

    result = []

    for assignment, evaluation, submission in rows:
        result.append(
            {
                "assignment_id": assignment.id,
                "evaluation_id": evaluation.id,
                "title": evaluation.title,
                "subject": evaluation.subject,
                "group_name": evaluation.group_name,
                "partial": evaluation.partial,
                "submitted_at": submission.submitted_at,
                "answers": json.loads(submission.answers),
                "questionnaire": questionnaire_data(db.get(
                    SelfEvaluationQuestionnaire, evaluation.questionnaire_id
                )),
            }
        )

    return result


# ============================================================
# RESULTADOS PARA EL ADMINISTRADOR
# ============================================================

@router.get("/evaluaciones/{evaluation_id}/resultados")
def evaluation_results(
    evaluation_id: int,
    user=Depends(autoevaluation_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador")

    evaluation = evaluation_record(db, evaluation_id)

    rows = db.execute(
        select(
            SelfEvaluationAssignment,
            User,
            SelfEvaluationSubmission,
        )
        .join(
            User,
            SelfEvaluationAssignment.student_id == User.id,
        )
        .outerjoin(
            SelfEvaluationSubmission,
            SelfEvaluationSubmission.assignment_id
            == SelfEvaluationAssignment.id,
        )
        .where(
            SelfEvaluationAssignment.evaluation_id == evaluation.id
        )
        .order_by(User.name)
    ).all()

    responses = []

    for assignment, student, submission in rows:
        responses.append(
            {
                "assignment_id": assignment.id,
                "student_id": student.id,
                "student_name": student.name,
                "submitted": submission is not None,
                "submitted_at": (
                    submission.submitted_at
                    if submission is not None
                    else None
                ),
                "answers": (
                    json.loads(submission.answers)
                    if submission is not None
                    else None
                ),
            }
        )

    assigned_count = len(responses)
    submitted_count = sum(
        1 for response in responses if response["submitted"]
    )

    return {
        "evaluation": {
            "id": evaluation.id,
            "title": evaluation.title,
            "subject": evaluation.subject,
            "group_name": evaluation.group_name,
            "partial": evaluation.partial,
            "status": evaluation.status,
        },
        "questionnaire": questionnaire_data(db.get(
            SelfEvaluationQuestionnaire, evaluation.questionnaire_id
        )),
        "summary": {
            "assigned_count": assigned_count,
            "submitted_count": submitted_count,
            "pending_count": assigned_count - submitted_count,
        },
        "responses": responses,
    }
