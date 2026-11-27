"""API de coevaluación: preparación, parejas y respuestas definitivas."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased

from ...core.database import get_db
from ...core.models import AccountEvent, User, now
from ...core.security import current_user, require_role
from .models import PeerActivity, PeerAssignment, PeerQuestionnaire, PeerSubmission
from .schemas import ActivityPayload, ActivityTransition, AssignmentPayload, QuestionnairePayload, SubmissionPayload


router = APIRouter(prefix="/api/v1/coevaluacion", tags=["Coevaluación"])


def coevaluation_user(user=Depends(current_user)):
    require_role(user, "estudiante", "administrador")
    return user


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def commit(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "El registro ya existe o cambió. Recarga la página.")


def event(db: Session, user: User, action: str):
    db.add(AccountEvent(user_id=user.id, actor_id=user.id, action=action[:80]))


def activity_record(db: Session, activity_id: int, lock: bool = False) -> PeerActivity:
    query = select(PeerActivity).where(PeerActivity.id == activity_id)
    activity = db.scalar(query.with_for_update() if lock else query)
    if not activity:
        raise HTTPException(404, "Coevaluación no encontrada.")
    return activity


def questionnaire_data(questionnaire: PeerQuestionnaire):
    return {
        "id": questionnaire.id,
        "title": questionnaire.title,
        "version": questionnaire.version,
        "criteria": json.loads(questionnaire.definition)["criteria"],
    }


def activity_data(activity: PeerActivity, assigned: int, submitted: int):
    return {
        "id": activity.id,
        "title": activity.title,
        "subject": activity.subject,
        "group_name": activity.group_name,
        "partial": activity.partial,
        "questionnaire_id": activity.questionnaire_id,
        "start_date": activity.start_date,
        "end_date": activity.end_date,
        "status": activity.status,
        "version": activity.version,
        "assigned_count": assigned,
        "submitted_count": submitted,
        "pending_count": assigned - submitted,
    }


def availability(activity: PeerActivity, submitted: bool) -> str:
    if submitted:
        return "enviada"
    current = now()
    if activity.status != "abierta" or utc(activity.end_date) <= current:
        return "cerrada"
    if utc(activity.start_date) > current:
        return "programada"
    return "abierta"


@router.get("/cuestionarios")
def list_questionnaires(user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    rows = db.scalars(select(PeerQuestionnaire).order_by(PeerQuestionnaire.id.desc())).all()
    return [questionnaire_data(row) for row in rows]


@router.post("/cuestionarios", status_code=201)
def create_questionnaire(payload: QuestionnairePayload, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    version = (db.scalar(select(func.max(PeerQuestionnaire.version)).where(PeerQuestionnaire.title == payload.title)) or 0) + 1
    questionnaire = PeerQuestionnaire(
        title=payload.title,
        version=version,
        definition=json.dumps({"criteria": [criterion.model_dump() for criterion in payload.criteria]}, ensure_ascii=False),
    )
    db.add(questionnaire)
    db.flush()
    event(db, user, f"Coevaluación: cuestionario {questionnaire.id}, versión {version}")
    commit(db)
    return questionnaire_data(questionnaire)


@router.get("/estudiantes")
def list_students(user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    students = db.scalars(select(User).where(User.role == "estudiante").order_by(User.name, User.id)).all()
    return [{"id": student.id, "name": student.name, "email": student.email} for student in students]


@router.get("/actividades")
def list_activities(user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    activities = db.scalars(select(PeerActivity).order_by(PeerActivity.id.desc())).all()
    result = []
    for activity in activities:
        assigned = db.scalar(select(func.count(PeerAssignment.id)).where(PeerAssignment.activity_id == activity.id)) or 0
        submitted = db.scalar(
            select(func.count(PeerSubmission.id))
            .join(PeerAssignment, PeerSubmission.assignment_id == PeerAssignment.id)
            .where(PeerAssignment.activity_id == activity.id)
        ) or 0
        result.append(activity_data(activity, assigned, submitted))
    return result


@router.post("/actividades", status_code=201)
def create_activity(payload: ActivityPayload, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    if not db.get(PeerQuestionnaire, payload.questionnaire_id):
        raise HTTPException(422, "Selecciona un cuestionario existente.")
    if utc(payload.end_date) <= now():
        raise HTTPException(422, "La fecha de cierre debe estar en el futuro.")
    activity = PeerActivity(**payload.model_dump(), created_by=user.id)
    db.add(activity)
    db.flush()
    event(db, user, f"Coevaluación: actividad {activity.id} creada")
    commit(db)
    return {"id": activity.id, "status": activity.status, "version": activity.version}


@router.get("/actividades/{activity_id}/asignaciones")
def list_assignments(activity_id: int, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    activity_record(db, activity_id)
    evaluator = aliased(User)
    peer = aliased(User)
    rows = db.execute(
        select(PeerAssignment, evaluator, peer, PeerSubmission.id)
        .join(evaluator, PeerAssignment.evaluator_id == evaluator.id)
        .join(peer, PeerAssignment.peer_id == peer.id)
        .outerjoin(PeerSubmission, PeerSubmission.assignment_id == PeerAssignment.id)
        .where(PeerAssignment.activity_id == activity_id)
        .order_by(evaluator.name, peer.name)
    ).all()
    return [
        {"id": assignment.id, "evaluator_name": source.name, "peer_name": target.name, "submitted": submission_id is not None}
        for assignment, source, target, submission_id in rows
    ]


@router.post("/actividades/{activity_id}/asignaciones", status_code=201)
def create_assignments(activity_id: int, payload: AssignmentPayload, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    activity = activity_record(db, activity_id, lock=True)
    if activity.status != "borrador":
        raise HTTPException(409, "Solo puedes asignar parejas antes de abrir la coevaluación.")
    ids = {student_id for pair in payload.pairs for student_id in (pair.evaluator_id, pair.peer_id)}
    valid = set(db.scalars(select(User.id).where(User.id.in_(ids), User.role == "estudiante")).all())
    if valid != ids:
        raise HTTPException(422, "Selecciona cuentas de estudiante habilitadas.")
    db.add_all([
        PeerAssignment(activity_id=activity.id, evaluator_id=pair.evaluator_id, peer_id=pair.peer_id)
        for pair in payload.pairs
    ])
    activity.version += 1
    event(db, user, f"Coevaluación: parejas asignadas a {activity.id}")
    commit(db)
    return {"assigned_count": len(payload.pairs), "version": activity.version}


@router.post("/actividades/{activity_id}/estado")
def transition_activity(activity_id: int, payload: ActivityTransition, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    activity = activity_record(db, activity_id, lock=True)
    if activity.version != payload.version:
        raise HTTPException(409, "La coevaluación cambió. Recarga antes de continuar.")
    if {"borrador": "abierta", "abierta": "cerrada"}.get(activity.status) != payload.status:
        raise HTTPException(409, "Ese cambio de estado no está permitido.")
    if payload.status == "abierta":
        if utc(activity.end_date) <= now():
            raise HTTPException(409, "La fecha de cierre ya venció.")
        assigned = db.scalar(select(PeerAssignment.id).where(PeerAssignment.activity_id == activity.id).limit(1))
        if not assigned:
            raise HTTPException(409, "Asigna al menos una pareja antes de abrir.")
    activity.status = payload.status
    activity.version += 1
    event(db, user, f"Coevaluación: actividad {activity.id} {activity.status}")
    commit(db)
    return {"id": activity.id, "status": activity.status, "version": activity.version}


@router.get("/mis-asignaciones")
def my_assignments(user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    peer = aliased(User)
    rows = db.execute(
        select(PeerAssignment, PeerActivity, peer, PeerSubmission.id)
        .join(PeerActivity, PeerAssignment.activity_id == PeerActivity.id)
        .join(peer, PeerAssignment.peer_id == peer.id)
        .outerjoin(PeerSubmission, PeerSubmission.assignment_id == PeerAssignment.id)
        .where(PeerAssignment.evaluator_id == user.id, PeerActivity.status != "borrador")
        .order_by(PeerActivity.id.desc(), peer.name)
    ).all()
    return [
        {
            "assignment_id": assignment.id,
            "title": activity.title,
            "subject": activity.subject,
            "group_name": activity.group_name,
            "partial": activity.partial,
            "peer_name": target.name,
            "start_date": activity.start_date,
            "end_date": activity.end_date,
            "submitted": submission_id is not None,
            "availability": availability(activity, submission_id is not None),
            "accepting": availability(activity, submission_id is not None) == "abierta",
        }
        for assignment, activity, target, submission_id in rows
    ]


@router.get("/asignaciones/{assignment_id}")
def assignment_detail(assignment_id: int, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    assignment = db.get(PeerAssignment, assignment_id)
    if not assignment or assignment.evaluator_id != user.id:
        raise HTTPException(404, "Asignación no encontrada.")
    activity = activity_record(db, assignment.activity_id)
    if activity.status == "borrador":
        raise HTTPException(404, "La coevaluación todavía no está disponible.")
    peer = db.get(User, assignment.peer_id)
    questionnaire = db.get(PeerQuestionnaire, activity.questionnaire_id)
    submission = db.scalar(select(PeerSubmission).where(PeerSubmission.assignment_id == assignment.id))
    return {
        "assignment_id": assignment.id,
        "title": activity.title,
        "subject": activity.subject,
        "group_name": activity.group_name,
        "partial": activity.partial,
        "peer_name": peer.name,
        "start_date": activity.start_date,
        "end_date": activity.end_date,
        "submitted": submission is not None,
        "availability": availability(activity, submission is not None),
        "accepting": availability(activity, submission is not None) == "abierta",
        "questionnaire": questionnaire_data(questionnaire),
        "response": {
            "scores": json.loads(submission.scores),
            "strength": submission.strength,
            "improvement": submission.improvement,
            "submitted_at": submission.submitted_at,
        } if submission else None,
    }


@router.post("/asignaciones/{assignment_id}/respuesta", status_code=201)
def submit_response(assignment_id: int, payload: SubmissionPayload, user=Depends(coevaluation_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    assignment = db.get(PeerAssignment, assignment_id)
    if not assignment or assignment.evaluator_id != user.id:
        raise HTTPException(404, "Asignación no encontrada.")
    activity = activity_record(db, assignment.activity_id, lock=True)
    current = now()
    if activity.status != "abierta" or not utc(activity.start_date) <= current <= utc(activity.end_date):
        raise HTTPException(409, "La recepción de esta coevaluación está cerrada.")
    if db.scalar(select(PeerSubmission.id).where(PeerSubmission.assignment_id == assignment.id)):
        raise HTTPException(409, "Ya enviaste esta coevaluación.")
    questionnaire = db.get(PeerQuestionnaire, activity.questionnaire_id)
    criteria = json.loads(questionnaire.definition)["criteria"]
    expected = {criterion["id"] for criterion in criteria}
    if set(payload.scores) != expected or any(type(value) is not int or not 1 <= value <= 5 for value in payload.scores.values()):
        raise HTTPException(422, "Responde todos los criterios con valores enteros del 1 al 5.")
    db.add(PeerSubmission(
        assignment_id=assignment.id,
        scores=json.dumps(payload.scores),
        strength=payload.strength,
        improvement=payload.improvement,
    ))
    event(db, user, f"Coevaluación: respuesta enviada para asignación {assignment.id}")
    commit(db)
    return {"submitted": True, "message": "Coevaluación enviada. La respuesta ya no puede modificarse."}
