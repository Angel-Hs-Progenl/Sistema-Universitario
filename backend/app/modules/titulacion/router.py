import csv
import io
import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ...core.database import get_db, DATA_DIR
from ...core.models import User, Notification, uid, now
from ...core.security import current_user, require_role
from .models import Application, Document, Event
from .domain import (
    DOCUMENTS,
    STATES,
    TRANSITIONS,
    EDITABLE,
    can_review,
    missing_documents,
)

router = APIRouter(prefix="/api/v1/titulacion", tags=["Titulación"])


def get_app(db, id, user, lock=False):
    stmt = select(Application).where(Application.id == id)
    if lock:
        stmt = stmt.with_for_update()
    app = db.scalar(stmt)
    if (
        not app
        or (user.role == "estudiante" and app.user_id != user.id)
        or (user.role != "estudiante" and app.status == "borrador")
    ):
        raise HTTPException(404, "Solicitud no encontrada.")
    return app


def docs_for(db, id):
    return db.scalars(select(Document).where(Document.application_id == id)).all()


def audit(db, app, user, action, note=""):
    db.add(Event(application_id=app.id, actor_id=user.id, action=action, note=note))
    app.version += 1
    app.updated_at = now()


def notify(db, app, message):
    db.add(Notification(user_id=app.user_id, application_id=app.id, message=message))


def academic_identity(owner):
    # El expediente no comparte credenciales ni preferencias de la cuenta.
    return {
        "id": owner.id,
        "name": owner.name,
        "email": owner.email,
        "profile": json.loads(owner.profile),
    }


def details(db, app, user):
    owner = db.get(User, app.user_id)
    profile = (
        json.loads(app.profile_snapshot)
        if app.profile_snapshot != "{}"
        else academic_identity(owner)
    )
    # También limitar las instantáneas anteriores a CR-007 al responder.
    profile = {key: profile[key] for key in ("id", "name", "email", "profile")}
    if user.role in ["tesoreria", "vinculacion"]:
        profile["profile"] = {
            k: v
            for k, v in profile["profile"].items()
            if k in ["matricula", "carrera", "generacion"]
        }
    docs = docs_for(db, app.id)
    if user.role == "tesoreria":
        docs = [d for d in docs if d.kind == "pago"]
    if user.role == "vinculacion":
        docs = []
    events = db.scalars(
        select(Event).where(Event.application_id == app.id).order_by(Event.id.desc())
    ).all()
    if user.role in ["tesoreria", "vinculacion"]:
        events = [
            e for e in events if e.actor_id == user.id or e.action in STATES.values()
        ]
    return {
        "id": app.id,
        "folio": app.folio,
        "status": app.status,
        "clearance": app.clearance,
        "clearance_note": app.clearance_note,
        "reference": app.reference,
        "delivery": app.delivery,
        "version": app.version,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "student": profile,
        "documents": [
            {
                "id": d.id,
                "kind": d.kind,
                "name": d.name,
                "mime": d.mime,
                "size": d.size,
                "status": d.status,
                "note": d.note,
                "created_at": d.created_at,
            }
            for d in docs
        ],
        "events": [
            {"id": e.id, "action": e.action, "note": e.note, "created_at": e.created_at}
            for e in events
        ],
    }


@router.get("/catalogs")
def catalogs(user=Depends(current_user)):
    return {"documents": DOCUMENTS, "states": STATES, "transitions": TRANSITIONS}


