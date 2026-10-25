import csv
import io
import json
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field as PydField, ConfigDict
from decimal import Decimal
from typing import Literal
from sqlalchemy.exc import IntegrityError
from ...core.files import validated_upload
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from ...core.database import get_db, DATA_DIR
from ...core.models import User, Notification, uid, now
from ...core.security import current_user, require_role
from .models import (
    ScholarshipCall,
    ScholarshipApplication,
    ScholarshipDocument,
    ScholarshipSocioeconomic,
    ScholarshipPaymentOrder,
    ScholarshipRenewal,
    ScholarshipAuditLog,
)
from .domain import (
    MODALIDADES,
    ESTADOS,
    DOCUMENTOS,
    ESTADOS_ORDEN,
    calculate_vulnerability_score,
    evaluate_applicant_rules,
)

REVIEW = ("administrador", "escolares", "evaluador")
REPORT = (*REVIEW, "auditor")
FINANCE = ("tesoreria",)


def module_user(user=Depends(current_user)):
    require_role(user, "estudiante", *REPORT, "tesoreria")
    return user


router = APIRouter(prefix="/api/v1/becas", tags=["Becas"], dependencies=[Depends(module_user)])


class Payload(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def save(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un registro para esta solicitud y periodo.")



def audit_becas(db: Session, user: User, action: str, target_type: str, target_id: str, details: str = "", ip: str = "127.0.0.1"):
    db.add(
        ScholarshipAuditLog(
            user_id=user.id,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            details="",
            ip_address=ip,
        )
    )


# ---------------- CONVOCATORIAS ---------------- #

@router.get("/convocatorias")
def list_calls(user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante", *REPORT, "tesoreria")
    calls = db.scalars(select(ScholarshipCall).order_by(desc(ScholarshipCall.created_at))).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "modalidad": c.modalidad,
            "description": c.description,
            "min_gpa": c.min_gpa,
            "amount": c.amount,
            "slots": c.slots,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat(),
            "is_active": c.is_active,
            "accepting": c.is_active and utc(c.start_date) <= now() <= utc(c.end_date),
            "custom_questions": json.loads(c.custom_questions or "[]"),
            "created_at": c.created_at.isoformat(),
        }
        for c in calls
    ]


class CreateCallPayload(Payload):
    title: str = PydField(min_length=3, max_length=150)
    modalidad: str = PydField(min_length=3, max_length=30)
    description: str = PydField(min_length=10, max_length=5000)
    min_gpa: float = PydField(ge=6.0, le=10.0)
    amount: Decimal = PydField(gt=0, max_digits=12, decimal_places=2)
    slots: int = PydField(gt=0, le=100000)
    start_date: str
    end_date: str
    custom_questions: list[str] = PydField(default_factory=list, max_length=20)


@router.post("/convocatorias")
def create_call(
    payload: CreateCallPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *REVIEW)
    require_role(user, "administrador", "evaluador", "escolares")
    code = f"BEC-{now().year}-{uid()[:12].upper()}"

    try:
        start_dt = datetime.fromisoformat(payload.start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(payload.end_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Formato de fechas inválido. Usa formato ISO (AAAA-MM-DD).")

    if utc(end_dt) <= utc(start_dt):
        raise HTTPException(422, "El cierre debe ser posterior a la apertura.")
    if payload.modalidad not in {m["id"] for m in MODALIDADES}:
        raise HTTPException(422, "Modalidad no válida.")
    if any(not q.strip() or len(q) > 300 for q in payload.custom_questions):
        raise HTTPException(422, "Cada pregunta debe tener entre 1 y 300 caracteres.")
    call = ScholarshipCall(
        code=code,
        title=payload.title,
        modalidad=payload.modalidad,
        description=payload.description,
        min_gpa=payload.min_gpa,
        amount=payload.amount,
        slots=payload.slots,
        start_date=start_dt,
        end_date=end_dt,
        is_active=True,
        custom_questions=json.dumps(payload.custom_questions, ensure_ascii=False),
    )
    db.add(call)
    db.flush()

    audit_becas(
        db,
        user,
        f"Convocatoria creada: {code}",
        "ScholarshipCall",
        str(call.id),
        f"Título: {payload.title}, Monto: ${payload.amount}, Promedio mín: {payload.min_gpa}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {"id": call.id, "code": call.code, "message": "Convocatoria publicada con éxito."}


@router.get("/convocatorias/{call_id}")
def get_call(call_id: int, user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante", *REPORT, "tesoreria")
    c = db.get(ScholarshipCall, call_id)
    if not c:
        raise HTTPException(404, "Convocatoria no encontrada.")
    return {
        "id": c.id,
        "code": c.code,
        "title": c.title,
        "modalidad": c.modalidad,
        "description": c.description,
        "min_gpa": c.min_gpa,
        "amount": c.amount,
        "slots": c.slots,
        "start_date": c.start_date.isoformat(),
        "end_date": c.end_date.isoformat(),
        "is_active": c.is_active,
        "accepting": c.is_active and utc(c.start_date) <= now() <= utc(c.end_date),
        "custom_questions": json.loads(c.custom_questions or "[]"),
    }


# ---------------- SOLICITUDES ---------------- #

@router.get("/solicitudes")
def list_applications(
    modalidad: str | None = None,
    status: str | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", *REVIEW)
    stmt = select(ScholarshipApplication, ScholarshipCall, User).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).join(User, ScholarshipApplication.user_id == User.id)

    if user.role == "estudiante":
        stmt = stmt.where(ScholarshipApplication.user_id == user.id)
    else:
        if modalidad:
            stmt = stmt.where(ScholarshipCall.modalidad == modalidad)
        if status:
            stmt = stmt.where(ScholarshipApplication.status == status)

    stmt = stmt.order_by(desc(ScholarshipApplication.created_at))
    rows = db.execute(stmt).all()

    results = []
    for app, call, applicant in rows:
        results.append({
            "id": app.id,
            "folio": app.folio,
            "version": app.version,
            "call_id": call.id,
            "call_code": call.code,
            "call_title": call.title,
            "modalidad": call.modalidad,
            "amount": call.amount,
            "status": app.status,
            "gpa": app.gpa,
            "academic_term": app.academic_term,
            "major": app.major,
            "socioeconomic_score": app.socioeconomic_score,
            "committee_notes": app.committee_notes,
            "created_at": app.created_at.isoformat(),
            "applicant": {
                "id": applicant.id,
                "name": applicant.name,
                "email": applicant.email,
            },
        })
    return results


class CreateApplicationPayload(Payload):
    call_id: int
    gpa: float = PydField(ge=6.0, le=10.0)
    academic_term: str = PydField(min_length=2, max_length=50)
    major: str = PydField(min_length=3, max_length=150)
    custom_answers: dict[str, str] = PydField(default_factory=dict)


@router.post("/solicitudes")
def create_application(
    payload: CreateApplicationPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")
    call = db.scalar(select(ScholarshipCall).where(ScholarshipCall.id == payload.call_id).with_for_update())
    if not call or not call.is_active or not utc(call.start_date) <= now() <= utc(call.end_date):
        raise HTTPException(400, "La convocatoria seleccionada no está disponible o ha cerrado.")

    # Check if student already applied to this call
    existing = db.scalar(
        select(ScholarshipApplication).where(
            ScholarshipApplication.call_id == payload.call_id,
            ScholarshipApplication.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(409, "Ya cuentas con una solicitud registrada para esta convocatoria.")

    # Get socioeconomic score if available
    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == user.id))
    if not socio:
        raise HTTPException(409, "Guarda primero tu estudio socioeconómico.")
    questions = json.loads(call.custom_questions)
    if set(payload.custom_answers) != set(questions) or any(not isinstance(v, str) or not v.strip() or len(v) > 2000 for v in payload.custom_answers.values()):
        raise HTTPException(422, "Responde las preguntas de la convocatoria, sin añadir campos ajenos.")
    socio_score = socio.vulnerability_score

    app = ScholarshipApplication(
        call_id=call.id,
        user_id=user.id,
        status="recibida",
        gpa=payload.gpa,
        academic_term=payload.academic_term,
        major=payload.major,
        socioeconomic_score=socio_score,
        custom_answers=json.dumps(payload.custom_answers, ensure_ascii=False),
    )
    db.add(app)
    db.flush()

    app.folio = f"BEC-{now().year}-{app.id:06d}"

    # Auto notification
    db.add(
        Notification(
            user_id=user.id,
            message=f"Tu solicitud de beca {call.title} fue recibida exitosamente con folio {app.folio}.",
            target_path=f"/becas/solicitud/{app.id}",
        )
    )

    audit_becas(
        db,
        user,
        f"Solicitud registrada: {app.folio}",
        "ScholarshipApplication",
        str(app.id),
        f"Convocatoria: {call.code}, Promedio: {payload.gpa}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {"id": app.id, "folio": app.folio, "status": app.status, "message": "Solicitud registrada con éxito."}


@router.get("/solicitudes/{app_id}")
def get_application_detail(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", *REVIEW)
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    if user.role == "estudiante" and app.user_id != user.id:
        raise HTTPException(403, "No tienes permiso para consultar esta solicitud.")

    call = db.get(ScholarshipCall, app.call_id)
    applicant = db.get(User, app.user_id)
    docs = db.scalars(select(ScholarshipDocument).where(ScholarshipDocument.application_id == app.id)).all()
    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == app.user_id))

    return {
        "id": app.id,
        "folio": app.folio,
        "version": app.version,
        "status": app.status,
        "gpa": app.gpa,
        "academic_term": app.academic_term,
        "major": app.major,
        "socioeconomic_score": app.socioeconomic_score,
        "custom_answers": json.loads(app.custom_answers or "{}"),
        "committee_notes": app.committee_notes,
        "created_at": app.created_at.isoformat(),
        "call": {
            "id": call.id,
            "code": call.code,
            "title": call.title,
            "modalidad": call.modalidad,
            "min_gpa": call.min_gpa,
            "amount": call.amount,
        },
        "applicant": {
            "id": applicant.id,
            "name": applicant.name,
            "email": applicant.email,
            "profile": {k: v for k, v in json.loads(applicant.profile or "{}").items() if k in ("matricula", "carrera", "generacion")},
        },
        "socioeconomic": {
            "monthly_income": socio.monthly_income if socio else None,
            "monthly_expenses": socio.monthly_expenses if socio else None,
            "dependents_count": socio.dependents_count if socio else None,
            "housing_type": socio.housing_type if socio else None,
            "vulnerability_score": socio.vulnerability_score if socio else None,
        } if socio else None,
        "documents": [
            {
                "id": d.id,
                "kind": d.kind,
                "name": d.name,
                "size": d.size,
                "status": d.status,
                "note": d.note,
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ],
    }


class DictamenPayload(Payload):
    decision: str  # "aprobada", "rechazada", "revision"
    committee_notes: str = PydField(min_length=3, max_length=2000)
    version: int = PydField(ge=1)


@router.post("/solicitudes/{app_id}/dictamen")
def submit_dictamen(
    app_id: int,
    payload: DictamenPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *REVIEW)
    require_role(user, "evaluador", "administrador", "escolares")
    app = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.id == app_id).with_for_update())
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    if payload.decision not in ("aprobada", "rechazada", "revision"):
        raise HTTPException(400, "Decisión no válida. Usa 'aprobada', 'rechazada' o 'revision'.")

    if app.version != payload.version or app.status not in ("recibida", "revision"):
        raise HTTPException(409, "La solicitud cambió o ya tiene dictamen. Recarga el expediente.")
    call = db.scalar(select(ScholarshipCall).where(ScholarshipCall.id == app.call_id).with_for_update())
    if payload.decision == "aprobada":
        docs = db.scalars(select(ScholarshipDocument).where(ScholarshipDocument.application_id == app.id)).all()
        required = {d["id"] for d in DOCUMENTOS if d["required"]}
        if not required <= {d.kind for d in docs if d.status == "validado"}:
            raise HTTPException(409, "Valida los documentos requeridos antes de aprobar la beca.")
        if app.gpa < call.min_gpa:
            raise HTTPException(409, "El promedio no cumple el mínimo de la convocatoria.")
        occupied = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.call_id == call.id, ScholarshipApplication.status.in_(("aprobada", "renovada"))))
        if occupied >= call.slots:
            raise HTTPException(409, "Se alcanzó el cupo de esta convocatoria.")
    app.version += 1
    app.status = payload.decision
    app.committee_notes = payload.committee_notes
    app.updated_at = now()

    # Notificar al aspirante
    db.add(
        Notification(
            user_id=app.user_id,
            message=f"Tu solicitud {app.folio} ha sido actualizada a: {ESTADOS.get(app.status, app.status)}. Nota del comité: {payload.committee_notes}",
            target_path=f"/becas/solicitud/{app.id}",
        )
    )

    audit_becas(
        db,
        user,
        f"Dictamen emitido: {payload.decision.upper()}",
        "ScholarshipApplication",
        str(app.id),
        f"Folio: {app.folio}, Dictaminó: {user.name}, Comentario: {payload.committee_notes}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {"message": "Dictamen registrado con éxito.", "status": app.status}


@router.post("/solicitudes/{app_id}/evaluar-reglas")
def run_rules_evaluation(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *REVIEW)
    require_role(user, "evaluador", "administrador", "escolares")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    call = db.get(ScholarshipCall, app.call_id)

    evaluation = evaluate_applicant_rules(app.gpa, call.min_gpa)
    return {
        "folio": app.folio,
        "version": app.version,
        "gpa": app.gpa,
        "call_min_gpa": call.min_gpa,
        "meets_requirements": evaluation["meets_requirements"],
        "issues": evaluation["issues"],
        "recommended_action": "El promedio cumple. Revisa la documentación." if evaluation["meets_requirements"] else "El promedio no cumple el mínimo configurado.",
    }


# ---------------- DOCUMENTOS ---------------- #

@router.post("/solicitudes/{app_id}/documentos")
def upload_document(app_id: int, kind: str = Form(...), file: UploadFile = File(...), user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    app = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.id == app_id).with_for_update())
    if not app or app.user_id != user.id:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status not in ("recibida", "revision"):
        raise HTTPException(409, "El expediente está cerrado por el dictamen.")
    definition = next((d for d in DOCUMENTOS if d["id"] == kind), None)
    if not definition:
        raise HTTPException(422, "Tipo de documento no permitido.")
    old = db.scalar(select(ScholarshipDocument).where(ScholarshipDocument.application_id == app.id, ScholarshipDocument.kind == kind))
    if old and old.status == "validado":
        raise HTTPException(409, "Un documento validado no se puede sustituir.")
    content, mime, suffix, name = validated_upload(file, definition["formats"])
    stored = uid() + suffix
    path = DATA_DIR / "uploads" / stored
    previous = old.stored_name if old else None
    try:
        path.write_bytes(content)
        if not old:
            old = ScholarshipDocument(application_id=app.id, kind=kind)
            db.add(old)
        old.name, old.stored_name, old.mime, old.size = name, stored, mime, len(content)
        old.status, old.note, old.created_at = "recibido", "", now()
        app.version += 1
        app.updated_at = now()
        audit_becas(db, user, f"Documento adjuntado: {kind}", "ScholarshipApplication", app.id)
        save(db)
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise
    if previous:
        try:
            (DATA_DIR / "uploads" / previous).unlink(missing_ok=True)
        except OSError:
            pass
    return {"message": "Documento guardado.", "kind": kind, "filename": name}


@router.get("/solicitudes/{app_id}/documentos/{doc_id}")
def download_document(app_id: int, doc_id: str, user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante", *REVIEW)
    app = db.get(ScholarshipApplication, app_id)
    if not app or (user.role == "estudiante" and app.user_id != user.id):
        raise HTTPException(404, "Solicitud no encontrada.")
    doc = db.get(ScholarshipDocument, doc_id)
    if not doc or doc.application_id != app.id:
        raise HTTPException(404, "Documento no encontrado.")
    path = DATA_DIR / "uploads" / doc.stored_name
    if not path.is_file():
        raise HTTPException(404, "Archivo no disponible. Consulta al área responsable.")
    return FileResponse(path, filename=doc.name, media_type=doc.mime)


class DocumentReview(Payload):
    status: Literal["validado", "rechazado"]
    note: str = PydField(default="", max_length=2000)
    version: int = PydField(ge=1)


@router.post("/solicitudes/{app_id}/documentos/{doc_id}/revision")
def review_document(app_id: int, doc_id: str, payload: DocumentReview, user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, *REVIEW)
    app = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.id == app_id).with_for_update())
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.version != payload.version or app.status not in ("recibida", "revision"):
        raise HTTPException(409, "El expediente cambió o está cerrado. Recarga antes de revisar.")
    doc = db.get(ScholarshipDocument, doc_id)
    if not doc or doc.application_id != app.id:
        raise HTTPException(404, "Documento no encontrado.")
    if payload.status == "rechazado" and len(payload.note) < 3:
        raise HTTPException(422, "Explica qué debe corregir el estudiante.")
    doc.status, doc.note = payload.status, payload.note
    app.version += 1
    app.updated_at = now()
    audit_becas(db, user, f"Documento {payload.status}: {doc.kind}", "ScholarshipApplication", app.id)
    save(db)
    return {"version": app.version, "message": "Revisión guardada."}


# ---------------- ESTUDIO SOCIOECONÓMICO ---------------- #

@router.get("/socioeconomico")
def get_socioeconomic(
    user_id: str | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", *REVIEW)
    target_id = user.id
    if user_id and user_id != user.id:
        require_role(user, *REVIEW)
        if not db.scalar(select(ScholarshipApplication.id).where(ScholarshipApplication.user_id == user_id)):
            raise HTTPException(404, "Aspirante no encontrado.")
        target_id = user_id

    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == target_id))
    if not socio:
        return {
            "has_profile": False,
            "monthly_income": 0,
            "monthly_expenses": 0,
            "dependents_count": 1,
            "housing_type": "propia",
            "vulnerability_score": 50,
            "details": {},
        }

    return {
        "has_profile": True,
        "monthly_income": socio.monthly_income,
        "monthly_expenses": socio.monthly_expenses,
        "dependents_count": socio.dependents_count,
        "housing_type": socio.housing_type,
        "vulnerability_score": socio.vulnerability_score,
        "details": json.loads(socio.details or "{}"),
        "updated_at": socio.updated_at.isoformat(),
    }


class SocioeconomicPayload(Payload):
    monthly_income: Decimal = PydField(ge=0, max_digits=12, decimal_places=2)
    monthly_expenses: Decimal = PydField(ge=0, max_digits=12, decimal_places=2)
    dependents_count: int = PydField(ge=1, le=20)
    housing_type: Literal["propia", "rentada", "prestada", "otra"] = "propia"
    details: dict = {}


@router.post("/socioeconomico")
def save_socioeconomic(
    payload: SocioeconomicPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    score = calculate_vulnerability_score(
        monthly_income=payload.monthly_income,
        monthly_expenses=payload.monthly_expenses,
        dependents_count=payload.dependents_count,
        housing_type=payload.housing_type,
    )

    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == user.id))
    if socio:
        socio.monthly_income = payload.monthly_income
        socio.monthly_expenses = payload.monthly_expenses
        socio.dependents_count = payload.dependents_count
        socio.housing_type = payload.housing_type
        socio.vulnerability_score = score
        socio.details = json.dumps(payload.details, ensure_ascii=False)
        socio.updated_at = now()
    else:
        socio = ScholarshipSocioeconomic(
            user_id=user.id,
            monthly_income=payload.monthly_income,
            monthly_expenses=payload.monthly_expenses,
            dependents_count=payload.dependents_count,
            housing_type=payload.housing_type,
            vulnerability_score=score,
            details=json.dumps(payload.details, ensure_ascii=False),
        )
        db.add(socio)

    audit_becas(
        db,
        user,
        "Estudio socioeconómico actualizado",
        "ScholarshipSocioeconomic",
        user.id,
        f"Puntaje de vulnerabilidad: {score}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {
        "message": "Estudio socioeconómico guardado correctamente.",
        "vulnerability_score": score,
    }


