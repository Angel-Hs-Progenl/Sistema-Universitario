import os
from pathlib import Path
import subprocess
import sys
from sqlalchemy import func, select
from app.core.database import SessionLocal
from app.core.models import User
from app.modules.becas.models import ScholarshipPaymentOrder, ScholarshipApplication, ScholarshipDocument
from app.modules.becas.domain import DOCUMENTOS
from app.modules.evaluacion_docente.models import Assignment, Submission


def test_migrations_register_all_modules_without_importing_main(tmp_path):
    """Un proceso de Alembic nuevo no depende de que Uvicorn importe los modelos."""
    root = Path(__file__).resolve().parents[2]
    env = dict(os.environ, DATABASE_URL="sqlite:///" + (tmp_path / "schema.sqlite").as_posix(),
        DATA_DIR=str(tmp_path / "files"), APP_ENV="test", GOOGLE_CLIENT_ID="", GOOGLE_CLIENT_SECRET="", SMTP_HOST="", SMTP_PASSWORD="")
    source = "from alembic import command; from alembic.config import Config; c=Config('backend/alembic.ini'); command.upgrade(c,'head'); command.check(c)"
    result = subprocess.run([sys.executable, "-c", source], cwd=root, env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr


def test_development_seed_is_idempotent_and_has_no_fake_bank_reference():
    import manage
    manage.seed()
    with SessionLocal() as db:
        first = [db.scalar(select(func.count()).select_from(table)) for table in (User, Assignment, Submission)]
        assert db.scalar(select(User).where(User.role == "docente"))
    manage.seed()
    with SessionLocal() as db:
        assert first == [db.scalar(select(func.count()).select_from(table)) for table in (User, Assignment, Submission)]
        assert all(not order.reference for order in db.scalars(select(ScholarshipPaymentOrder)))
        approved = db.scalar(select(ScholarshipApplication).where(ScholarshipApplication.status == "aprobada"))
        validated = set(db.scalars(select(ScholarshipDocument.kind).where(ScholarshipDocument.application_id == approved.id, ScholarshipDocument.status == "validado")))
        assert {d["id"] for d in DOCUMENTOS if d["required"]} <= validated