@router.get("/applications")
def applications(user=Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(Application).order_by(Application.id.desc())
    if user.role == "estudiante":
        stmt = stmt.where(Application.user_id == user.id)
    else:
        stmt = stmt.where(Application.status != "borrador")
    return [details(db, a, user) for a in db.scalars(stmt.limit(500))]


@router.post("/applications", status_code=201)
def create(user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "estudiante")
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    if db.scalar(
        select(Application).where(
            Application.user_id == user.id, Application.status != "cancelado"
        )
    ):
        raise HTTPException(
            409, "Ya tienes una solicitud. Continúa con tu expediente actual."
        )
    app = Application(user_id=user.id)
    db.add(app)
    try:
        db.flush()
        year = datetime.now(ZoneInfo("America/Mexico_City")).year
        app.folio = f"TIT-{year}-{app.id:06d}"
        audit(db, app, user, "Borrador creado")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya tienes una solicitud activa.")
    return details(db, app, user)


@router.get("/applications/{id}")
def detail(id: int, user=Depends(current_user), db: Session = Depends(get_db)):
    return details(db, get_app(db, id, user), user)


@router.post("/applications/{id}/documents", status_code=201)
def upload(
    id: int,
    kind: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "estudiante")
    app = get_app(db, id, user, True)
    if app.status not in EDITABLE:
        raise HTTPException(
            409, "Los documentos solo pueden cambiarse en borrador o corrección."
        )
    if kind not in [d["id"] for d in DOCUMENTS]:
        raise HTTPException(422, "Tipo de documento inválido.")
    old = db.scalar(
        select(Document).where(Document.application_id == id, Document.kind == kind)
    )
    if old and old.status == "validado":
        raise HTTPException(409, "Un documento validado no puede reemplazarse.")
    content = file.file.read(5 * 1024 * 1024 + 1)
    if not content or len(content) > 5 * 1024 * 1024:
        raise HTTPException(422, "El archivo debe pesar entre 1 byte y 5 MB.")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix == ".pdf" and content.startswith(b"%PDF-"):
        mime = "application/pdf"
    elif suffix in [".jpg", ".jpeg"] and content.startswith(b"\xff\xd8\xff"):
        mime = "image/jpeg"
    else:
        raise HTTPException(
            422,
            "Adjunta un PDF o JPG válido. El contenido debe coincidir con la extensión.",
        )
    stored = f"{uid()}{suffix}"
    target = DATA_DIR / "uploads" / stored
    target.write_bytes(content)
    old_path = DATA_DIR / "uploads" / old.stored_name if old else None
    record = old or Document(application_id=id, kind=kind)
    record.name = Path(file.filename.replace("\\", "/")).name[:200]
    record.stored_name = stored
    record.mime = mime
    record.size = len(content)
    record.status = "recibido"
    record.note = ""
    record.created_at = now()
    db.add(record)
    audit(
        db,
        app,
        user,
        "Documento recibido",
        next(d["name"] for d in DOCUMENTS if d["id"] == kind),
    )
    try:
        db.commit()
    except Exception:
        target.unlink(missing_ok=True)
        raise
    if old_path:
        old_path.unlink(missing_ok=True)
    return details(db, app, user)


@router.get("/documents/{id}/download")
def download(id: str, user=Depends(current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, id)
    if not doc:
        raise HTTPException(404, "Documento no encontrado.")
    get_app(db, doc.application_id, user)
    if user.role not in ["estudiante", "escolares", "administrador"] and not can_review(
        user.role, doc.kind
    ):
        raise HTTPException(403, "No tienes acceso a este documento.")
    target = DATA_DIR / "uploads" / doc.stored_name
    if not target.is_file():
        raise HTTPException(
            404, "Archivo no disponible. Contacta a Servicios Escolares."
        )
    return FileResponse(
        target,
        media_type=doc.mime,
        filename=doc.name,
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )


class Review(BaseModel):
    status: str = Field(pattern=r"^(validado|rechazado)$")
    note: str = Field(default="", max_length=1000)


@router.post("/documents/{id}/review")
def review(
    id: str, body: Review, user=Depends(current_user), db: Session = Depends(get_db)
):
    doc = db.get(Document, id)
    if not doc:
        raise HTTPException(404, "Documento no encontrado.")
    if not can_review(user.role, doc.kind):
        raise HTTPException(403, "La validación pertenece a otra área.")
    app = get_app(db, doc.application_id, user, True)
    if app.status != "revision":
        raise HTTPException(
            409, "Inicia la revisión del expediente antes de validar documentos."
        )
    if body.status == "rechazado" and not body.note.strip():
        raise HTTPException(
            422,
            "Describe el motivo del rechazo para que el estudiante pueda corregirlo.",
        )
    doc.status = body.status
    doc.note = body.note.strip()
    label = next(d["name"] for d in DOCUMENTS if d["id"] == doc.kind)
    audit(db, app, user, f"Documento {body.status}", f"{label}: {doc.note}")
    notify(db, app, f"{label}: {body.status}. {doc.note}")
    db.commit()
    return details(db, app, user)


class Clearance(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    approved: bool
    note: str = Field(min_length=5, max_length=1000)


@router.post("/applications/{id}/clearance")
def clearance(
    id: int, body: Clearance, user=Depends(current_user), db: Session = Depends(get_db)
):
    require_role(user, "vinculacion")
    app = get_app(db, id, user, True)
    if app.status != "revision":
        raise HTTPException(409, "El expediente debe estar en revisión.")
    app.clearance = body.approved
    app.clearance_note = body.note.strip()
    audit(
        db,
        app,
        user,
        "Liberación de Vinculación" if body.approved else "Observación de Vinculación",
        body.note,
    )
    notify(db, app, f"Vinculación: {body.note}")
    db.commit()
    return details(db, app, user)


class Transition(BaseModel):
    status: str = Field(max_length=25)
    version: int = Field(ge=1)
    note: str = Field(default="", max_length=1000)
    reference: str = Field(default="", max_length=150)
    delivery: str = Field(default="", max_length=1000)


@router.post("/applications/{id}/transition")
def transition(
    id: int, body: Transition, user=Depends(current_user), db: Session = Depends(get_db)
):
    app = get_app(db, id, user, True)
    if body.version != app.version:
        raise HTTPException(409, "El expediente cambió. Actualiza antes de continuar.")
    if body.status not in TRANSITIONS[app.status]:
        raise HTTPException(409, "Este cambio de estado no está permitido.")
    if user.role == "estudiante":
        if body.status not in ["enviada", "cancelado"] or app.status not in EDITABLE:
            raise HTTPException(403, "Esta acción corresponde a Servicios Escolares.")
    else:
        require_role(user, "escolares", "administrador")
        if body.status == "enviada":
            raise HTTPException(403, "Solo el estudiante puede enviar su solicitud.")
    docs = docs_for(db, id)
    if body.status == "enviada":
        profile = json.loads(db.get(User, app.user_id).profile)
        from ...core.auth import Profile

        try:
            Profile(name=db.get(User, app.user_id).name, **profile)
        except Exception:
            raise HTTPException(
                422, "Completa y guarda tu perfil antes de enviar la solicitud."
            )
        missing = missing_documents(docs)
        if missing:
            raise HTTPException(422, "Faltan documentos: " + ", ".join(missing))
        app.profile_snapshot = json.dumps(
            academic_identity(db.get(User, app.user_id)), ensure_ascii=False
        )
    if body.status == "validada":
        missing = missing_documents(docs, True)
        if not app.clearance:
            missing.append("Liberación de Vinculación")
        if missing:
            raise HTTPException(422, "Aún no se ha validado: " + ", ".join(missing))
    if (
        body.status in ["incompleta", "rechazada", "cancelado", "concluido"]
        and len(body.note.strip()) < 5
    ):
        raise HTTPException(422, "Agrega una observación de al menos 5 caracteres.")
    if body.status == "tramite" and not body.reference.strip():
        raise HTTPException(422, "Registra la referencia de gestión institucional.")
    if body.status == "disponible" and not body.delivery.strip():
        raise HTTPException(422, "Registra las indicaciones de entrega del título.")
    app.status = body.status
    if body.reference.strip():
        app.reference = body.reference.strip()
    if body.delivery.strip():
        app.delivery = body.delivery.strip()
    audit(db, app, user, STATES[body.status], body.note.strip())
    notify(db, app, f"{app.folio}: {STATES[body.status]}. {body.note}")
    db.commit()
    return details(db, app, user)


@router.get("/reports/export")
def export(user=Depends(current_user), db: Session = Depends(get_db)):
    require_role(user, "escolares", "administrador")
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(
        ["Folio", "Estudiante", "Matrícula", "Carrera", "Estado", "Actualizado"]
    )

    def safe(s):
        s = str(s)
        return "'" + s if s.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else s

    for app in db.scalars(
        select(Application)
        .where(Application.status != "borrador")
        .order_by(Application.id.desc())
    ):
        owner = db.get(User, app.user_id)
        snapshot = (
            json.loads(app.profile_snapshot)
            if app.profile_snapshot != "{}"
            else academic_identity(owner)
        )
        p = snapshot["profile"]
        writer.writerow(
            [
                safe(v)
                for v in [
                    app.folio,
                    snapshot["name"],
                    p.get("matricula", ""),
                    p.get("carrera", ""),
                    STATES[app.status],
                    app.updated_at.isoformat(),
                ]
            ]
        )
    return Response(
        "\ufeff" + stream.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="titulacion.csv"'},
    )