# ---------------- ÓRDENES DE COBRO Y CALENDARIO ---------------- #

@router.get("/ordenes-cobro")
def list_payment_orders(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", *REPORT, "tesoreria")
    stmt = select(ScholarshipPaymentOrder, ScholarshipApplication, ScholarshipCall, User).join(
        ScholarshipApplication, ScholarshipPaymentOrder.application_id == ScholarshipApplication.id
    ).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).join(
        User, ScholarshipApplication.user_id == User.id
    )

    if user.role == "estudiante":
        stmt = stmt.where(ScholarshipApplication.user_id == user.id)

    stmt = stmt.order_by(desc(ScholarshipPaymentOrder.scheduled_date))
    rows = db.execute(stmt).all()

    return [
        {
            "id": order.id,
            "folio_orden": order.folio_orden,
            "application_folio": app.folio,
            "call_title": call.title,
            "student_name": student.name if user.role != "auditor" else "Identidad reservada",
            "amount": order.amount,
            "period": order.period,
            "scheduled_date": order.scheduled_date.isoformat(),
            "status": order.status,
            "reference": order.reference,
        }
        for order, app, call, student in rows
    ]


class GeneratePaymentOrderPayload(Payload):
    application_id: int
    period: str = PydField(min_length=2, max_length=50)
    scheduled_date: str


