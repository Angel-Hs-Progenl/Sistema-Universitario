import csv
import io
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Literal
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
    CARRERAS_UTO,
    NIVELES_ESTUDIO,
    CUATRIMESTRES_DEFAULT,
    SISTEMAS_ESTUDIO,
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
from .pdf import render_anexo1_pdf

router = APIRouter(prefix="/api/v1/becas", tags=["Becas"])


def utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


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


# ---------------- CATÁLOGOS Y CONVOCATORIAS ---------------- #

@router.get("/carreras")
def list_carreras():
    """Retorna el catálogo configurado de programas para este portal."""
    return CARRERAS_UTO


def parse_json_field(val, fallback):
    if isinstance(val, list):
        return val
    if not val:
        return fallback
    try:
        parsed = json.loads(val)
        return parsed if isinstance(parsed, list) else fallback
    except Exception:
        if isinstance(val, str) and val.startswith("{") and val.endswith("}"):
            items = [x.strip() for x in val[1:-1].split(",") if x.strip()]
            return items
        return fallback


@router.get("/convocatorias")
def list_calls(db: Session = Depends(get_db)):
    calls = db.scalars(select(ScholarshipCall).order_by(desc(ScholarshipCall.created_at))).all()
    res = []
    for c in calls:
        res.append({
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
            "results_published": getattr(c, "results_published", False),
            "periodo_actual": getattr(c, "periodo_actual", "septiembre - diciembre 2026") or "septiembre - diciembre 2026",
            "periodo_anterior": getattr(c, "periodo_anterior", "mayo - agosto 2026") or "mayo - agosto 2026",
            "cuatrimestres_habilitados": parse_json_field(getattr(c, "cuatrimestres_habilitados", None), ["3°", "5°", "6°", "9°"]),
            "carreras_habilitadas": parse_json_field(getattr(c, "carreras_habilitadas", None), []),
            "accepting": c.is_active and utc(c.start_date) <= now() <= utc(c.end_date),
            "custom_questions": parse_json_field(c.custom_questions, []),
            "created_at": c.created_at.isoformat(),
        })
    return res


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
    periodo_actual: str = "septiembre - diciembre 2026"
    periodo_anterior: str = "mayo - agosto 2026"
    cuatrimestres_habilitados: list = ["3°", "5°", "6°", "9°"]
    carreras_habilitadas: list = []


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
        periodo_actual=payload.periodo_actual,
        periodo_anterior=payload.periodo_anterior,
        cuatrimestres_habilitados=json.dumps(payload.cuatrimestres_habilitados, ensure_ascii=False),
        carreras_habilitadas=json.dumps(payload.carreras_habilitadas, ensure_ascii=False),
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
        f"Título: {payload.title}, Monto: ${payload.amount}, Periodo: {payload.periodo_actual}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {"id": call.id, "code": call.code, "message": "Convocatoria publicada con éxito."}


class UpdateCallPayload(BaseModel):
    title: str | None = None
    description: str | None = None
    min_gpa: float | None = None
    amount: float | None = None
    slots: int | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None
    periodo_actual: str | None = None
    periodo_anterior: str | None = None
    cuatrimestres_habilitados: list | None = None
    carreras_habilitadas: list | None = None


