"""Módulo de becas: convocatorias, solicitudes, estudio socioeconómico, dictamen, órdenes y auditoría."""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("valid_role", type_="check")
        batch_op.create_check_constraint(
            "valid_role",
            "role IN ('estudiante','escolares','administrador','tesoreria','vinculacion','evaluador','auditor')",
        )

    op.create_table(
        "scholarship_calls",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(30), nullable=False, unique=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("modalidad", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("min_gpa", sa.Float(), nullable=False, server_default="8.0"),
        sa.Column("amount", sa.Float(), nullable=False, server_default="3000.0"),
        sa.Column("slots", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("custom_questions", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_calls_code", "scholarship_calls", ["code"])
    op.create_index("ix_scholarship_calls_modalidad", "scholarship_calls", ["modalidad"])

    op.create_table(
        "scholarship_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("folio", sa.String(30), nullable=True, unique=True),
        sa.Column("call_id", sa.Integer(), sa.ForeignKey("scholarship_calls.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(25), nullable=False, server_default="recibida"),
        sa.Column("gpa", sa.Float(), nullable=False),
        sa.Column("academic_term", sa.String(50), nullable=False),
        sa.Column("major", sa.String(150), nullable=False),
        sa.Column("socioeconomic_score", sa.Float(), nullable=False, server_default="50.0"),
        sa.Column("custom_answers", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("committee_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_app_user_id", "scholarship_applications", ["user_id"])
    op.create_index("ix_scholarship_app_call_id", "scholarship_applications", ["call_id"])
    op.create_index("ix_scholarship_app_status", "scholarship_applications", ["status"])

    op.create_table(
        "scholarship_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("scholarship_applications.id"), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("stored_name", sa.String(80), nullable=False),
        sa.Column("mime", sa.String(80), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(25), nullable=False, server_default="recibido"),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_docs_app_id", "scholarship_documents", ["application_id"])
    op.create_index("one_scholarship_doc_kind", "scholarship_documents", ["application_id", "kind"], unique=True)

    op.create_table(
        "scholarship_socioeconomic",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("monthly_income", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("monthly_expenses", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("dependents_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("housing_type", sa.String(30), nullable=False, server_default="propia"),
        sa.Column("vulnerability_score", sa.Float(), nullable=False, server_default="50.0"),
        sa.Column("details", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_socio_user_id", "scholarship_socioeconomic", ["user_id"])

    op.create_table(
        "scholarship_payment_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("scholarship_applications.id"), nullable=False),
        sa.Column("folio_orden", sa.String(30), nullable=False, unique=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("period", sa.String(50), nullable=False),
        sa.Column("scheduled_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(25), nullable=False, server_default="programada"),
        sa.Column("reference", sa.String(100), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_orders_app_id", "scholarship_payment_orders", ["application_id"])

    op.create_table(
        "scholarship_renewals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("original_application_id", sa.Integer(), sa.ForeignKey("scholarship_applications.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("current_gpa", sa.Float(), nullable=False),
        sa.Column("academic_term", sa.String(50), nullable=False),
        sa.Column("status", sa.String(25), nullable=False, server_default="solicitada"),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_renewals_user_id", "scholarship_renewals", ["user_id"])

    op.create_table(
        "scholarship_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.String(50), nullable=False),
        sa.Column("details", sa.Text(), nullable=False, server_default=""),
        sa.Column("ip_address", sa.String(45), nullable=False, server_default="127.0.0.1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_audit_user_id", "scholarship_audit_logs", ["user_id"])


def downgrade():
    op.drop_table("scholarship_audit_logs")
    op.drop_table("scholarship_renewals")
    op.drop_table("scholarship_payment_orders")
    op.drop_table("scholarship_socioeconomic")
    op.drop_table("scholarship_documents")
    op.drop_table("scholarship_applications")
    op.drop_table("scholarship_calls")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("valid_role", type_="check")
        batch_op.create_check_constraint(
            "valid_role",
            "role IN ('estudiante','escolares','administrador','tesoreria','vinculacion')",
        )