@router.post("/ordenes-cobro/generar")
def generate_payment_order(
    payload: GeneratePaymentOrderPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *FINANCE)
    app = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.id == payload.application_id).with_for_update())
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status not in ("aprobada", "renovada"):
        raise HTTPException(400, "Solo es posible generar órdenes de cobro para becas aprobadas.")

    call = db.get(ScholarshipCall, app.call_id)
    if db.scalar(select(ScholarshipPaymentOrder.id).where(ScholarshipPaymentOrder.application_id == app.id, ScholarshipPaymentOrder.period == payload.period)):
        raise HTTPException(409, "Ya existe una orden para esta beca y periodo.")
    folio_orden = f"ORD-{now().year}-{uid()[:12].upper()}"

    try:
        sched_dt = datetime.fromisoformat(payload.scheduled_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(422, "La fecha programada no es válida.")

    order = ScholarshipPaymentOrder(
        application_id=app.id,
        folio_orden=folio_orden,
        amount=call.amount,
        period=payload.period,
        scheduled_date=sched_dt,
        status="programada",
        reference="",
    )
    db.add(order)

    # Notificar estudiante
    db.add(
        Notification(
            user_id=app.user_id,
            message=f"Orden interna {folio_orden} programada. Consulta fecha e importe en Becas; no confirma un pago bancario.",
            target_path="/becas/ordenes-cobro",
        )
    )

    audit_becas(
        db,
        user,
        f"Orden de cobro generada: {folio_orden}",
        "ScholarshipPaymentOrder",
        str(app.id),
        f"Monto: ${call.amount:.2f}, Periodo: {payload.period}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {"message": "Orden de cobro generada con éxito.", "folio_orden": folio_orden}


# ---------------- RENOVACIONES ---------------- #

@router.get("/renovaciones")
def list_renewals(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", *REVIEW)
    stmt = select(ScholarshipRenewal, ScholarshipApplication, ScholarshipCall, User).join(
        ScholarshipApplication, ScholarshipRenewal.original_application_id == ScholarshipApplication.id
    ).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).join(
        User, ScholarshipRenewal.user_id == User.id
    )

    if user.role == "estudiante":
        stmt = stmt.where(ScholarshipRenewal.user_id == user.id)

    stmt = stmt.order_by(desc(ScholarshipRenewal.created_at))
    rows = db.execute(stmt).all()

    return [
        {
            "id": r.id,
            "application_folio": app.folio,
            "call_title": call.title,
            "student_name": student.name if user.role != "auditor" else "Identidad reservada",
            "current_gpa": r.current_gpa,
            "academic_term": r.academic_term,
            "status": r.status,
            "notes": r.notes,
            "created_at": r.created_at.isoformat(),
        }
        for r, app, call, student in rows
    ]


class CreateRenewalPayload(Payload):
    original_application_id: int
    current_gpa: float = PydField(ge=6.0, le=10.0)
    academic_term: str = PydField(min_length=2, max_length=50)
    notes: str = PydField(default="", max_length=2000)


@router.post("/renovaciones")
def request_renewal(
    payload: CreateRenewalPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")
    app = db.get(ScholarshipApplication, payload.original_application_id)
    if not app or app.user_id != user.id:
        raise HTTPException(404, "Solicitud original no encontrada.")

    if app.status not in ("aprobada", "renovada"):
        raise HTTPException(400, "Solo becas aprobadas previamente pueden solicitar renovación.")

    renewal = ScholarshipRenewal(
        original_application_id=app.id,
        user_id=user.id,
        current_gpa=payload.current_gpa,
        academic_term=payload.academic_term,
        status="solicitada",
        notes=payload.notes,
    )
    db.add(renewal)

    audit_becas(
        db,
        user,
        f"Solicitud de renovación para {app.folio}",
        "ScholarshipRenewal",
        str(app.id),
        f"Promedio: {payload.current_gpa}, Periodo: {payload.academic_term}",
        request.client.host if request.client else "127.0.0.1",
    )
    save(db)

    return {"message": "Solicitud de renovación enviada con éxito.", "status": "solicitada"}


# ---------------- DASHBOARD, REPORTES Y AUDITORÍA ---------------- #

@router.get("/estadisticas")
def get_dashboard_stats(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *REPORT)
    total_apps = db.scalar(select(func.count(ScholarshipApplication.id))) or 0
    approved_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status.in_(("aprobada", "renovada")))) or 0
    in_review_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "revision")) or 0
    rejected_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "rechazada")) or 0
    received_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "recibida")) or 0

    # Total committed funds from approved scholarships
    stmt_funds = select(func.sum(ScholarshipCall.amount)).select_from(ScholarshipApplication).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).where(ScholarshipApplication.status.in_(("aprobada", "renovada")))
    total_committed_funds = db.scalar(stmt_funds) or 0.0

    # Applications by modality
    stmt_mod = select(ScholarshipCall.modalidad, func.count(ScholarshipApplication.id)).select_from(ScholarshipApplication).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).group_by(ScholarshipCall.modalidad)
    by_modality = {mod: count for mod, count in db.execute(stmt_mod).all()}

    # Average GPA
    avg_gpa = db.scalar(select(func.avg(ScholarshipApplication.gpa))) or 0.0

    return {
        "total_applications": total_apps,
        "approved": approved_apps,
        "in_review": in_review_apps,
        "rejected": rejected_apps,
        "received": received_apps,
        "approval_rate": round((approved_apps / total_apps * 100), 1) if total_apps > 0 else 0.0,
        "total_committed_funds": float(total_committed_funds),
        "by_modality": by_modality,
        "average_gpa": round(float(avg_gpa), 2),
    }