@router.put("/convocatorias/{call_id}")
def update_call(
    call_id: int,
    payload: UpdateCallPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador", "evaluador", "escolares")
    call = db.get(ScholarshipCall, call_id)
    if not call:
        raise HTTPException(404, "Convocatoria no encontrada.")

    if payload.title is not None:
        call.title = payload.title
    if payload.description is not None:
        call.description = payload.description
    if payload.min_gpa is not None:
        call.min_gpa = payload.min_gpa
    if payload.amount is not None:
        call.amount = payload.amount
    if payload.slots is not None:
        call.slots = payload.slots
    if payload.is_active is not None:
        call.is_active = payload.is_active
    if payload.periodo_actual is not None:
        call.periodo_actual = payload.periodo_actual
    if payload.periodo_anterior is not None:
        call.periodo_anterior = payload.periodo_anterior
    if payload.cuatrimestres_habilitados is not None:
        call.cuatrimestres_habilitados = json.dumps(payload.cuatrimestres_habilitados, ensure_ascii=False)
    if payload.carreras_habilitadas is not None:
        call.carreras_habilitadas = json.dumps(payload.carreras_habilitadas, ensure_ascii=False)

    if payload.start_date is not None:
        call.start_date = datetime.fromisoformat(payload.start_date.replace("Z", "+00:00"))
    if payload.end_date is not None:
        call.end_date = datetime.fromisoformat(payload.end_date.replace("Z", "+00:00"))

    audit_becas(
        db,
        user,
        f"Convocatoria actualizada: {call.code}",
        "ScholarshipCall",
        str(call.id),
        f"Periodo: {call.periodo_actual}, Min GPA: {call.min_gpa}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Convocatoria actualizada exitosamente."}


@router.delete("/convocatorias/{call_id}")
def delete_call(
    call_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "administrador", "escolares")
    call = db.get(ScholarshipCall, call_id)
    if not call:
        raise HTTPException(404, "Convocatoria no encontrada.")

    apps_count = db.scalar(select(func.count(ScholarshipApplication.id)).where(ScholarshipApplication.call_id == call_id)) or 0
    if apps_count > 0:
        # Si tiene solicitudes no se destruye para preservar auditoría, se desactiva
        call.is_active = False
        db.commit()
        audit_becas(
            db,
            user,
            f"Convocatoria desactivada (tiene expedientes): {call.code}",
            "ScholarshipCall",
            str(call.id),
            f"Se desactivó para preservar {apps_count} expediente(s)",
            request.client.host if request.client else "127.0.0.1",
        )
        return {"message": f"Convocatoria desactivada para preservar los {apps_count} expediente(s) asociados."}

    code = call.code
    db.delete(call)
    audit_becas(
        db,
        user,
        f"Convocatoria eliminada: {code}",
        "ScholarshipCall",
        str(call_id),
        f"Eliminada por {user.name}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Convocatoria eliminada exitosamente."}


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
        "results_published": getattr(c, "results_published", False),
        "periodo_actual": getattr(c, "periodo_actual", "septiembre - diciembre 2026") or "septiembre - diciembre 2026",
        "periodo_anterior": getattr(c, "periodo_anterior", "mayo - agosto 2026") or "mayo - agosto 2026",
        "cuatrimestres_habilitados": json.loads(getattr(c, "cuatrimestres_habilitados", None) or '["3°", "5°", "6°", "9°"]'),
        "carreras_habilitadas": json.loads(getattr(c, "carreras_habilitadas", None) or '[]'),
        "accepting": c.is_active and utc(c.start_date) <= now() <= utc(c.end_date),
        "custom_questions": json.loads(c.custom_questions or "[]"),
    }


