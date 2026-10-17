"""Herramientas locales. Ejecutar desde la raíz del repositorio."""

import argparse
import getpass
import json
import os
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal, DATA_DIR
from app.core.models import User, Session, AccountEvent, uid, now
from app.core.security import hash_password, verify_password, ROLES
from app.core.identity import institutional_email, normalize_phone
from app.modules.titulacion.models import Application, Document, Event
from app.modules.titulacion.domain import DOCUMENTS
from app.modules.becas.models import (
    ScholarshipCall,
    ScholarshipApplication,
    ScholarshipDocument,
    ScholarshipSocioeconomic,
    ScholarshipPaymentOrder,
    ScholarshipAuditLog,
)
from app.modules.becas.domain import DOCUMENTOS as BECAS_DOCS


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
            ("evaluador", "Roberto Méndez · Evaluador Becas"),
            ("auditor", "Mónica Ruiz · Auditoría"),
            ("egresado2", "Diego Hernández · Demo"),
        ]:
            email = f"{role}@demo.uto.local"
            existing = db.scalar(select(User).where(User.email == email))
            if existing:
                if role == "estudiante" and not existing.login_phone:
                    existing.login_phone = "+12025550100"
                    db.add(
                        AccountEvent(
                            user_id=existing.id,
                            action="Vinculación ficticia del seed de desarrollo",
                        )
                    )
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
                login_phone="+12025550100" if role == "estudiante" else None,
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

        # Seed Convocatorias de Becas UTO
        calls_data = [
            {
                "code": "BECA-2026-I-ACAD-001",
                "title": "Beca de Excelencia Académica Primavera 2026",
                "modalidad": "academica",
                "description": "Estímulo económico a estudiantes con trayectoria académica sobresaliente en el cuatrimestre anterior.",
                "min_gpa": 9.0,
                "amount": 4500.0,
                "slots": 30,
            },
            {
                "code": "BECA-2026-I-MANU-001",
                "title": "Beca Institucional de Manutención UTO 2026",
                "modalidad": "manutencion",
                "description": "Apoyo prioritario para la permanencia de estudiantes en condiciones de vulnerabilidad socioeconómica.",
                "min_gpa": 8.0,
                "amount": 3600.0,
                "slots": 75,
            },
            {
                "code": "BECA-2026-I-TRAN-001",
                "title": "Subsidio de Movilidad y Transporte Regional",
                "modalidad": "transporte",
                "description": "Subsidio para estudiantes que se trasladan diariamente desde municipios de la región de Oriental.",
                "min_gpa": 8.0,
                "amount": 2400.0,
                "slots": 50,
            },
            {
                "code": "BECA-2026-I-ALIM-001",
                "title": "Beca de Comedor y Seguridad Alimentaria",
                "modalidad": "alimentacion",
                "description": "Subsidio alimentario para desayuno y comida en la cafetería universitaria durante el periodo escolar.",
                "min_gpa": 7.5,
                "amount": 1800.0,
                "slots": 40,
            },
        ]
        created_calls = {}
        for cdata in calls_data:
            existing_call = db.scalar(select(ScholarshipCall).where(ScholarshipCall.code == cdata["code"]))
            if not existing_call:
                new_call = ScholarshipCall(
                    code=cdata["code"],
                    title=cdata["title"],
                    modalidad=cdata["modalidad"],
                    description=cdata["description"],
                    min_gpa=cdata["min_gpa"],
                    amount=cdata["amount"],
                    slots=cdata["slots"],
                    is_active=True,
                )
                db.add(new_call)
                db.flush()
                created_calls[cdata["code"]] = new_call
            else:
                created_calls[cdata["code"]] = existing_call

        mariana = db.scalar(select(User).where(User.email == "estudiante@demo.uto.local"))
        diego = db.scalar(select(User).where(User.email == "egresado2@demo.uto.local"))
        admin = db.scalar(select(User).where(User.email == "administrador@demo.uto.local"))

        # Seed Mariana's socioeconomic profile and application
        if mariana:
            existing_socio = db.scalar(select(ScholarshipSocioeconomic).where(ScholarshipSocioeconomic.user_id == mariana.id))
            if not existing_socio:
                db.add(
                    ScholarshipSocioeconomic(
                        user_id=mariana.id,
                        monthly_income=6500.0,
                        monthly_expenses=5800.0,
                        dependents_count=4,
                        housing_type="rentada",
                        vulnerability_score=75.0,
                        details=json.dumps({
                            "vivienda_material": "Concreto y tabique",
                            "cuartos": 2,
                            "servicios": ["agua", "luz", "drenaje"],
                            "ocupacion_padres": "Comercio informal y labores del hogar",
                            "ingreso_familiar_descripcion": "Ingreso variable por venta en tianguis regional",
                        }, ensure_ascii=False),
                    )
                )

            call_manu = created_calls.get("BECA-2026-I-MANU-001")
            if call_manu:
                app_manu = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.user_id == mariana.id, ScholarshipApplication.call_id == call_manu.id))
                if not app_manu:
                    app_manu = ScholarshipApplication(
                        call_id=call_manu.id,
                        user_id=mariana.id,
                        status="revision",
                        gpa=8.9,
                        academic_term="4to Cuatrimestre",
                        major="Ingeniería en Tecnologías de la Información",
                        socioeconomic_score=75.0,
                        committee_notes="Expediente completo. Pendiente de dictamen final en sesión de comité.",
                    )
                    db.add(app_manu)
                    db.flush()
                    app_manu.folio = f"BEC-2026-{app_manu.id:06d}"

                    for kind in BECAS_DOCS[:3]:
                        stored = uid() + ".pdf"
                        content = sample_pdf(f"BECA-{kind['name']}")
                        (DATA_DIR / "uploads" / stored).write_bytes(content)
                        db.add(
                            ScholarshipDocument(
                                application_id=app_manu.id,
                                kind=kind["id"],
                                name=f"COMPROBANTE-{kind['id'].upper()}.pdf",
                                stored_name=stored,
                                mime="application/pdf",
                                size=len(content),
                                status="recibido",
                            )
                        )

        # Seed Diego's scholarship application (aprobada) and payment order
        if diego and admin:
            call_acad = created_calls.get("BECA-2026-I-ACAD-001")
            if call_acad:
                app_acad = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.user_id == diego.id, ScholarshipApplication.call_id == call_acad.id))
                if not app_acad:
                    app_acad = ScholarshipApplication(
                        call_id=call_acad.id,
                        user_id=diego.id,
                        status="aprobada",
                        gpa=9.6,
                        academic_term="7mo Cuatrimestre",
                        major="Ingeniería en Tecnologías de la Información",
                        socioeconomic_score=60.0,
                        committee_notes="Aprobada por unanimidad por alto desempeño académico.",
                    )
                    db.add(app_acad)
                    db.flush()
                    app_acad.folio = f"BEC-2026-{app_acad.id:06d}"

                    order = ScholarshipPaymentOrder(
                        application_id=app_acad.id,
                        folio_orden="ORD-BEC-2026-0001",
                        amount=call_acad.amount,
                        period="Primer Parcial - Mayo 2026",
                        scheduled_date=now(),
                        status="emitida",
                        reference="UTO-SPEI-0002-0001",
                    )
                    db.add(order)

                    db.add(
                        ScholarshipAuditLog(
                            user_id=admin.id,
                            action="Dictamen de aprobación de beca",
                            target_type="ScholarshipApplication",
                            target_id=str(app_acad.id),
                            details=f"Beca {app_acad.folio} aprobada con promedio 9.6.",
                            ip_address="127.0.0.1",
                        )
                    )

        db.commit()
    print(
        "Cuentas ficticias y datos de becas creados. Consulta docs/OPERACION.md. No usar con datos reales."
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
    if not institutional_email(email):
        raise SystemExit(
            "Usa una cuenta del dominio utdeoriental.edu.mx. Para datos ficticios utiliza seed-demo."
        )
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


def link_phone(args):
    """Un operador autorizado confirma previamente la titularidad con la universidad."""
    operator_password = getpass.getpass("Contraseña del administrador del portal: ")
    try:
        normalized = normalize_phone(args.phone) if args.phone else None
    except ValueError as exc:
        raise SystemExit(str(exc))
    with SessionLocal() as db:
        operator = db.scalar(
            select(User).where(User.email == args.actor.strip().lower())
        )
        if (
            not operator
            or operator.role != "administrador"
            or not verify_password(operator_password, operator.password)
        ):
            raise SystemExit("Operador no autorizado.")
        user = db.scalar(
            select(User)
            .where(User.email == args.email.strip().lower())
            .with_for_update()
        )
        if not user:
            raise SystemExit("Cuenta no disponible.")
        if os.getenv("APP_ENV") == "production" and not institutional_email(user.email):
            raise SystemExit("La cuenta debe ser institucional.")
        try:
            user.login_phone = normalized
            db.execute(delete(Session).where(Session.user_id == user.id))
            db.add(
                AccountEvent(
                    user_id=user.id,
                    actor_id=operator.id,
                    action="Teléfono de acceso vinculado por operador"
                    if normalized
                    else "Teléfono de acceso desvinculado por operador",
                )
            )
            db.commit()
        except IntegrityError:
            db.rollback()
            raise SystemExit(
                "No se pudo vincular: el número ya pertenece a otra cuenta."
            )
    print("Vinculación actualizada; sesiones anteriores revocadas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("seed-demo")
    users = sub.add_parser("create-user")
    users.add_argument("--email", required=True)
    users.add_argument("--name", required=True)
    users.add_argument("--role", choices=ROLES, required=True)
    phone = sub.add_parser(
        "link-phone",
        help="Vincular solo después de verificar titularidad institucional.",
    )
    phone.add_argument(
        "--actor",
        required=True,
        help="Cuenta administradora que autoriza la operación.",
    )
    phone.add_argument("--email", required=True)
    phone_group = phone.add_mutually_exclusive_group(required=True)
    phone_group.add_argument("--phone")
    phone_group.add_argument("--remove", action="store_true")
    args = parser.parse_args()
    if args.command == "seed-demo":
        seed()
    elif args.command == "create-user":
        create_user(args)
    else:
        link_phone(args)