@router.get("/reportes/export")
def export_scholarships_csv(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, *REPORT)
    require_role(user, "administrador", "evaluador", "auditor", "escolares", "tesoreria")
    stmt = select(ScholarshipApplication, ScholarshipCall, User).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).join(User, ScholarshipApplication.user_id == User.id).order_by(desc(ScholarshipApplication.created_at))

    rows = db.execute(stmt).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Folio", "Convocatoria", "Estado", "Monto MXN", "Periodo académico"])
    def safe(value):
        text = str(value if value is not None else "")
        return "'" + text if text.lstrip().startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")) else text
    for app, call, student in rows:
        writer.writerow([safe(v) for v in (app.folio, call.code, ESTADOS.get(app.status, app.status), call.amount, app.academic_term)])

    csv_data = output.getvalue()
    filename = f"reporte_becas_uto_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/auditoria")
def get_audit_logs(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador", "auditor", "escolares")
    stmt = select(ScholarshipAuditLog, User).join(
        User, ScholarshipAuditLog.user_id == User.id
    ).order_by(desc(ScholarshipAuditLog.created_at)).limit(100)

    rows = db.execute(stmt).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "user_name": user_actor.name,
            "user_email": user_actor.email,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log, user_actor in rows
    ]


@router.get("/beneficiarios")
def list_beneficiaries(user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, *FINANCE)
    stmt = select(ScholarshipApplication, User).join(User, ScholarshipApplication.user_id == User.id).where(ScholarshipApplication.status.in_(("aprobada", "renovada")))
    return [{"id": a.id, "folio": a.folio, "student_name": u.name} for a, u in db.execute(stmt)]


