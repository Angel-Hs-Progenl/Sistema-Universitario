"""Herramientas locales. Ejecutar desde la raíz del repositorio."""

import argparse
import getpass
import json
import os
from sqlalchemy import select
from app.core.database import SessionLocal, DATA_DIR
from app.core.models import User, uid
from app.core.security import hash_password, ROLES
from app.modules.titulacion.models import Application, Document, Event
from app.modules.titulacion.domain import DOCUMENTS


def seed():
    if os.getenv("APP_ENV") == "production":
        raise SystemExit("El seed está prohibido en producción.")
    password = hash_password("Demo-UTO-2026!")
    with SessionLocal() as db:
        for role, name in [
            ("estudiante", "Mariana López · Demo"),
            ("escolares", "Andrea · Demo"),
            ("administrador", "Ángel · Demo"),
            ("tesoreria", "Daniel · Demo"),
            ("vinculacion", "Lucía · Demo"),
            ("egresado2", "Diego Hernández · Demo"),
        ]:
            email = f"{role}@demo.uto.local"
            if db.scalar(select(User).where(User.email == email)):
                continue
            profile = {
                "matricula": "202200184" if role == "estudiante" else "202200207",
                "curp": "LOPM040615MPLPRRA2",
                "carrera": "Ingeniería en Tecnologías de la Información",
                "generacion": "2022-2026",
                "telefono": "2221234567",
                "domicilio": "Calle de ejemplo 100, Oriental, Puebla",
            }
            user = User(
                email=email,
                name=name,
                role=role if role != "egresado2" else "estudiante",
                password=password,
                profile=json.dumps(profile, ensure_ascii=False),
            )
            db.add(user)
            db.flush()
            if user.role == "estudiante":
                status = "borrador" if role == "estudiante" else "revision"
                a = Application(user_id=user.id, status=status)
                db.add(a)
                db.flush()
                a.folio = f"TIT-2026-{a.id:06d}"
                db.add(
                    Event(
                        application_id=a.id,
                        actor_id=user.id,
                        action="Borrador creado",
                        note="Expediente ficticio para desarrollo.",
                    )
                )
                # Real readable files, clearly identified as samples, never personal documents.
                for kind in DOCUMENTS[:3] if role == "estudiante" else DOCUMENTS[:7]:
                    stored = uid() + ".pdf"
                    content = sample_pdf(kind["name"])
                    (DATA_DIR / "uploads" / stored).write_bytes(content)
                    db.add(
                        Document(
                            application_id=a.id,
                            kind=kind["id"],
                            name=f"EJEMPLO-{kind['id']}.pdf",
                            stored_name=stored,
                            mime="application/pdf",
                            size=len(content),
                            status="recibido",
                        )
                    )
                if role != "estudiante":
                    db.add(
                        Event(
                            application_id=a.id,
                            actor_id=user.id,
                            action="En revisión",
                            note="Expediente ficticio listo para probar las validaciones.",
                        )
                    )
        db.commit()
    print(
        "Cuentas ficticias creadas. Consulta docs/OPERACION.md. No usar con datos reales."
    )


def sample_pdf(label):
    # Minimal valid one-page PDF with xref offsets; no dependency needed.
    text = (
        ("EJEMPLO SIN VALIDEZ - " + label)
        .encode("ascii", "replace")
        .decode()
        .replace("(", "\\(")
        .replace(")", "\\)")
    )
    stream = f"BT /F1 16 Tf 50 750 Td ({text}) Tj ET".encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
    ]
    output = b"%PDF-1.4\n"
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(output))
        output += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    start = len(output)
    output += b"xref\n0 6\n0000000000 65535 f \n"
    for offset in offsets[1:]:
        output += f"{offset:010d} 00000 n \n".encode()
    return (
        output
        + f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{start}\n%%EOF".encode()
    )


def create_user(args):
    password = getpass.getpass("Contraseña (mínimo 12 caracteres): ")
    if len(password) < 12 or len(password) > 128:
        raise SystemExit("La contraseña debe tener entre 12 y 128 caracteres.")
    email = args.email.strip().lower()
    if "@" not in email:
        raise SystemExit("Correo inválido.")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            raise SystemExit("Ya existe una cuenta con ese correo.")
        db.add(
            User(
                email=email,
                name=args.name,
                role=args.role,
                password=hash_password(password),
            )
        )
        db.commit()
    print("Cuenta creada.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("seed-demo")
    users = sub.add_parser("create-user")
    users.add_argument("--email", required=True)
    users.add_argument("--name", required=True)
    users.add_argument("--role", choices=ROLES, required=True)
    args = parser.parse_args()
    if args.command == "seed-demo":
        seed()
    else:
        create_user(args)
