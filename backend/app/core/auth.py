import json
import os
import secrets
import time
import smtplib
from email.message import EmailMessage
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    BackgroundTasks,
)
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, delete
from sqlalchemy.orm import Session as DBSession
from .database import get_db, DATA_DIR
from .models import User, Session, Reset, Notification
from .security import (
    current_user,
    hash_password,
    verify_password,
    public_user,
    digest,
    rate_limit,
    PRODUCTION,
    ORIGIN,
)

router = APIRouter(prefix="/api/v1", tags=["Identidad"])


class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class Email(BaseModel):
    email: str = Field(max_length=254)


class ResetPassword(BaseModel):
    token: str = Field(min_length=64, max_length=64)
    password: str = Field(min_length=12, max_length=128)


class Profile(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=3, max_length=150)
    matricula: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9-]+$")
    curp: str = Field(
        pattern=r"^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM][A-Z]{5}[A-Z0-9]\d$"
    )
    carrera: str = Field(min_length=3, max_length=150)
    generacion: str = Field(pattern=r"^\d{4}-\d{4}$")
    telefono: str = Field(pattern=r"^\+?[\d ()-]{10,20}$")
    domicilio: str = Field(min_length=10, max_length=400)


@router.post("/auth/login")
def login(
    body: Login, request: Request, response: Response, db: DBSession = Depends(get_db)
):
    rate_limit(request, "login")
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    # Same expensive operation for unknown accounts to reduce timing disclosure.
    if not user:
        hash_password(body.password)
        raise HTTPException(401, "Correo o contraseña incorrectos.")
    if not verify_password(body.password, user.password):
        raise HTTPException(401, "Correo o contraseña incorrectos.")
    raw, csrf = secrets.token_hex(32), secrets.token_hex(32)
    db.execute(delete(Session).where(Session.expires < int(time.time())))
    db.add(
        Session(
            token=digest(raw),
            user_id=user.id,
            csrf=csrf,
            expires=int(time.time()) + 28800,
        )
    )
    db.commit()
    response.set_cookie(
        "session",
        raw,
        httponly=True,
        secure=PRODUCTION,
        samesite="strict",
        max_age=28800,
    )
    return {"user": public_user(user), "csrf": csrf}


@router.get("/auth/me")
def me(request: Request, user=Depends(current_user)):
    return {"user": public_user(user), "csrf": request.state.session.csrf}


@router.post("/auth/logout")
def logout(
    request: Request,
    response: Response,
    user=Depends(current_user),
    db: DBSession = Depends(get_db),
):
    db.delete(request.state.session)
    db.commit()
    response.delete_cookie("session")
    return {"ok": True}


def deliver_reset(email, url):
    if not os.getenv("SMTP_HOST"):
        if PRODUCTION:
            raise RuntimeError("SMTP no configurado.")
        outbox = DATA_DIR / "outbox"
        outbox.mkdir(exist_ok=True)
        (outbox / f"{secrets.token_hex(12)}.txt").write_text(
            f"Para: {email}\nRestablecer contraseña (30 minutos): {url}",
            encoding="utf-8",
        )
        return
    message = EmailMessage()
    message["Subject"] = "Restablece tu acceso · UT de Oriental"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = email
    message.set_content(
        f"Solicitaste restablecer tu acceso. El enlace vence en 30 minutos:\n{url}\nSi no lo solicitaste, ignora este mensaje."
    )
    with smtplib.SMTP(
        os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "587")), timeout=15
    ) as smtp:
        if os.getenv("SMTP_STARTTLS", "true") == "true":
            smtp.starttls()
        if os.getenv("SMTP_USER"):
            smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(message)


@router.post("/auth/forgot-password")
def forgot(
    body: Email,
    request: Request,
    tasks: BackgroundTasks,
    db: DBSession = Depends(get_db),
):
    rate_limit(request, "forgot", 5)
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user:
        raw = secrets.token_hex(32)
        db.execute(delete(Reset).where(Reset.user_id == user.id))
        db.add(
            Reset(token=digest(raw), user_id=user.id, expires=int(time.time()) + 1800)
        )
        db.commit()
        tasks.add_task(deliver_reset, user.email, f"{ORIGIN}/recuperar?token={raw}")
    return {
        "message": "Si existe una cuenta con ese correo, recibirás las instrucciones para recuperar tu acceso."
    }


@router.post("/auth/reset-password")
def reset(body: ResetPassword, request: Request, db: DBSession = Depends(get_db)):
    rate_limit(request, "reset")
    entry = db.scalar(
        select(Reset).where(Reset.token == digest(body.token)).with_for_update()
    )
    if not entry or entry.expires < time.time():
        raise HTTPException(400, "El enlace no es válido o ya venció.")
    user = db.get(User, entry.user_id)
    user.password = hash_password(body.password)
    db.execute(delete(Session).where(Session.user_id == user.id))
    db.delete(entry)
    db.commit()
    return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}


@router.put("/profile")
def profile(body: Profile, user=Depends(current_user), db: DBSession = Depends(get_db)):
    from ..modules.titulacion.models import Application

    if user.role != "estudiante":
        raise HTTPException(403, "Solo estudiantes actualizan el perfil académico.")
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    active = db.scalar(
        select(Application).where(
            Application.user_id == user.id,
            Application.status.notin_(
                ["borrador", "incompleta", "rechazada", "cancelado"]
            ),
        )
    )
    if active:
        raise HTTPException(
            409,
            "Tu expediente está en revisión. Solicita la corrección a Servicios Escolares.",
        )
    values = body.model_dump()
    start, end = map(int, values["generacion"].split("-"))
    if start >= end or end > 2100 or start < 1950:
        raise HTTPException(422, "Verifica los años de tu generación.")
    user.name = values.pop("name").strip()
    user.profile = json.dumps(values, ensure_ascii=False)
    db.commit()
    return public_user(user)


@router.get("/notifications")
def notifications(user=Depends(current_user), db: DBSession = Depends(get_db)):
    return db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.id.desc())
        .limit(100)
    ).all()


@router.post("/notifications/read")
def read_notifications(user=Depends(current_user), db: DBSession = Depends(get_db)):
    for n in db.scalars(
        select(Notification).where(
            Notification.user_id == user.id, Notification.seen == False
        )
    ):
        n.seen = True
    db.commit()
    return {"ok": True}