class RenewalDecision(Payload):
    decision: Literal["aprobada", "rechazada"]
    note: str = PydField(min_length=3, max_length=2000)


@router.post("/renovaciones/{renewal_id}/dictamen")
def decide_renewal(renewal_id: int, payload: RenewalDecision, user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, *REVIEW)
    renewal = db.scalar(select(ScholarshipRenewal).where(ScholarshipRenewal.id == renewal_id).with_for_update())
    if not renewal or renewal.status != "solicitada":
        raise HTTPException(409, "La renovación no existe o ya fue revisada.")
    app = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.id == renewal.original_application_id).with_for_update())
    call = db.get(ScholarshipCall, app.call_id)
    if payload.decision == "aprobada" and renewal.current_gpa < call.min_gpa:
        raise HTTPException(409, "El promedio no cumple el mínimo de la convocatoria original.")
    renewal.status, renewal.notes = payload.decision, payload.note
    if payload.decision == "aprobada":
        app.status = "renovada"
        app.version += 1
        app.updated_at = now()
    audit_becas(db, user, f"Renovación {payload.decision}", "ScholarshipRenewal", renewal.id)
    db.add(Notification(user_id=app.user_id, message=f"Renovación de {app.folio}: {payload.decision}. Consulta la observación en Becas.", target_path="/becas/renovacion"))
    save(db)
    return {"status": renewal.status}
