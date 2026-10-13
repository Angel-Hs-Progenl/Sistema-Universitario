"""Identidad institucional, vinculación de teléfono y preferencias de cuenta."""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("display_name", sa.String(80), nullable=False, server_default=""),
    )
    op.add_column("users", sa.Column("login_phone", sa.String(16), nullable=True))
    op.add_column("users", sa.Column("google_sub", sa.String(255), nullable=True))
    op.create_index("unique_login_phone", "users", ["login_phone"], unique=True)
    op.create_index("unique_google_sub", "users", ["google_sub"], unique=True)
    op.create_table(
        "oauth_attempts",
        sa.Column("state_hash", sa.String(64), primary_key=True),
        sa.Column("browser_hash", sa.String(64), nullable=False),
        sa.Column("nonce", sa.String(64), nullable=False),
        sa.Column("verifier", sa.String(128), nullable=False),
        sa.Column("next_path", sa.String(500), nullable=False),
        sa.Column("expires", sa.Integer(), nullable=False),
    )
    op.create_index("ix_oauth_attempts_expires", "oauth_attempts", ["expires"])
    op.create_table(
        "account_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_account_events_user_id", "account_events", ["user_id"])


def downgrade():
    op.drop_table("account_events")
    op.drop_table("oauth_attempts")
    op.drop_index("unique_google_sub", table_name="users")
    op.drop_index("unique_login_phone", table_name="users")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "login_phone")
    op.drop_column("users", "display_name")
