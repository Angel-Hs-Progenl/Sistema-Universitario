"""Conservar datos del expediente al momento del envío."""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "title_applications",
        sa.Column("profile_snapshot", sa.Text(), nullable=False, server_default="{}"),
    )


def downgrade():
    op.drop_column("title_applications", "profile_snapshot")
