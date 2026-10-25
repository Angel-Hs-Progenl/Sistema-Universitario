"""Operación local de PostgreSQL sin mostrar credenciales ni borrar registros."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic import command


def config():
    return Config(str(ROOT / "backend/alembic.ini"))


def url():
    load_dotenv(ROOT / ".env")
    value = make_url(os.getenv("DATABASE_URL", ""))
    if value.drivername != "postgresql+psycopg":
        raise RuntimeError("DATABASE_URL debe utilizar postgresql+psycopg.")
    return value


def check(schema=True):
    value = url()
    from app.core.database import engine
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        if schema:
            revisions = set(connection.scalars(text("SELECT version_num FROM alembic_version")))
            if revisions != set(ScriptDirectory.from_config(config()).get_heads()):
                raise RuntimeError("Hay migraciones pendientes. Ejecuta python scripts/database.py migrate antes de iniciar.")
    print(f"PostgreSQL disponible en {value.host}:{value.port or 5432}; esquema {'actualizado' if schema else 'sin comprobar'}.")


def backup():
    value = url()
    binary = shutil.which("pg_dump")
    if not binary:
        candidate = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "PostgreSQL/16/bin/pg_dump.exe"
        if candidate.is_file():
            binary = str(candidate)
    target = ROOT / "data/backups" / datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    target.mkdir(parents=True, exist_ok=False)
    env = dict(os.environ, PGPASSWORD=value.password or "")
    if binary:
        result = subprocess.run([binary, "-h", value.host or "127.0.0.1", "-p", str(value.port or 5432), "-U", value.username or "uto", "-d", value.database, "-Fc", "-f", str(target / "database.dump")], env=env, capture_output=True)
    elif shutil.which("docker") and value.host in ("127.0.0.1", "localhost") and value.port == int(os.getenv("POSTGRES_PORT", "5433")) and value.username == "uto" and value.database == "uto":
        with (target / "database.dump").open("wb") as dump:
            result = subprocess.run(["docker", "compose", "exec", "-T", "db", "pg_dump", "-U", "uto", "-d", "uto", "-Fc"], stdout=dump, stderr=subprocess.PIPE)
    else:
        raise RuntimeError("Instala pg_dump 16 o usa la configuración local de Docker para respaldar antes de migrar.")
    if result.returncode:
        raise RuntimeError("Falló el respaldo PostgreSQL; no se aplicarán migraciones. Revisa conexión, permisos y versión de pg_dump.")
    from app.core.database import DATA_DIR
    if (DATA_DIR / "uploads").exists():
        shutil.copytree(DATA_DIR / "uploads", target / "uploads")
    print("Respaldo privado creado:", target.relative_to(ROOT))
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("check", "ping", "backup", "migrate", "connection"))
    args = parser.parse_args()
    os.chdir(ROOT)
    if args.action == "connection":
        value = url()
        print(json.dumps({"host": value.host, "port": value.port or 5432, "database": value.database}))
    elif args.action in ("check", "ping"):
        check(args.action == "check")
    elif args.action == "backup":
        backup()
    else:
        check(False)
        backup()
        command.upgrade(config(), "head")
        check(True)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
    except (SQLAlchemyError, ValueError, OSError):
        # No imprimir excepciones de conexión que puedan contener secretos o PII.
        print("No se completó la operación. Verifica PostgreSQL, DATABASE_URL, pg_dump y las migraciones. No se borraron datos.", file=sys.stderr)
        raise SystemExit(1)
