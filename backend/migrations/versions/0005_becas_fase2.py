"""Fase 2 de becas: dispersion bancaria CLABE, actas de dictamen, validacion socioeconomica y resolucion de renovaciones."""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)

    app_cols = [c["name"] for c in insp.get_columns("scholarship_applications")]
    with op.batch_alter_table("scholarship_applications") as batch_op:
        if "bank_name" not in app_cols:
            batch_op.add_column(sa.Column("bank_name", sa.String(50), nullable=True))
        if "bank_clabe" not in app_cols:
            batch_op.add_column(sa.Column("bank_clabe", sa.String(18), nullable=True))
        if "bank_account_holder" not in app_cols:
            batch_op.add_column(sa.Column("bank_account_holder", sa.String(150), nullable=True))
        if "dictamen_session" not in app_cols:
            batch_op.add_column(sa.Column("dictamen_session", sa.String(50), nullable=True))
        if "dictamen_agreement" not in app_cols:
            batch_op.add_column(sa.Column("dictamen_agreement", sa.String(50), nullable=True))
        if "dictamen_date" not in app_cols:
            batch_op.add_column(sa.Column("dictamen_date", sa.DateTime(timezone=True), nullable=True))

    order_cols = [c["name"] for c in insp.get_columns("scholarship_payment_orders")]
    with op.batch_alter_table("scholarship_payment_orders") as batch_op:
        if "bank_name" not in order_cols:
            batch_op.add_column(sa.Column("bank_name", sa.String(50), nullable=True))
        if "bank_clabe" not in order_cols:
            batch_op.add_column(sa.Column("bank_clabe", sa.String(18), nullable=True))
        if "batch_folio" not in order_cols:
            batch_op.add_column(sa.Column("batch_folio", sa.String(50), nullable=True))
        if "dispersed_at" not in order_cols:
            batch_op.add_column(sa.Column("dispersed_at", sa.DateTime(timezone=True), nullable=True))

    socio_cols = [c["name"] for c in insp.get_columns("scholarship_socioeconomic")]
    with op.batch_alter_table("scholarship_socioeconomic") as batch_op:
        if "validation_status" not in socio_cols:
            batch_op.add_column(sa.Column("validation_status", sa.String(30), nullable=False, server_default="pendiente"))
        if "verified_by_user_id" not in socio_cols:
            batch_op.add_column(sa.Column("verified_by_user_id", sa.String(36), sa.ForeignKey("users.id", name="fk_socio_verified_user"), nullable=True))
        if "validation_notes" not in socio_cols:
            batch_op.add_column(sa.Column("validation_notes", sa.Text(), nullable=False, server_default=""))
        if "verified_score" not in socio_cols:
            batch_op.add_column(sa.Column("verified_score", sa.Float(), nullable=True))

    renewal_cols = [c["name"] for c in insp.get_columns("scholarship_renewals")]
    with op.batch_alter_table("scholarship_renewals") as batch_op:
        if "reviewed_by_user_id" not in renewal_cols:
            batch_op.add_column(sa.Column("reviewed_by_user_id", sa.String(36), sa.ForeignKey("users.id", name="fk_renewals_reviewed_user"), nullable=True))
        if "reviewed_at" not in renewal_cols:
            batch_op.add_column(sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
        if "resolution_notes" not in renewal_cols:
            batch_op.add_column(sa.Column("resolution_notes", sa.Text(), nullable=False, server_default=""))


def downgrade():
    with op.batch_alter_table("scholarship_renewals") as batch_op:
        batch_op.drop_column("resolution_notes")
        batch_op.drop_column("reviewed_at")
        batch_op.drop_column("reviewed_by_user_id")

    with op.batch_alter_table("scholarship_socioeconomic") as batch_op:
        batch_op.drop_column("verified_score")
        batch_op.drop_column("validation_notes")
        batch_op.drop_column("verified_by_user_id")
        batch_op.drop_column("validation_status")

    with op.batch_alter_table("scholarship_payment_orders") as batch_op:
        batch_op.drop_column("dispersed_at")
        batch_op.drop_column("batch_folio")
        batch_op.drop_column("bank_clabe")
        batch_op.drop_column("bank_name")

    with op.batch_alter_table("scholarship_applications") as batch_op:
        batch_op.drop_column("dictamen_date")
        batch_op.drop_column("dictamen_agreement")
        batch_op.drop_column("dictamen_session")
        batch_op.drop_column("bank_account_holder")
        batch_op.drop_column("bank_clabe")
        batch_op.drop_column("bank_name")
