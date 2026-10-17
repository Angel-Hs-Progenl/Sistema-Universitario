import csv
import io
import json
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field as PydField
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

router = APIRouter(prefix="/api/v1/becas", tags=["Becas"])


def audit_becas(db: Session, user: User, action: str, target_type: str, target_id: str, details: str = "", ip: str = "127.0.0.1"):
    db.add(
        ScholarshipAuditLog(
            user_id=user.id,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            details=details,
            ip_address=ip,
        )
    )


# ---------------- CONVOCATORIAS ---------------- #

@router.get("/convocatorias")
def list_calls(db: Session = Depends(get_db)):
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
            "custom_questions": json.loads(c.custom_questions or "[]"),
            "created_at": c.created_at.isoformat(),
        }
        for c in calls
    ]


class CreateCallPayload(BaseModel):
    title: str = PydField(min_length=3, max_length=150)
    modalidad: str = PydField(min_length=3, max_length=30)
    description: str = PydField(min_length=10)
    min_gpa: float = PydField(ge=6.0, le=10.0)
    amount: float = PydField(gt=0)
    slots: int = PydField(gt=0)
    start_date: str
    end_date: str
    custom_questions: list = []


@router.post("/convocatorias")
def create_call(
    payload: CreateCallPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador", "evaluador", "escolares")
    count = db.scalar(select(func.count(ScholarshipCall.id))) or 0
    code = f"BECA-2026-I-{payload.modalidad[:4].upper()}-{count + 1:03d}"

    try:
        start_dt = datetime.fromisoformat(payload.start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(payload.end_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Formato de fechas inválido. Usa formato ISO (AAAA-MM-DD).")

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
    db.commit()

    return {"id": call.id, "code": call.code, "message": "Convocatoria publicada con éxito."}


@router.get("/convocatorias/{call_id}")
def get_call(call_id: int, db: Session = Depends(get_db)):
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


class CreateApplicationPayload(BaseModel):
    call_id: int
    gpa: float = PydField(ge=6.0, le=10.0)
    academic_term: str = PydField(min_length=2, max_length=50)
    major: str = PydField(min_length=3, max_length=150)
    custom_answers: dict = {}


@router.post("/solicitudes")
def create_application(
    payload: CreateApplicationPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    call = db.get(ScholarshipCall, payload.call_id)
    if not call or not call.is_active:
        raise HTTPException(400, "La convocatoria seleccionada no está disponible o ha cerrado.")

    # Check if student already applied to this call
    existing = db.scalar(
        select(ScholarshipApplication).where(
            ScholarshipApplication.call_id == payload.call_id,
            ScholarshipApplication.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(400, "Ya cuentas con una solicitud registrada para esta convocatoria.")

    # Get socioeconomic score if available
    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == user.id))
    socio_score = socio.vulnerability_score if socio else 50.0

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

    app.folio = f"BEC-2026-{app.id:06d}"

    # Auto notification
    db.add(
        Notification(
            user_id=user.id,
            message=f"Tu solicitud de beca {call.title} fue recibida exitosamente con folio {app.folio}.",
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
    db.commit()

    return {"id": app.id, "folio": app.folio, "status": app.status, "message": "Solicitud registrada con éxito."}


@router.get("/solicitudes/{app_id}")
def get_application_detail(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
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
            "profile": json.loads(applicant.profile or "{}"),
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


class DictamenPayload(BaseModel):
    decision: str  # "aprobada", "rechazada", "revision"
    committee_notes: str = PydField(min_length=3)
    score: float | None = None


@router.post("/solicitudes/{app_id}/dictamen")
def submit_dictamen(
    app_id: int,
    payload: DictamenPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "evaluador", "administrador", "escolares")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    if payload.decision not in ("aprobada", "rechazada", "revision"):
        raise HTTPException(400, "Decisión no válida. Usa 'aprobada', 'rechazada' o 'revision'.")

    app.status = payload.decision
    app.committee_notes = payload.committee_notes
    if payload.score is not None:
        app.socioeconomic_score = payload.score
    app.updated_at = now()

    # Notificar al aspirante
    db.add(
        Notification(
            user_id=app.user_id,
            message=f"Tu solicitud {app.folio} ha sido actualizada a: {ESTADOS.get(app.status, app.status)}. Nota del comité: {payload.committee_notes}",
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
    db.commit()

    return {"message": "Dictamen registrado con éxito.", "status": app.status}


@router.post("/solicitudes/{app_id}/evaluar-reglas")
def run_rules_evaluation(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "evaluador", "administrador", "escolares")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    call = db.get(ScholarshipCall, app.call_id)

    evaluation = evaluate_applicant_rules(app.gpa, call.min_gpa)
    return {
        "folio": app.folio,
        "gpa": app.gpa,
        "call_min_gpa": call.min_gpa,
        "meets_requirements": evaluation["meets_requirements"],
        "issues": evaluation["issues"],
        "recommended_action": "Aprobación recomendada" if evaluation["meets_requirements"] else "Descarte por requisitos no cubiertos",
    }


# ---------------- DOCUMENTOS ---------------- #

@router.post("/solicitudes/{app_id}/documentos")
async def upload_document(
    app_id: int,
    kind: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if user.role == "estudiante" and app.user_id != user.id:
        raise HTTPException(403, "No puedes subir documentos a esta solicitud.")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "El archivo supera el límite de 5 MB.")

    allowed_mimes = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_mimes:
        raise HTTPException(400, "Formato no permitido. Solo se aceptan PDF y JPG/PNG.")

    stored_name = f"{uid()}{Path(file.filename).suffix.lower()}"
    upload_path = DATA_DIR / "uploads" / stored_name
    upload_path.write_bytes(content)

    existing = db.scalar(
        select(ScholarshipDocument).where(
            ScholarshipDocument.application_id == app.id,
            ScholarshipDocument.kind == kind,
        )
    )
    if existing:
        existing.name = file.filename
        existing.stored_name = stored_name
        existing.mime = file.content_type
        existing.size = len(content)
        existing.status = "recibido"
        existing.created_at = now()
    else:
        doc = ScholarshipDocument(
            application_id=app.id,
            kind=kind,
            name=file.filename,
            stored_name=stored_name,
            mime=file.content_type,
            size=len(content),
            status="recibido",
        )
        db.add(doc)

    db.commit()
    return {"message": "Documento recibido con éxito.", "kind": kind, "filename": file.filename}


@router.get("/solicitudes/{app_id}/documentos/{doc_id}")
def download_document(
    app_id: int,
    doc_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if user.role == "estudiante" and app.user_id != user.id:
        raise HTTPException(403, "No tienes permiso para descargar este documento.")

    doc = db.get(ScholarshipDocument, doc_id)
    if not doc or doc.application_id != app.id:
        raise HTTPException(404, "Documento no encontrado.")

    file_path = DATA_DIR / "uploads" / doc.stored_name
    if not file_path.exists():
        raise HTTPException(404, "El archivo no se encuentra en el servidor.")

    return FileResponse(file_path, filename=doc.name, media_type=doc.mime)


# ---------------- ESTUDIO SOCIOECONÓMICO ---------------- #

@router.get("/socioeconomico")
def get_socioeconomic(
    user_id: str | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    target_id = user.id
    if user_id and user.role != "estudiante":
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


class SocioeconomicPayload(BaseModel):
    monthly_income: float = PydField(ge=0)
    monthly_expenses: float = PydField(ge=0)
    dependents_count: int = PydField(ge=1, le=20)
    housing_type: str = PydField(default="propia")
    details: dict = {}


@router.post("/socioeconomico")
def save_socioeconomic(
    payload: SocioeconomicPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
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
    db.commit()

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
            "student_name": student.name,
            "amount": order.amount,
            "period": order.period,
            "scheduled_date": order.scheduled_date.isoformat(),
            "status": order.status,
            "reference": order.reference,
        }
        for order, app, call, student in rows
    ]


class GeneratePaymentOrderPayload(BaseModel):
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
    require_role(user, "administrador", "evaluador", "tesoreria", "escolares")
    app = db.get(ScholarshipApplication, payload.application_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status != "aprobada":
        raise HTTPException(400, "Solo es posible generar órdenes de cobro para becas aprobadas.")

    call = db.get(ScholarshipCall, app.call_id)
    count = db.scalar(select(func.count(ScholarshipPaymentOrder.id))) or 0
    folio_orden = f"ORD-BEC-2026-{count + 1:04d}"

    try:
        sched_dt = datetime.fromisoformat(payload.scheduled_date.replace("Z", "+00:00"))
    except ValueError:
        sched_dt = now()

    order = ScholarshipPaymentOrder(
        application_id=app.id,
        folio_orden=folio_orden,
        amount=call.amount,
        period=payload.period,
        scheduled_date=sched_dt,
        status="programada",
        reference=f"UTO-SPEI-{app.id:04d}-{count + 1:04d}",
    )
    db.add(order)

    # Notificar estudiante
    db.add(
        Notification(
            user_id=app.user_id,
            message=f"Se programó una orden de pago ({folio_orden}) por ${call.amount:.2f} para tu beca.",
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
    db.commit()

    return {"message": "Orden de cobro generada con éxito.", "folio_orden": folio_orden}


# ---------------- RENOVACIONES ---------------- #

@router.get("/renovaciones")
def list_renewals(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
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
            "student_name": student.name,
            "current_gpa": r.current_gpa,
            "academic_term": r.academic_term,
            "status": r.status,
            "notes": r.notes,
            "created_at": r.created_at.isoformat(),
        }
        for r, app, call, student in rows
    ]


class CreateRenewalPayload(BaseModel):
    original_application_id: int
    current_gpa: float = PydField(ge=6.0, le=10.0)
    academic_term: str = PydField(min_length=2, max_length=50)
    notes: str = ""


@router.post("/renovaciones")
def request_renewal(
    payload: CreateRenewalPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
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
    db.commit()

    return {"message": "Solicitud de renovación enviada con éxito.", "status": "solicitada"}


# ---------------- DASHBOARD, REPORTES Y AUDITORÍA ---------------- #

@router.get("/estadisticas")
def get_dashboard_stats(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    total_apps = db.scalar(select(func.count(ScholarshipApplication.id))) or 0
    approved_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "aprobada")) or 0
    in_review_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "revision")) or 0
    rejected_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "rechazada")) or 0
    received_apps = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.status == "recibida")) or 0

    # Total committed funds from approved scholarships
    stmt_funds = select(func.sum(ScholarshipCall.amount)).select_from(ScholarshipApplication).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).where(ScholarshipApplication.status == "aprobada")
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
        "completion_progress_percent": 55,  # Avance fase 1 institucional
    }


@router.get("/reportes/export")
def export_scholarships_csv(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador", "evaluador", "auditor", "escolares", "tesoreria")
    stmt = select(ScholarshipApplication, ScholarshipCall, User).join(
        ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id
    ).join(User, ScholarshipApplication.user_id == User.id).order_by(desc(ScholarshipApplication.created_at))

    rows = db.execute(stmt).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Folio",
        "Convocatoria",
        "Modalidad",
        "Matricula",
        "Estudiante",
        "Carrera",
        "Cuatrimestre",
        "Promedio",
        "Puntaje_Vulnerabilidad",
        "Monto_Beca",
        "Estado",
        "Fecha_Registro",
    ])

    for app, call, student in rows:
        profile = json.loads(student.profile or "{}")
        writer.writerow([
            app.folio,
            call.code,
            call.modalidad,
            profile.get("matricula", "N/A"),
            student.name,
            app.major,
            app.academic_term,
            app.gpa,
            app.socioeconomic_score,
            call.amount,
            ESTADOS.get(app.status, app.status),
            app.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

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
