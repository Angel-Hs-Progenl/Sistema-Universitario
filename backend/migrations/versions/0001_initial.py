"""Identidad compartida y expedientes de titulación."""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("role", sa.String(25), nullable=False),
        sa.Column("password", sa.Text(), nullable=False),
        sa.Column("profile", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "role IN ('estudiante','escolares','administrador','tesoreria','vinculacion')",
            name="valid_role",
        ),
    )
    op.create_table(
        "sessions",
        sa.Column("token", sa.String(64), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("csrf", sa.String(64), nullable=False),
        sa.Column("expires", sa.Integer(), nullable=False),
    )
    op.create_table(
        "password_resets",
        sa.Column("token", sa.String(64), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("expires", sa.Integer(), nullable=False),
    )
    op.create_table(
        "title_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("folio", sa.String(30), unique=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("status", sa.String(25), nullable=False, index=True),
        sa.Column("clearance", sa.Boolean(), nullable=False),
        sa.Column("clearance_note", sa.Text(), nullable=False),
        sa.Column("reference", sa.String(150), nullable=False),
        sa.Column("delivery", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('borrador','enviada','revision','incompleta','rechazada','validada','proceso','tramite','disponible','concluido','cancelado')",
            name="valid_title_state",
        ),
    )
    op.create_index(
        "one_active_title",
        "title_applications",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status <> 'cancelado'"),
        sqlite_where=sa.text("status <> 'cancelado'"),
    )
    op.create_table(
        "title_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "application_id",
            sa.Integer(),
            sa.ForeignKey("title_applications.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("kind", sa.String(25), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("stored_name", sa.String(80), nullable=False),
        sa.Column("mime", sa.String(80), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(25), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('recibido','validado','rechazado')", name="valid_document_state"
        ),
    )
    op.create_index(
        "one_document_kind", "title_documents", ["application_id", "kind"], unique=True
    )
    op.create_table(
        "title_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "application_id",
            sa.Integer(),
            sa.ForeignKey("title_applications.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "application_id", sa.Integer(), sa.ForeignKey("title_applications.id")
        ),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("seen", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    for table in [
        "notifications",
        "title_events",
        "title_documents",
        "title_applications",
        "password_resets",
        "sessions",
        "users",
    ]:
        op.drop_table(table)
