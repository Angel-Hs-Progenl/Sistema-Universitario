"""Destinos explícitos de avisos entre módulos; conserva los avisos heredados."""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notifications", sa.Column("target_path", sa.String(240), nullable=False, server_default=""))


def downgrade():
    op.drop_column("notifications", "target_path")