@router.post("/convocatorias/{call_id}/publicar-resultados")
def publish_call_results(
    call_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Cierra la convocatoria y publica los resultados registrados en el portal."""
    require_role(user, "administrador", "evaluador", "escolares")
    call = db.get(ScholarshipCall, call_id)
    if not call:
        raise HTTPException(404, "Convocatoria no encontrada.")
    call.is_active = False
    call.results_published = True

    # Notificar a los aspirantes que los resultados definitivos están disponibles
    apps = db.scalars(select(ScholarshipApplication).where(ScholarshipApplication.call_id == call.id)).all()
    for a in apps:
        status_txt = "favorable (Beca Aprobada)" if a.status in ("aprobada", "renovada") else ("no favorable" if a.status == "rechazada" else "en revisión")
        db.add(
            Notification(
                user_id=a.user_id,
                message=f"Se publicaron los resultados registrados de la convocatoria '{call.title}'. El dictamen de tu folio {a.folio} es: {status_txt}.",
            )
        )

    audit_becas(
        db,
        user,
        f"Resultados publicados en el portal: {call.code}",
        "ScholarshipCall",
        str(call.id),
        f"Convocatoria: {call.title}, Folios evaluados: {len(apps)}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Resultados publicados en el portal.", "results_published": True, "published": True}


@router.get("/convocatorias/{call_id}/resultados")
def get_call_results(
    call_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Resultados publicados; el estudiante consulta solo su folio."""
    require_role(user, "estudiante", "administrador", "escolares", "evaluador")
    call = db.get(ScholarshipCall, call_id)
    if not call:
        raise HTTPException(404, "Convocatoria no encontrada.")
    if not getattr(call, "results_published", False):
        raise HTTPException(400, "Los resultados de esta convocatoria aún no han sido publicados por el Comité.")

    stmt = select(ScholarshipApplication).where(
        ScholarshipApplication.call_id == call_id,
        ScholarshipApplication.status.in_(("aprobada", "renovada", "concluida")),
    )
    if user.role == "estudiante":
        stmt = stmt.where(ScholarshipApplication.user_id == user.id)
    apps = db.scalars(stmt.order_by(ScholarshipApplication.folio)).all()
    return [
        {
            "folio": a.folio,
            "major": a.major,
            "academic_term": a.academic_term,
            "student_percentage": a.student_percentage,
            "discount_percentage": a.discount_percentage,
            "dictamen_session": a.dictamen_session,
            "status": a.status,
        }
        for a in apps
    ]


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
        require_role(user, "administrador", "evaluador", "escolares")
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
            "version": getattr(app, "version", 1),
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
    academic_term: str = PydField(min_length=1, max_length=50)
    major: str = PydField(min_length=3, max_length=150)
    study_system: str | None = "presencial"
    study_level: str | None = "Técnico Superior Universitario"
    phone: str | None = None
    curp: str | None = None
    gender: str | None = None
    custom_answers: dict = {}


@router.post("/solicitudes")
def create_application(
    payload: CreateApplicationPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    call = db.get(ScholarshipCall, payload.call_id)
    if not call or not call.is_active or not utc(call.start_date) <= now() <= utc(call.end_date):
        raise HTTPException(400, "La convocatoria seleccionada no está disponible o ha cerrado.")

    # Validaciones específicas por modalidad UTO:
    system_norm = (payload.study_system or "presencial").lower().strip()
    if call.modalidad == "alimenticia" and system_norm != "presencial":
        raise HTTPException(400, "La Beca Alimenticia es exclusiva para el sistema presencial escolarizado de tiempo completo.")

    if call.modalidad == "academica" and payload.gpa < 9.7 and call.min_gpa >= 9.7:
        raise HTTPException(400, "La Beca Académica requiere un promedio mínimo de 9.70 en el cuatrimestre anterior evaluado.")

    if call.modalidad == "escasos_recursos" and payload.gpa < 8.5 and call.min_gpa >= 8.5:
        raise HTTPException(400, "La Beca de Escasos Recursos Económicos requiere un promedio mínimo de 8.50.")

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
        study_system=system_norm,
        study_level=payload.study_level or "Técnico Superior Universitario",
        phone=payload.phone,
        curp=payload.curp,
        gender=payload.gender,
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
            target_path=f"/becas/solicitud/{app.id}",
        )
    )

    audit_becas(
        db,
        user,
        f"Solicitud registrada: {app.folio}",
        "ScholarshipApplication",
        str(app.id),
        f"Convocatoria: {call.code}, Promedio: {payload.gpa}, Sistema: {system_norm}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {
        "id": app.id,
        "folio": app.folio,
        "version": getattr(app, "version", 1),
        "status": app.status,
        "message": "Solicitud registrada con éxito.",
    }


