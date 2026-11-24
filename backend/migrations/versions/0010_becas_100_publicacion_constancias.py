"""Cierre al 100% de becas: publicacion formal de resultados y constancias de asignacion."""

from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)

    call_cols = [c["name"] for c in insp.get_columns("scholarship_calls")]
    if "results_published" not in call_cols:
        op.add_column("scholarship_calls", sa.Column("results_published", sa.Boolean(), nullable=False, server_default=sa.false()))

    app_cols = [c["name"] for c in insp.get_columns("scholarship_applications")]
    if "constancia_folio" not in app_cols:
        op.add_column("scholarship_applications", sa.Column("constancia_folio", sa.String(50), nullable=True))


def downgrade():
    conn = op.get_bind()
    if conn.dialect.name == "sqlite":
        conn.execute(sa.text("PRAGMA foreign_keys=OFF"))
    with op.batch_alter_table("scholarship_applications") as batch_op:
        batch_op.drop_column("constancia_folio")
    with op.batch_alter_table("scholarship_calls") as batch_op:
        batch_op.drop_column("results_published")
    if conn.dialect.name == "sqlite":
        conn.execute(sa.text("PRAGMA foreign_keys=ON"))
