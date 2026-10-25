"""EVD-01/06/10/12. Cuestionarios inmutables y resultados sin identidad estudiantil."""
import csv
import io
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, StrictInt
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased
from ...core.database import get_db
from ...core.models import User, AccountEvent, Notification, now
from ...core.security import current_user, require_role, PRODUCTION
from .models import Questionnaire, Period, Assignment, Submission, ImprovementPlan


def evaluation_user(request: Request, user=Depends(current_user)):
    require_role(user, "estudiante", "docente", "administrador")
    if PRODUCTION and request.state.session.auth_method != "google":
        raise HTTPException(403, "Evaluación docente requiere iniciar sesión con Google institucional.")
    return user


router = APIRouter(prefix="/api/v1/evaluacion-docente", tags=["Evaluación docente"], dependencies=[Depends(evaluation_user)])


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def event(db, user, action):
    db.add(AccountEvent(user_id=user.id, actor_id=user.id, action=action[:80]))


def commit(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "El registro ya existe o fue actualizado por otra persona. Recarga la página.")


def period_record(db, id, lock=False):
    stmt = select(Period).where(Period.id == id)
    period = db.scalar(stmt.with_for_update() if lock else stmt)
    if not period:
        raise HTTPException(404, "Periodo no encontrado.")
    return period


def questionnaire_data(q):
    return {"id": q.id, "title": q.title, "version": q.version, **json.loads(q.definition)}


class Option(Payload):
    value: int = Field(ge=1, le=10)
    label: str = Field(min_length=1, max_length=80)


class Question(Payload):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,40}$")
    section: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=5, max_length=500)
    weight: float = Field(gt=0, le=100)


class QuestionnairePayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    options: list[Option] = Field(min_length=2, max_length=10)
    questions: list[Question] = Field(min_length=3, max_length=100)


