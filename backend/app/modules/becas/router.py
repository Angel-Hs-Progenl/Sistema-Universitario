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
    VALIDATION_ESTADOS,
    RENEWAL_ESTADOS,
    BANCOS_MEXICO,
    calculate_vulnerability_score,
    evaluate_applicant_rules,
    validate_clabe,
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
            "discount_percentage": app.discount_percentage,
            "student_percentage": app.student_percentage,
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
        "discount_percentage": app.discount_percentage,
        "student_percentage": app.student_percentage,
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
            "validation_status": socio.validation_status if socio else "pendiente",
            "validation_notes": socio.validation_notes if socio else "",
            "verified_score": socio.verified_score if socio else None,
        } if socio else None,
        "bank_name": app.bank_name,
        "bank_clabe": app.bank_clabe,
        "bank_account_holder": app.bank_account_holder,
        "dictamen_session": app.dictamen_session,
        "dictamen_agreement": app.dictamen_agreement,
        "dictamen_date": app.dictamen_date.isoformat() if app.dictamen_date else None,
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
    discount_percentage: float | None = None
    student_percentage: float | None = None


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

    # Asignación de porcentaje de beca / porcentaje a pagar por el estudiante
    if payload.decision == "aprobada":
        if payload.student_percentage is not None:
            app.student_percentage = float(payload.student_percentage)
            app.discount_percentage = round(100.0 - app.student_percentage, 1)
        elif payload.discount_percentage is not None:
            app.discount_percentage = float(payload.discount_percentage)
            app.student_percentage = round(100.0 - app.discount_percentage, 1)
        else:
            # Por defecto 50% de beca / 50% de pago
            app.discount_percentage = 50.0
            app.student_percentage = 50.0

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
        "validation_status": socio.validation_status,
        "validation_notes": socio.validation_notes,
        "verified_score": socio.verified_score,
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
            "cuota_base": order.cuota_base or (order.amount if not order.student_percentage else round(order.amount / (order.student_percentage / 100.0), 2)),
            "discount_percentage": order.discount_percentage or (100.0 - (order.student_percentage or 50.0)),
            "student_percentage": order.student_percentage or (app.student_percentage or 50.0),
            "period": order.period,
            "scheduled_date": order.scheduled_date.isoformat(),
            "status": order.status,
            "reference": order.reference,
            "puebla_reference": order.puebla_reference or order.reference,
            "puebla_url": order.puebla_url or "https://pagosenlinea.puebla.gob.mx/",
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "bank_name": order.bank_name or app.bank_name,
            "bank_clabe": order.bank_clabe or app.bank_clabe,
            "batch_folio": order.batch_folio,
            "dispersed_at": order.dispersed_at.isoformat() if order.dispersed_at else None,
        }
        for order, app, call, student in rows
    ]


class GeneratePaymentOrderPayload(BaseModel):
    application_id: int
    period: str = PydField(min_length=2, max_length=50)
    scheduled_date: str
    cuota_base: float = 1850.0
    student_percentage: float | None = None