@router.get("/solicitudes/{app_id}")
def get_application_detail(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    if user.role == "estudiante":
        if app.user_id != user.id:
            raise HTTPException(403, "No tienes permiso para consultar esta solicitud.")
    else:
        require_role(user, "administrador", "evaluador", "escolares")

    call = db.get(ScholarshipCall, app.call_id)
    applicant = db.get(User, app.user_id)
    docs = db.scalars(select(ScholarshipDocument).where(ScholarshipDocument.application_id == app.id)).all()
    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == app.user_id))

    return {
        "id": app.id,
        "folio": app.folio,
        "version": getattr(app, "version", 1),
        "status": app.status,
        "gpa": app.gpa,
        "academic_term": app.academic_term,
        "major": app.major,
        "study_system": getattr(app, "study_system", "presencial") or "presencial",
        "study_level": getattr(app, "study_level", None),
        "phone": getattr(app, "phone", None),
        "curp": getattr(app, "curp", None),
        "gender": getattr(app, "gender", None),
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
    discount_percentage: float | None = PydField(default=None, ge=0, le=100)
    student_percentage: float | None = PydField(default=None, ge=0, le=100)
    version: int | None = None


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

    current_version = getattr(app, "version", 1)
    if payload.version is not None and current_version != payload.version:
        raise HTTPException(409, "La solicitud cambió o ya tiene dictamen. Recarga el expediente.")

    if hasattr(app, "version"):
        app.version = current_version + 1

    app.status = payload.decision
    app.committee_notes = payload.committee_notes
    if payload.score is not None:
        app.socioeconomic_score = payload.score

    # Asignación de porcentaje de beca / porcentaje a pagar por el estudiante
    if payload.decision == "aprobada":
        if (payload.student_percentage is not None and payload.discount_percentage is not None
                and abs(payload.student_percentage + payload.discount_percentage - 100) > 0.01):
            raise HTTPException(400, "Los porcentajes de aportación y apoyo deben sumar 100.")
        required_kinds = {d["id"] for d in DOCUMENTOS if d.get("required")}
        docs = db.scalars(select(ScholarshipDocument).where(ScholarshipDocument.application_id == app.id)).all()
        validated_kinds = {d.kind for d in docs if d.status == "validado"}
        if not required_kinds.issubset(validated_kinds):
            raise HTTPException(409, "No se puede aprobar la solicitud sin toda la documentación obligatoria validada.")
        if payload.student_percentage is not None:
            app.student_percentage = float(payload.student_percentage)
            app.discount_percentage = round(100.0 - app.student_percentage, 1)
        elif payload.discount_percentage is not None:
            app.discount_percentage = float(payload.discount_percentage)
            app.student_percentage = round(100.0 - app.discount_percentage, 1)
        else:
            app.discount_percentage = None
            app.student_percentage = None

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
    db.commit()

    return {
        "message": "Dictamen registrado con éxito.",
        "status": app.status,
        "version": getattr(app, "version", 1),
    }


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
        "version": getattr(app, "version", 1),
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
    if user.role != "estudiante" or app.user_id != user.id:
        raise HTTPException(403, "No puedes subir documentos a esta solicitud.")

    valid_kinds = {d["id"] for d in DOCUMENTOS}
    if kind not in valid_kinds:
        raise HTTPException(422, "Tipo de documento no válido.")

    content = await file.read()
    max_bytes = (1 * 1024 * 1024) if kind == "no_adeudo" else (10 * 1024 * 1024)
    if len(content) > max_bytes:
        limit_txt = "1 MB" if kind == "no_adeudo" else "10 MB"
        raise HTTPException(413, f"El archivo supera el límite permitido de {limit_txt}.")

    allowed_mimes = ["application/pdf", "application/x-pdf", "application/octet-stream"]
    if not (file.filename.lower().endswith(".pdf") or file.content_type in allowed_mimes):
        raise HTTPException(400, "Formato no permitido. Solo se aceptan archivos PDF.")

    if not content.startswith(b"%PDF-"):
        raise HTTPException(422, "El archivo PDF está dañado o no es válido.")

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

    if hasattr(app, "version"):
        app.version = getattr(app, "version", 1) + 1

    db.commit()
    return {"message": "Documento recibido con éxito.", "kind": kind, "filename": file.filename}


class ReviewDocumentPayload(BaseModel):
    status: Literal["validado", "rechazado"]
    note: str = PydField(default="", max_length=2000)
    version: int = PydField(ge=1)


@router.post("/solicitudes/{app_id}/documentos/{doc_id}/revision")
def review_document(
    app_id: int,
    doc_id: str,
    payload: ReviewDocumentPayload,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "evaluador", "administrador", "escolares")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")

    current_version = getattr(app, "version", 1)
    if current_version != payload.version or app.status not in ("recibida", "revision"):
        raise HTTPException(409, "El expediente cambió o está cerrado. Recarga antes de revisar.")

    doc = db.get(ScholarshipDocument, doc_id)
    if not doc or doc.application_id != app.id:
        raise HTTPException(404, "Documento no encontrado.")

    if payload.status == "rechazado" and not payload.note.strip():
        raise HTTPException(422, "Explica qué debe corregir el estudiante.")

    doc.status = payload.status
    doc.note = payload.note
    if hasattr(app, "version"):
        app.version = current_version + 1
    app.updated_at = now()

    audit_becas(db, user, f"Documento {payload.status}: {doc.kind}", "ScholarshipApplication", str(app.id))
    db.commit()
    return {"version": getattr(app, "version", 1), "message": "Revisión guardada."}


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
@router.get("/socioeconomico")
def get_socioeconomic(
    user_id: str | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", "administrador", "evaluador", "escolares")
    target_id = user.id
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


# ---------------- ÓRDENES INTERNAS DE COBRO ---------------- #

@router.get("/ordenes-cobro/elegibles")
def list_payment_order_candidates(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Datos mínimos de solicitudes aprobadas para registrar órdenes internas."""
    require_role(user, "tesoreria")
    rows = db.execute(
        select(ScholarshipApplication, ScholarshipCall, User)
        .join(ScholarshipCall, ScholarshipApplication.call_id == ScholarshipCall.id)
        .join(User, ScholarshipApplication.user_id == User.id)
        .where(ScholarshipApplication.status == "aprobada")
        .order_by(ScholarshipApplication.folio)
    ).all()
    return [
        {
            "id": app.id,
            "folio": app.folio,
            "applicant": {"name": student.name},
            "call_title": call.title,
            "student_percentage": app.student_percentage,
        }
        for app, call, student in rows
    ]


@router.get("/ordenes-cobro")
def list_payment_orders(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante", "tesoreria", "administrador", "auditor", "escolares", "evaluador")
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
            "student_name": student.name if user.role != "auditor" else None,
            "amount": order.amount,
            "cuota_base": order.cuota_base if order.cuota_base is not None else order.amount,
            "discount_percentage": order.discount_percentage,
            "student_percentage": order.student_percentage if order.student_percentage is not None else app.student_percentage,
            "period": order.period,
            "scheduled_date": order.scheduled_date.isoformat(),
            "status": order.status,
            "reference": order.reference if user.role in ("estudiante", "tesoreria") else order.folio_orden,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "bank_name": (order.bank_name or app.bank_name) if user.role != "auditor" else None,
            "bank_clabe": (order.bank_clabe or app.bank_clabe) if user.role == "tesoreria" else None,
            "batch_folio": order.batch_folio if user.role in ("estudiante", "tesoreria") else None,
            "dispersed_at": order.dispersed_at.isoformat() if order.dispersed_at else None,
        }
        for order, app, call, student in rows
    ]


class GeneratePaymentOrderPayload(BaseModel):
    application_id: int
    period: str = PydField(min_length=2, max_length=50)
    scheduled_date: datetime
    cuota_base: float = PydField(gt=0)
    student_percentage: float | None = PydField(default=None, ge=0, le=100)


@router.post("/ordenes-cobro/generar")
def generate_payment_order(
    payload: GeneratePaymentOrderPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería registra una orden interna; no crea referencias de pago externas."""
    require_role(user, "tesoreria")
    app = db.get(ScholarshipApplication, payload.application_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status != "aprobada":
        raise HTTPException(400, "Solo es posible generar órdenes de cobro para becas aprobadas.")

    existing_order = db.scalar(
        select(ScholarshipPaymentOrder).where(
            ScholarshipPaymentOrder.application_id == payload.application_id,
            ScholarshipPaymentOrder.period == payload.period,
        )
    )
    if existing_order:
        raise HTTPException(409, "Ya existe una orden de cobro registrada para esta solicitud y periodo.")

    folio_orden = f"ORD-BEC-{uid().replace('-', '')[:12].upper()}"
    sched_dt = payload.scheduled_date

    pct_pago = payload.student_percentage if payload.student_percentage is not None else app.student_percentage
    if pct_pago is None:
        raise HTTPException(400, "Indica el porcentaje autorizado antes de registrar la orden.")
    pct_beca = round(100.0 - pct_pago, 1)
    cuota_base = payload.cuota_base
    monto_a_pagar = round(cuota_base * (pct_pago / 100.0), 2)

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
        reference=folio_orden,
        puebla_reference=None,
        puebla_url=None,
        bank_name=app.bank_name,
        bank_clabe=app.bank_clabe,
    )
    db.add(order)

    db.add(
        Notification(
            user_id=app.user_id,
            message=(
                f"Tesorería registró una orden interna ({folio_orden}) por ${monto_a_pagar:,.2f} MXN "
                f"(aportación del {pct_pago:.1f}%). Consulta las instrucciones de pago con Tesorería."
            ),
            target_path="/becas/ordenes-cobro",
        )
    )

    audit_becas(
        db,
        user,
        f"Orden de pago emitida por Tesorería: {folio_orden}",
        "ScholarshipPaymentOrder",
        str(app.id),
        f"Monto programado: ${monto_a_pagar:,.2f} (% a pagar: {pct_pago}%).",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {
        "message": "Orden de pago emitida con éxito.",
        "folio_orden": folio_orden,
        "amount": monto_a_pagar,
        "student_percentage": pct_pago,
        "discount_percentage": pct_beca,
        "reference": folio_orden,
    }


class PaymentVerificationPayload(BaseModel):
    external_reference: str = PydField(min_length=3, max_length=100)


@router.post("/ordenes-cobro/{order_id}/confirmar-pago")
def confirm_manual_payment(
    order_id: int,
    payload: PaymentVerificationPayload,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería registra una verificación manual respaldada por una referencia externa."""
    require_role(user, "tesoreria")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de pago no encontrada.")
    if order.status != "programada":
        raise HTTPException(409, "Solo se puede verificar una orden programada.")
    reference = payload.external_reference.strip()
    if len(reference) < 3:
        raise HTTPException(422, "Indica una referencia externa válida.")

    order.status = "pagada"
    order.paid_at = now()
    order.reference = reference

    app = db.get(ScholarshipApplication, order.application_id)
    if app:
        db.add(
            Notification(
                user_id=app.user_id,
                message=f"Tesorería registró la verificación manual del pago de la orden {order.folio_orden}.",
                target_path="/becas/ordenes-cobro",
            )
        )

    audit_becas(
        db,
        user,
        f"Pago validado por Tesorería: {order.folio_orden}",
        "ScholarshipPaymentOrder",
        str(order.id),
        f"Referencia externa registrada: {order.reference}; monto: ${order.amount:,.2f}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Verificación manual registrada por Tesorería.", "status": order.status}


@router.post("/ordenes-cobro/{order_id}/rechazar-pago")
def revert_manual_payment(
    order_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería revierte una verificación manual y conserva su auditoría."""
    require_role(user, "tesoreria")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de pago no encontrada.")
    if order.status != "pagada":
        raise HTTPException(409, "Solo se puede devolver a pendiente un pago verificado.")

    order.status = "programada"
    order.paid_at = None
    order.reference = order.folio_orden

    app = db.get(ScholarshipApplication, order.application_id)
    if app:
        db.add(
            Notification(
                user_id=app.user_id,
                message=f"Tesorería devolvió a pendiente la verificación de la orden {order.folio_orden}. Consulta al área para conocer el motivo.",
                target_path="/becas/ordenes-cobro",
            )
        )

    audit_becas(
        db,
        user,
        f"Comprobante devuelto/rechazado por Tesorería: {order.folio_orden}",
        "ScholarshipPaymentOrder",
        str(order.id),
        f"Devuelto a estatus programado por {user.name}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Verificación devuelta a pendiente por Tesorería.", "status": order.status}


@router.delete("/ordenes-cobro/{order_id}")
def cancel_payment_order(
    order_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Tesorería anula una orden interna conservando su registro y auditoría."""
    require_role(user, "tesoreria")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de pago no encontrada.")
    if order.status != "programada":
        raise HTTPException(409, "Solo se puede anular una orden programada.")

    folio = order.folio_orden
    order.status = "cancelada"
    audit_becas(
        db,
        user,
        f"Orden de pago anulada: {folio}",
        "ScholarshipPaymentOrder",
        str(order_id),
        f"Cancelada por {user.name}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": f"Orden de pago {folio} anulada."}


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
    """Tesorería registra una dispersión reportada fuera del sistema."""
    require_role(user, "tesoreria")
    order = db.get(ScholarshipPaymentOrder, order_id)
    if not order:
        raise HTTPException(404, "Orden de cobro no encontrada.")
    if order.status != "pagada":
        raise HTTPException(409, "La orden debe tener un pago verificado antes de registrar la dispersión.")
    batch_folio = payload.batch_folio.strip()
    if len(batch_folio) < 3:
        raise HTTPException(422, "Indica una referencia de operación externa válida.")

    app = db.get(ScholarshipApplication, order.application_id)
    order.status = "dispersada"
    order.batch_folio = batch_folio
    order.dispersed_at = now()
    if app and not order.bank_clabe:
        order.bank_name = app.bank_name
        order.bank_clabe = app.bank_clabe

    if app:
        db.add(
            Notification(
                user_id=app.user_id,
                message=f"Tesorería registró una dispersión externa para la orden {order.folio_orden}, con referencia {batch_folio}. El portal no ejecuta transferencias.",
                target_path="/becas/ordenes-cobro",
            )
        )

    audit_becas(
        db,
        user,
        f"Orden de cobro dispersada: {order.folio_orden}",
        "ScholarshipPaymentOrder",
        str(order.id),
        f"Referencia externa: {batch_folio}; monto: ${order.amount:.2f}",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()

    return {
        "message": "Referencia de dispersión externa registrada por Tesorería.",
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
    require_role(user, "administrador", "escolares", "evaluador", "auditor")
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
        "completion_progress_percent": 100,  # Cobertura funcional completa (100%)
    }


@router.get("/padron-beneficiarios")
def get_beneficiaries_padron(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Devuelve la relación interna de beneficiarios al personal revisor autorizado."""
    require_role(user, "administrador", "escolares", "evaluador")
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
    require_role(user, "administrador", "evaluador", "auditor", "escolares")
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
            profile.get("matricula", "N/A") if user.role != "auditor" else "",
            student.name if user.role != "auditor" else "",
            app.major,
            app.academic_term,
            app.gpa if user.role != "auditor" else "",
            app.socioeconomic_score if user.role != "auditor" else "",
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
                target_path="/becas/socioeconomico",
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
            target_path="/becas/renovacion",
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


# ---------------- RESUMEN DE ASIGNACIÓN, CONCLUSIÓN Y NOTIFICACIONES ---------------- #

@router.get("/solicitudes/{app_id}/constancia")
def get_scholarship_assignment_summary(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Consulta el resumen interno de una solicitud favorable, sin emitir una constancia."""
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if user.role == "estudiante":
        if app.user_id != user.id:
            raise HTTPException(403, "No puedes consultar la solicitud de otro estudiante.")
    else:
        require_role(user, "administrador", "escolares", "evaluador")
    if app.status not in ("aprobada", "renovada", "concluida"):
        raise HTTPException(400, "El resumen de asignación requiere un dictamen favorable.")

    call = db.get(ScholarshipCall, app.call_id)
    applicant = db.get(User, app.user_id)
    order = db.scalar(
        select(ScholarshipPaymentOrder)
        .where(ScholarshipPaymentOrder.application_id == app.id)
        .order_by(desc(ScholarshipPaymentOrder.created_at))
    )

    return {
        "document_type": "resumen_no_oficial",
        "application_folio": app.folio,
        "status": app.status,
        "student_name": applicant.name,
        "major": app.major,
        "term": app.academic_term,
        "call_title": call.title,
        "modalidad": call.modalidad,
        "decision_date": app.dictamen_date.isoformat() if app.dictamen_date else None,
        "agreement": app.dictamen_agreement or None,
        "student_percentage": app.student_percentage,
        "payment_order": {
            "folio": order.folio_orden,
            "amount": order.amount,
            "status": order.status,
        } if order else None,
        "notice": "Resumen para consulta. No es una constancia oficial ni una referencia de pago.",
    }


@router.get("/solicitudes/{app_id}/anexo1")
def get_anexo1_protesta(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Prepara los datos del formato de Anexo 1 para revisión e impresión."""
    require_role(user, "estudiante")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.user_id != user.id:
        raise HTTPException(403, "No puedes consultar datos de otro estudiante.")

    applicant = db.get(User, app.user_id)
    call = db.get(ScholarshipCall, app.call_id)
    socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == app.user_id))
    answers = json.loads(app.custom_answers or "{}")
    anexo = answers.get("anexo1")
    anexo = anexo if isinstance(anexo, dict) else {}
    beca_externa = answers.get("beca_externa")
    beca_externa = beca_externa if isinstance(beca_externa, dict) else {}
    profile = json.loads(applicant.profile or "{}")

    dependencia = anexo.get("depende_de") or answers.get("dependencia_persona") or answers.get("de_quien_depende")
    ocupacion = anexo.get("ocupacion") or answers.get("dependencia_ocupacion") or answers.get("ocupacion_tutor")
    parentesco = anexo.get("parentesco") or answers.get("dependencia_parentesco")
    ingreso = anexo.get("ingreso_familiar_mensual")
    if ingreso is None:
        ingreso = answers.get("ingreso_familiar_mensual")
    if ingreso is None and socio:
        ingreso = socio.monthly_income
    dependientes = anexo.get("dependientes_conteo")
    if dependientes is None:
        dependientes = answers.get("numero_dependientes")
    if dependientes is None and socio:
        dependientes = socio.dependents_count
    gastos = anexo.get("gastos_familiares_mensuales")
    if gastos is None:
        gastos = answers.get("gastos_familiares_mensuales")
    if gastos is None and socio:
        gastos = socio.monthly_expenses
    transporte_diario = anexo.get("transporte_diario")
    if transporte_diario is None:
        transporte_diario = answers.get("transporte_gasto_diario") or answers.get("costo_diario_transporte")

    return {
        "application_id": app.id,
        "institution": "Universidad Tecnológica de Oriental",
        "committee": "COMITÉ DE BECAS DE LA UNIVERSIDAD TECNOLÓGICA DE ORIENTAL",
        "city": "Oriental",
        "state": "Puebla",
        "date_str": now().strftime("%d/%m/%Y"),
        "student": {
            "name": applicant.name,
            "matricula": profile.get("matricula") or answers.get("matricula") or "",
            "major": app.major,
            "academic_term": app.academic_term,
            "curp": getattr(app, "curp", "") or "",
        },
        "call": {
            "periodo": getattr(call, "periodo_actual", "septiembre - diciembre 2026") or "septiembre - diciembre 2026",
            "title": call.title,
        },
        "anexo1_data": {
            "depende_de": dependencia,
            "parentesco": parentesco,
            "ocupacion": ocupacion,
            "ingreso_mensual": float(ingreso) if ingreso is not None else None,
            "personas_dependientes": int(dependientes) if dependientes is not None else None,
            "gastos_mensuales": float(gastos) if gastos is not None else None,
            "transporte_diario": float(transporte_diario) if transporte_diario is not None else None,
            "no_beca_externa": beca_externa.get("tiene") is False if isinstance(beca_externa.get("tiene"), bool) else None,
        },
    }


@router.get("/solicitudes/{app_id}/anexo1.pdf")
def download_anexo1_pdf(
    app_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Descarga el Anexo 1 del estudiante como PDF carta con membrete de página completa."""
    data = get_anexo1_protesta(app_id=app_id, user=user, db=db)
    return Response(
        content=render_anexo1_pdf(data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="anexo1-beca-{app_id}.pdf"',
            "Cache-Control": "no-store",
        },
    )


@router.post("/solicitudes/{app_id}/concluir")
def conclude_scholarship_case(
    app_id: int,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Servicios Escolares o Administrador concluye formalmente el expediente de beca tras validación."""
    require_role(user, "escolares", "administrador")
    app = db.get(ScholarshipApplication, app_id)
    if not app:
        raise HTTPException(404, "Solicitud no encontrada.")
    if app.status not in ("aprobada", "renovada"):
        raise HTTPException(400, "Solo solicitudes aprobadas o renovadas pueden concluirse.")

    app.status = "concluida"
    app.updated_at = now()
    db.add(
        Notification(
            user_id=app.user_id,
            message=f"Tu expediente de beca {app.folio} ha concluido satisfactoriamente. Tu apoyo cuatrimestral está formalizado.",
        )
    )
    audit_becas(
        db,
        user,
        f"Trámite de beca concluido: {app.folio}",
        "ScholarshipApplication",
        str(app.id),
        "Expediente finalizado con éxito.",
        request.client.host if request.client else "127.0.0.1",
    )
    db.commit()
    return {"message": "Expediente de beca concluido satisfactoriamente.", "status": app.status}


@router.get("/notificaciones")
def get_user_scholarship_notifications(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Devuelve el buzón de notificaciones del usuario en el módulo de becas."""
    notes = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(desc(Notification.created_at))
        .limit(30)
    ).all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]
