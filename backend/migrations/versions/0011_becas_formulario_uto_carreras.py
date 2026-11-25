"""Ajustes formulario oficial UTO: carreras, periodos y campos de solicitud."""

from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)

    call_cols = [c["name"] for c in insp.get_columns("scholarship_calls")]
    if "periodo_actual" not in call_cols:
        op.add_column("scholarship_calls", sa.Column("periodo_actual", sa.String(50), nullable=True, server_default="septiembre - diciembre 2026"))
    if "periodo_anterior" not in call_cols:
        op.add_column("scholarship_calls", sa.Column("periodo_anterior", sa.String(50), nullable=True, server_default="mayo - agosto 2026"))
    if "cuatrimestres_habilitados" not in call_cols:
        op.add_column("scholarship_calls", sa.Column("cuatrimestres_habilitados", sa.Text(), nullable=True, server_default='["3°", "5°", "6°", "9°"]'))
    if "carreras_habilitadas" not in call_cols:
        op.add_column("scholarship_calls", sa.Column("carreras_habilitadas", sa.Text(), nullable=True, server_default="[]"))

    app_cols = [c["name"] for c in insp.get_columns("scholarship_applications")]
    if "study_system" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("study_system", sa.String(20), nullable=True, server_default="presencial"))
    if "study_level" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("study_level", sa.String(60), nullable=True))
    if "phone" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("phone", sa.String(20), nullable=True))
    if "curp" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("curp", sa.String(25), nullable=True))
    if "gender" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("gender", sa.String(20), nullable=True))


def downgrade():
    conn = op.get_bind()
    if conn.dialect.name == "sqlite":
        conn.execute(sa.text("PRAGMA foreign_keys=OFF"))
    with op.batch_alter_table("scholarship_applications") as batch_op:
        batch_op.drop_column("gender")
        batch_op.drop_column("curp")
        batch_op.drop_column("phone")
        batch_op.drop_column("study_level")
        batch_op.drop_column("study_system")
    with op.batch_alter_table("scholarship_calls") as batch_op:
        batch_op.drop_column("carreras_habilitadas")
        batch_op.drop_column("cuatrimestres_habilitados")
        batch_op.drop_column("periodo_anterior")
        batch_op.drop_column("periodo_actual")
    if conn.dialect.name == "sqlite":
        conn.execute(sa.text("PRAGMA foreign_keys=ON"))