@router.get("/cuestionarios")
def questionnaires(user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    return [questionnaire_data(q) for q in db.scalars(select(Questionnaire).order_by(Questionnaire.id.desc()))]


@router.post("/cuestionarios", status_code=201)
def create_questionnaire(payload: QuestionnairePayload, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    if len({q.id for q in payload.questions}) != len(payload.questions) or len({o.value for o in payload.options}) != len(payload.options):
        raise HTTPException(422, "Los identificadores de pregunta y los valores de la escala deben ser únicos.")
    if len({q.section for q in payload.questions}) != 3:
        raise HTTPException(422, "Distribuye las preguntas en las tres secciones del cuestionario.")
    version = (db.scalar(select(func.max(Questionnaire.version)).where(Questionnaire.title == payload.title)) or 0) + 1
    q = Questionnaire(title=payload.title, version=version, definition=json.dumps(payload.model_dump(exclude={"title"}), ensure_ascii=False))
    db.add(q)
    db.flush()
    event(db, user, f"EVD cuestionario {q.id}, versión {version}")
    commit(db)
    return questionnaire_data(q)


@router.get("/personas")
def people(user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in db.scalars(select(User).where(User.role.in_(("estudiante", "docente"))).order_by(User.name))]


@router.get("/periodos")
def periods(user=Depends(evaluation_user), db: Session = Depends(get_db)):
    stmt = select(Period)
    if user.role != "administrador":
        column = Assignment.student_id if user.role == "estudiante" else Assignment.teacher_id
        stmt = stmt.where(Period.id.in_(select(Assignment.period_id).where(column == user.id)), Period.status != "borrador")
    return [{"id": p.id, "title": p.title, "questionnaire_id": p.questionnaire_id, "start_date": p.start_date,
        "end_date": p.end_date, "status": p.status, "minimum_responses": p.minimum_responses, "version": p.version}
        for p in db.scalars(stmt.order_by(Period.id.desc()))]


class PeriodPayload(Payload):
    title: str = Field(min_length=3, max_length=150)
    questionnaire_id: int
    start_date: datetime
    end_date: datetime
    minimum_responses: int = Field(ge=2, le=500)


@router.post("/periodos", status_code=201)
def create_period(payload: PeriodPayload, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    if not db.get(Questionnaire, payload.questionnaire_id):
        raise HTTPException(422, "Selecciona un cuestionario guardado.")
    if utc(payload.end_date) <= utc(payload.start_date):
        raise HTTPException(422, "El cierre debe ser posterior a la apertura.")
    period = Period(**payload.model_dump())
    db.add(period)
    db.flush()
    event(db, user, f"EVD periodo {period.id} creado")
    commit(db)
    return {"id": period.id, "version": period.version}


class PeriodTransition(Payload):
    status: Literal["abierto", "cerrado", "publicado"]
    version: int = Field(ge=1)


@router.post("/periodos/{period_id}/estado")
def transition_period(period_id: int, payload: PeriodTransition, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    period = period_record(db, period_id, True)
    if period.version != payload.version:
        raise HTTPException(409, "El periodo cambió. Recarga antes de continuar.")
    transitions = {"borrador": "abierto", "abierto": "cerrado", "cerrado": "publicado"}
    if transitions.get(period.status) != payload.status:
        raise HTTPException(409, "Ese cambio de estado no está disponible.")
    if payload.status == "abierto":
        if utc(period.end_date) <= now():
            raise HTTPException(409, "El periodo ya venció. Configura un periodo nuevo.")
        if not db.scalar(select(Assignment.id).where(Assignment.period_id == period.id).limit(1)):
            raise HTTPException(409, "Registra las asignaciones antes de abrir el periodo.")
    if payload.status == "publicado":
        pending = db.scalar(select(Submission.id).join(Assignment).where(Assignment.period_id == period.id, Submission.comment != "", Submission.comment_reviewed.is_(False)).limit(1))
        if pending:
            raise HTTPException(409, "Revisa los comentarios antes de publicar. Elimina cualquier dato que identifique al estudiante.")
        if not db.scalar(select(Submission.id).join(Assignment).where(Assignment.period_id == period.id).limit(1)):
            raise HTTPException(409, "No hay respuestas para publicar.")
    period.status = payload.status
    period.version += 1
    event(db, user, f"EVD periodo {period.id}: {payload.status}")
    if payload.status == "publicado":
        teachers = db.scalars(select(Assignment.teacher_id).where(Assignment.period_id == period.id).distinct())
        for teacher_id in teachers:
            db.add(Notification(user_id=teacher_id, message=f"Ya puedes consultar los resultados publicados de {period.title}. Se aplica el umbral de privacidad configurado.", target_path=f"/evaluacion-docente/docente/resultados?periodo={period.id}"))
    commit(db)
    return {"status": period.status, "version": period.version}


class AssignmentPayload(Payload):
    period_id: int
    student_id: str
    teacher_id: str
    subject: str = Field(min_length=3, max_length=150)
    group_name: str = Field(min_length=1, max_length=80)


@router.post("/asignaciones", status_code=201)
def create_assignment(payload: AssignmentPayload, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    period = period_record(db, payload.period_id, True)
    if period.status != "borrador":
        raise HTTPException(409, "Las asignaciones se preparan antes de abrir el periodo.")
    student, teacher = db.get(User, payload.student_id), db.get(User, payload.teacher_id)
    if not student or student.role != "estudiante" or not teacher or teacher.role != "docente":
        raise HTTPException(422, "Selecciona una cuenta de estudiante y una cuenta de docente habilitadas.")
    assignment = Assignment(**payload.model_dump())
    db.add(assignment)
    event(db, user, f"EVD asignación registrada en periodo {period.id}")
    commit(db)
    return {"id": assignment.id}


@router.get("/asignaciones")
def assignments(user=Depends(evaluation_user), db: Session = Depends(get_db)):
    student = aliased(User)
    stmt = select(Assignment, Period, User, Submission.id, student.name).join(Period, Assignment.period_id == Period.id).join(User, Assignment.teacher_id == User.id).join(student, Assignment.student_id == student.id).outerjoin(Submission, Submission.assignment_id == Assignment.id)
    if user.role == "estudiante":
        stmt = stmt.where(Assignment.student_id == user.id, Period.status != "borrador")
    elif user.role == "docente":
        # El docente no recibe filas por estudiante ni su participación individual.
        rows = db.execute(select(Assignment.period_id, Period.title, Assignment.subject, Assignment.group_name).join(Period).where(Assignment.teacher_id == user.id, Period.status != "borrador").distinct()).all()
        return [{"period_id": r[0], "period_title": r[1], "subject": r[2], "group_name": r[3]} for r in rows]
    rows = db.execute(stmt.order_by(Period.id.desc(), Assignment.subject).limit(1000))
    return [{"id": a.id, "period_id": p.id, "period_title": p.title, "period_status": p.status, "start_date": p.start_date,
        "end_date": p.end_date, "teacher_name": t.name, "teacher_id": t.id, "subject": a.subject, "group_name": a.group_name,
        "submitted": bool(submission), "accepting": not submission and p.status == "abierto" and utc(p.start_date) <= now() <= utc(p.end_date),
        **({"student_id": a.student_id, "student_name": student_name} if user.role == "administrador" else {})} for a, p, t, submission, student_name in rows]


@router.get("/asignaciones/{assignment_id}")
def assignment_detail(assignment_id: int, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    a = db.get(Assignment, assignment_id)
    if not a or a.student_id != user.id:
        raise HTTPException(404, "Asignación no encontrada.")
    period = period_record(db, a.period_id)
    if period.status == "borrador":
        raise HTTPException(404, "Asignación no disponible.")
    submitted = db.scalar(select(Submission.id).where(Submission.assignment_id == a.id))
    return {"id": a.id, "teacher_name": db.get(User, a.teacher_id).name, "subject": a.subject, "period_title": period.title,
        "submitted": bool(submitted), "accepting": not submitted and period.status == "abierto" and utc(period.start_date) <= now() <= utc(period.end_date),
        "questionnaire": questionnaire_data(db.get(Questionnaire, period.questionnaire_id))}


class SubmissionPayload(Payload):
    answers: dict[str, StrictInt]
    comment: str = Field(default="", max_length=2000)


@router.post("/asignaciones/{assignment_id}/respuesta", status_code=201)
def submit(assignment_id: int, payload: SubmissionPayload, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    a = db.get(Assignment, assignment_id)
    if not a or a.student_id != user.id:
        raise HTTPException(404, "Asignación no encontrada.")
    # Mismo bloqueo que el cierre de periodo: una respuesta no puede entrar tras él.
    period = period_record(db, a.period_id, True)
    if period.status != "abierto" or not utc(period.start_date) <= now() <= utc(period.end_date):
        raise HTTPException(409, "El periodo no está recibiendo respuestas.")
    if db.scalar(select(Submission.id).where(Submission.assignment_id == a.id)):
        raise HTTPException(409, "Esta evaluación ya fue enviada. Las respuestas están cerradas.")
    definition = json.loads(db.get(Questionnaire, period.questionnaire_id).definition)
    if set(payload.answers) != {q["id"] for q in definition["questions"]} or not set(payload.answers.values()) <= {o["value"] for o in definition["options"]}:
        raise HTTPException(422, "Responde todas las preguntas con valores de la escala configurada.")
    db.add(Submission(assignment_id=a.id, answers=json.dumps(payload.answers), comment=payload.comment, comment_reviewed=not payload.comment))
    # Sin respuestas, comentarios ni identidad del docente en el evento de cuenta.
    event(db, user, "EVD evaluación enviada")
    commit(db)
    return {"message": "Evaluación guardada. No puedes modificar las respuestas.", "submitted": True}


@router.get("/comentarios")
def comments(period_id: int, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    period_record(db, period_id)
    stmt = select(Submission).join(Assignment).where(Assignment.period_id == period_id, Submission.comment != "").order_by(Submission.id)
    return [{"id": s.id, "comment": s.comment, "public_comment": s.public_comment, "reviewed": s.comment_reviewed} for s in db.scalars(stmt)]


class Moderation(Payload):
    public_comment: str = Field(max_length=2000)


@router.post("/comentarios/{submission_id}/revision")
def moderate(submission_id: int, payload: Moderation, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    s = db.get(Submission, submission_id)
    if not s:
        raise HTTPException(404, "Comentario no encontrado.")
    a = db.get(Assignment, s.assignment_id)
    period = period_record(db, a.period_id, True)
    if period.status == "publicado":
        raise HTTPException(409, "El periodo ya está publicado; sus comentarios están cerrados.")
    s.public_comment, s.comment_reviewed = payload.public_comment, True
    event(db, user, f"EVD comentario {s.id} revisado")
    commit(db)
    return {"message": "Revisión guardada."}


def results_for(db, period, teacher_id):
    teacher = db.get(User, teacher_id)
    if not teacher or teacher.role != "docente":
        raise HTTPException(404, "Docente no encontrado.")
    rows = db.execute(select(Assignment, Submission).join(Submission, Submission.assignment_id == Assignment.id).where(Assignment.period_id == period.id, Assignment.teacher_id == teacher_id)).all()
    distinct_students = len({a.student_id for a, s in rows})
    base = {"teacher_id": teacher_id, "teacher_name": teacher.name, "period_id": period.id, "period_title": period.title,
        "published": period.status == "publicado", "minimum_responses": period.minimum_responses}
    if distinct_students < period.minimum_responses:
        return {**base, "available": False, "reason": "No se alcanzó el mínimo de participantes configurado para proteger la identidad.", "questions": [], "sections": [], "comments": []}
    definition = json.loads(db.get(Questionnaire, period.questionnaire_id).definition)
    answers = [json.loads(s.answers) for _, s in rows]
    averages = {q["id"]: sum(answer[q["id"]] for answer in answers) / len(answers) for q in definition["questions"]}
    questions = [{**q, "average": round(averages[q["id"]], 2)} for q in definition["questions"]]
    sections = defaultdict(list)
    for q in questions:
        sections[q["section"]].append(q)
    weighted = lambda qs: round(sum(averages[q["id"]] * q["weight"] for q in qs) / sum(q["weight"] for q in qs), 2)
    return {**base, "available": True, "response_count": len(rows), "participant_count": distinct_students,
        "average": weighted(questions), "scale": definition["options"], "questions": questions,
        "sections": [{"name": name, "average": weighted(qs)} for name, qs in sections.items()],
        "comments": sorted(s.public_comment for _, s in rows if s.comment_reviewed and s.public_comment),
        "calculation": "Media de respuestas por pregunta; se pondera cada pregunta con el peso configurado. No constituye una clasificación institucional."}


@router.get("/resultados")
def results(period_id: int, teacher_id: str | None = None, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "docente", "administrador")
    period = period_record(db, period_id)
    if user.role == "docente":
        if teacher_id and teacher_id != user.id:
            raise HTTPException(403, "Solo puedes consultar tus resultados.")
        if period.status != "publicado":
            raise HTTPException(403, "Dirección aún no publica los resultados de este periodo.")
        teacher_id = user.id
    ids = [teacher_id] if teacher_id else list(db.scalars(select(Assignment.teacher_id).where(Assignment.period_id == period.id).distinct()))
    return [results_for(db, period, id) for id in ids]


@router.get("/reportes.csv")
def export_results(period_id: int, teacher_id: str | None = None, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    reports = results(period_id, teacher_id, user, db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Periodo", "Docente", "Sección", "Pregunta", "Promedio", "Respuestas"])
    def safe(value):
        text = str(value)
        return "'" + text if text.lstrip().startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")) else text
    for report in reports:
        if report["available"]:
            for q in report["questions"]:
                writer.writerow([safe(v) for v in (report["period_title"], report["teacher_name"], q["section"], q["text"], q["average"], report["response_count"])])
    return Response("\ufeff" + output.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="evaluacion-docente.csv"'})


@router.get("/planes")
def plans(user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "docente", "administrador")
    stmt = select(ImprovementPlan, User, Period).join(User, ImprovementPlan.teacher_id == User.id).join(Period)
    if user.role == "docente":
        stmt = stmt.where(ImprovementPlan.teacher_id == user.id, Period.status == "publicado")
    return [{"id": p.id, "period_id": p.period_id, "teacher_id": p.teacher_id, "teacher_name": u.name, "period_title": period.title,
        "action": p.action, "evidence": p.evidence, "due_date": p.due_date, "status": p.status, "version": p.version} for p, u, period in db.execute(stmt.order_by(ImprovementPlan.id.desc()))]


class PlanPayload(Payload):
    period_id: int
    teacher_id: str
    action: str = Field(min_length=10, max_length=4000)
    due_date: datetime


@router.post("/planes", status_code=201)
def create_plan(payload: PlanPayload, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "administrador")
    period = period_record(db, payload.period_id)
    if period.status != "publicado" or not results_for(db, period, payload.teacher_id)["available"]:
        raise HTTPException(409, "Publica resultados suficientes antes de registrar un plan de mejora.")
    plan = ImprovementPlan(**payload.model_dump())
    db.add(plan)
    event(db, user, f"EVD plan registrado en periodo {period.id}")
    commit(db)
    return {"id": plan.id}


class PlanProgress(Payload):
    evidence: str = Field(min_length=3, max_length=4000)
    status: Literal["en_proceso", "concluido"]
    version: int = Field(ge=1)


@router.post("/planes/{plan_id}/avance")
def update_plan(plan_id: int, payload: PlanProgress, user=Depends(evaluation_user), db: Session = Depends(get_db)):
    require_role(user, "docente")
    plan = db.scalar(select(ImprovementPlan).where(ImprovementPlan.id == plan_id).with_for_update())
    if not plan or plan.teacher_id != user.id:
        raise HTTPException(404, "Plan no encontrado.")
    if plan.version != payload.version or plan.status == "concluido":
        raise HTTPException(409, "El plan cambió o ya está concluido. Recarga la página.")
    plan.evidence, plan.status = payload.evidence, payload.status
    plan.version += 1
    plan.updated_at = now()
    event(db, user, f"EVD avance de plan {plan.id}")
    commit(db)
    return {"version": plan.version, "status": plan.status}
