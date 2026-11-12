"""Becas UTO: Porcentajes de beca/pago y emision de ordenes en Pagos en Linea Gobierno de Puebla."""

from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    insp = sa.inspect(conn)

    app_cols = [c["name"] for c in insp.get_columns("scholarship_applications")]
    with op.batch_alter_table("scholarship_applications") as batch_op:
        if "discount_percentage" not in app_cols:
            batch_op.add_column(sa.Column("discount_percentage", sa.Float(), nullable=True))
        if "student_percentage" not in app_cols:
            batch_op.add_column(sa.Column("student_percentage", sa.Float(), nullable=True))

    order_cols = [c["name"] for c in insp.get_columns("scholarship_payment_orders")]
    with op.batch_alter_table("scholarship_payment_orders") as batch_op:
        if "cuota_base" not in order_cols:
            batch_op.add_column(sa.Column("cuota_base", sa.Float(), nullable=True))
        if "discount_percentage" not in order_cols:
            batch_op.add_column(sa.Column("discount_percentage", sa.Float(), nullable=True))
        if "student_percentage" not in order_cols:
            batch_op.add_column(sa.Column("student_percentage", sa.Float(), nullable=True))
        if "puebla_reference" not in order_cols:
            batch_op.add_column(sa.Column("puebla_reference", sa.String(100), nullable=True))
        if "puebla_url" not in order_cols:
            batch_op.add_column(sa.Column("puebla_url", sa.String(255), nullable=True))
        if "paid_at" not in order_cols:
            batch_op.add_column(sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table("scholarship_applications") as batch_op:
        batch_op.drop_column("student_percentage")
        batch_op.drop_column("discount_percentage")

    with op.batch_alter_table("scholarship_payment_orders") as batch_op:
        batch_op.drop_column("paid_at")
        batch_op.drop_column("puebla_url")
        batch_op.drop_column("puebla_reference")
        batch_op.drop_column("student_percentage")
        batch_op.drop_column("discount_percentage")
        batch_op.drop_column("cuota_base")