@router.post("/ordenes-cobro/generar")
def generate_payment_order(
    payload: GeneratePaymentOrderPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería emite la orden de pago con línea de captura de Pagos en Línea del Gobierno de Puebla."""
    require_role(user, "tesoreria", "administrador", "evaluador", "escolares")
    app = db.get(ScholarshipApplication, payload.application_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status != "aprobada":
        raise HTTPException(400, "Solo es posible generar órdenes de cobro para becas aprobadas.")

    call = db.get(ScholarshipCall, app.call_id)
    count = db.scalar(select(func.count(ScholarshipPaymentOrder.id))) or 0
    folio_orden = f"ORD-PUE-UTO-{count + 1:04d}"

    try:
        sched_dt = datetime.fromisoformat(payload.scheduled_date.replace("Z", "+00:00"))
    except ValueError:
        sched_dt = now()

    # Cálculo porcentual institucional según dictamen
    pct_pago = payload.student_percentage if payload.student_percentage is not None else (app.student_percentage or 50.0)
    pct_beca = round(100.0 - pct_pago, 1)
    cuota_base = float(payload.cuota_base or 1850.0)
    monto_a_pagar = round(cuota_base * (pct_pago / 100.0), 2)

    # Línea de captura institucional para Pagos en Línea del Gobierno de Puebla
    puebla_ref = f"PUE-UTO-2026-{app.id:04d}-{count + 1:04d}"
    puebla_url = "https://pagosenlinea.puebla.gob.mx/"

    order = ScholarshipPaymentOrder(
        application_id=app.id,
        folio_orden=folio_orden,
        amount=monto_a_pagar,
        cuota_base=cuota_base,
        discount_percentage=pct_beca,
        student_percentage=pct_pago,
        period=payload.period,
        scheduled_date=sched_dt,
        status="programada",
        reference=puebla_ref,
        puebla_reference=puebla_ref,
        puebla_url=puebla_url,
        bank_name=app.bank_name,
        bank_clabe=app.bank_clabe,
    )
    db.add(order)

    # Notificar estudiante con datos del Gobierno de Puebla
    db.add(
        Notification(
            user_id=app.user_id,
            message=(
                f"Tesorería emitió tu orden de pago ({folio_orden}) por ${monto_a_pagar:,.2f} MXN "
                f"(cubres el {pct_pago:.1f}% con beca del {pct_beca:.1f}%). "
                f"Realiza tu pago en Pagos en Línea del Gobierno de Puebla con la referencia: {puebla_ref}."
            ),
        )
    )

    audit_becas(
        db,
        user,
        f"Orden de pago emitida por Tesorería: {folio_orden}",
        "ScholarshipPaymentOrder",
        str(app.id),
        f"Monto: ${monto_a_pagar:,.2f} (% a pagar: {pct_pago}%), Referencia Puebla: {puebla_ref}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {
        "message": "Orden de pago emitida con éxito.",
        "folio_orden": folio_orden,
        "amount": monto_a_pagar,
        "student_percentage": pct_pago,
        "discount_percentage": pct_beca,
        "puebla_reference": puebla_ref,
        "puebla_url": puebla_url,
    }


@router.post("/ordenes-cobro/{order_id}/confirmar-pago")
def confirm_puebla_payment(
    order_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería valida que el alumno liquidó la orden a través de Pagos en Línea del Gobierno de Puebla."""
    require_role(user, "tesoreria", "administrador")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de pago no encontrada.")

    order.status = "pagada"
    order.paid_at = now()

    app = db.get(ScholarshipApplication, order.application_id)
    if app:
        db.add(
            Notification(
                user_id=app.user_id,
                message=f"Tesorería validó tu pago ({order.folio_orden}). Tu reinscripción y beca están formalmente confirmadas.",
            )
        )

    audit_becas(
        db,
        user,
        f"Pago validado por Tesorería: {order.folio_orden}",
        "ScholarshipPaymentOrder",
        str(order.id),
        f"Referencia Gob. Puebla: {order.puebla_reference}, Monto pagado: ${order.amount:,.2f}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Pago validado por Tesorería correctamente.", "status": order.status}


class DisperseOrderPayload(BaseModel):
    batch_folio: str = PydField(min_length=3, max_length=50)


@router.post("/ordenes-cobro/{order_id}/dispersar")
def disperse_payment_order(
    order_id: int,
    payload: DisperseOrderPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería o Administrador registra la dispersión bancaria SPEI para una orden de cobro."""
    require_role(user, "administrador", "tesoreria")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de cobro no encontrada.")

    app = db.get(ScholarshipApplication, order.application_id)
    order.status = "dispersada"
    order.batch_folio = payload.batch_folio
    order.dispersed_at = now()
    if app and not order.bank_clabe:
        order.bank_name = app.bank_name
        order.bank_clabe = app.bank_clabe

    if app:
        db.add(
            Notification(
                user_id=app.user_id,
                message=f"Tu orden de pago {order.folio_orden} ha sido dispersada exitosamente vía SPEI (Lote {payload.batch_folio}).",
            )
        )

    audit_becas(
        db,
        user,
        f"Orden de cobro dispersada: {order.folio_orden}",
        "ScholarshipPaymentOrder",
        str(order.id),
        f"Lote SPEI: {payload.batch_folio}, Monto: ${order.amount:.2f}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {
        "message": "Dispersión registrada con éxito.",
        "folio_orden": order.folio_orden,
        "batch_folio": order.batch_folio,
        "dispersed_at": order.dispersed_at.isoformat(),
    }


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
        "completion_progress_percent": 85,  # Avance fase 2 extendida (85%)
    }


@router.get("/padron-beneficiarios")
def get_beneficiaries_padron(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Devuelve el padrón oficial de beneficiarios con estatus bancario y montos para auditoría."""
    stmt = (
        select(ScholarshipApplication, ScholarshipCall, User)
        .join(ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id)
        .join(User, ScholarshipApplication.user_id == User.id)
        .where(ScholarshipApplication.status.in_(("aprobada", "renovada")))
        .order_by(desc(ScholarshipApplication.updated_at))
    )
    rows = db.execute(stmt).all()
    results = []
    for app, call, applicant in rows:
        results.append({
            "id": app.id,
            "folio": app.folio,
            "student_name": applicant.name,
            "student_email": applicant.email,
            "major": app.major,
            "academic_term": app.academic_term,
            "gpa": app.gpa,
            "call_code": call.code,
            "call_title": call.title,
            "modalidad": call.modalidad,
            "amount": call.amount,
            "status": app.status,
            "has_bank_clabe": bool(app.bank_clabe),
            "bank_name": app.bank_name or "Pendiente de captura",
            "clabe_masked": f"***{app.bank_clabe[-4:]}" if app.bank_clabe else "Sin CLABE",
            "dictamen_session": app.dictamen_session or "Sesión ordinaria",
            "dictamen_date": app.dictamen_date.isoformat() if app.dictamen_date else None,
        })
    return results


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


# ---------------- DATOS BANCARIOS (CLABE) ---------------- #

class BankDataPayload(BaseModel):
    bank_name: str = PydField(min_length=2, max_length=50)
    bank_clabe: str = PydField(min_length=18, max_length=18)
    bank_account_holder: str = PydField(min_length=3, max_length=150)


@router.put("/solicitudes/{app_id}/datos-bancarios")
def update_bank_data(
    app_id: int,
    payload: BankDataPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Registra o actualiza los datos bancarios (CLABE) de un aspirante para su beca."""
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if user.role == "estudiante" and app.user_id != user.id:
        raise HTTPException(403, "No puedes modificar esta solicitud.")

    clabe_check = validate_clabe(payload.bank_clabe)
    if not clabe_check["valid"]:
        raise HTTPException(400, clabe_check["error"])

    app.bank_name = payload.bank_name
    app.bank_clabe = payload.bank_clabe
    app.bank_account_holder = payload.bank_account_holder
    app.updated_at = now()

    audit_becas(
        db,
        user,
        f"Datos bancarios actualizados para {app.folio}",
        "ScholarshipApplication",
        str(app.id),
        f"Banco: {payload.bank_name}, CLABE: ***{payload.bank_clabe[-4:]}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {
        "message": "Datos bancarios registrados correctamente.",
        "bank_name": clabe_check.get("bank_name", payload.bank_name),
        "bank_code": clabe_check.get("bank_code"),
    }


@router.get("/bancos")
def list_banks():
    """Catálogo de bancos registrados en México (STP/SPEI)."""
    return BANCOS_MEXICO


# ---------------- VALIDACIÓN SOCIOECONÓMICA (TRABAJO SOCIAL) ---------------- #

class ValidateSocioPayload(BaseModel):
    user_id: str
    validation_status: str  # "validado" o "observado"
    validation_notes: str = ""
    verified_score: float | None = None


@router.post("/socioeconomico/validar")
def validate_socioeconomic(
    payload: ValidateSocioPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Personal de Trabajo Social o Evaluador valida el perfil socioeconómico de un estudiante."""
    require_role(user, "administrador", "evaluador", "escolares")
    socio = db.scalar(
        select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == payload.user_id)
    )
    if not socio:
        raise HTTPException(404, "Estudio socioeconómico no encontrado para este usuario.")

    if payload.validation_status not in ("validado", "observado"):
        raise HTTPException(400, "Estado de validación no válido. Usa 'validado' u 'observado'.")

    socio.validation_status = payload.validation_status
    socio.verified_by_user_id = user.id
    socio.validation_notes = payload.validation_notes
    if payload.verified_score is not None:
        socio.verified_score = float(payload.verified_score)
    socio.updated_at = now()

    target_user = db.get(User, payload.user_id)
    if target_user:
        status_label = VALIDATION_ESTADOS.get(payload.validation_status, payload.validation_status)
        db.add(
            Notification(
                user_id=payload.user_id,
                message=(
                    f"Tu estudio socioeconómico ha sido {status_label.lower()}. "
                    + (payload.validation_notes or "")
                ).strip(),
            )
        )

    audit_becas(
        db,
        user,
        f"Validación socioeconómica: {payload.validation_status}",
        "ScholarshipSocioeconomic",
        payload.user_id,
        f"Notas: {payload.validation_notes}, Score verificado: {payload.verified_score}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Validación registrada.", "validation_status": socio.validation_status}


# ---------------- RESOLUCIÓN DE RENOVACIONES (PERSONAL) ---------------- #

class ResolveRenewalPayload(BaseModel):
    decision: str  # "aprobada_renovacion" | "rechazada_renovacion"
    resolution_notes: str = PydField(min_length=3)


@router.post("/renovaciones/{renewal_id}/resolver")
def resolve_renewal(
    renewal_id: int,
    payload: ResolveRenewalPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Personal de becas resuelve (aprueba o rechaza) una solicitud de renovación de beca."""
    require_role(user, "administrador", "evaluador", "escolares")
    renewal = db.get(ScholarshipRenewal, renewal_id)
    if not renewal:
        raise HTTPException(404, "Solicitud de renovación no encontrada.")

    if payload.decision not in ("aprobada_renovacion", "rechazada_renovacion"):
        raise HTTPException(400, "Decisión no válida. Usa 'aprobada_renovacion' o 'rechazada_renovacion'.")

    renewal.status = payload.decision
    renewal.reviewed_by_user_id = user.id
    renewal.reviewed_at = now()
    renewal.resolution_notes = payload.resolution_notes

    # Si se aprueba, actualizar la solicitud original
    if payload.decision == "aprobada_renovacion":
        original_app = db.get(ScholarshipApplication, renewal.original_application_id)
        if original_app:
            original_app.status = "renovada"
            original_app.updated_at = now()

    decision_label = RENEWAL_ESTADOS.get(payload.decision, payload.decision)
    db.add(
        Notification(
            user_id=renewal.user_id,
            message=f"Tu solicitud de renovación fue {decision_label.lower()}. {payload.resolution_notes}",
        )
    )

    audit_becas(
        db,
        user,
        f"Renovación resuelta: {payload.decision}",
        "ScholarshipRenewal",
        str(renewal.id),
        f"Decisión: {payload.decision}, Notas: {payload.resolution_notes}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Renovación resuelta con éxito.", "status": renewal.status}


# ---------------- ACTA DE DICTAMEN FORMAL ---------------- #

class DictamenFormalPayload(BaseModel):
    dictamen_session: str = PydField(min_length=2, max_length=50)
    dictamen_agreement: str = PydField(min_length=2, max_length=50)
    dictamen_date: str


@router.post("/solicitudes/{app_id}/dictamen-formal")
def save_formal_dictamen(
    app_id: int,
    payload: DictamenFormalPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Registra los datos del acta formal de la sesión de dictaminación (sesión, acuerdo y fecha)."""
    require_role(user, "administrador", "evaluador", "escolares")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    try:
        dict_dt = datetime.fromisoformat(payload.dictamen_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido. Usa formato ISO (AAAA-MM-DD).")

    app.dictamen_session = payload.dictamen_session
    app.dictamen_agreement = payload.dictamen_agreement
    app.dictamen_date = dict_dt
    app.updated_at = now()

    audit_becas(
        db,
        user,
        f"Acta de dictamen formal registrada: Sesión {payload.dictamen_session}",
        "ScholarshipApplication",
        str(app.id),
        f"Acuerdo: {payload.dictamen_agreement}, Fecha sesión: {payload.dictamen_date}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {
        "message": "Datos del acta de dictamen formal registrados.",
        "session": payload.dictamen_session,
        "agreement": payload.dictamen_agreement,
    }
