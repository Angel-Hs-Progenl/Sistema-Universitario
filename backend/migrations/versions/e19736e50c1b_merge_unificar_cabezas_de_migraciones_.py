"""merge: unificar cabezas de migraciones con main"""
from alembic import op
import sqlalchemy as sa
revision = 'e19736e50c1b'
down_revision = ('0012', '7f9bb08538dd')
branch_labels = None
depends_on = None
def upgrade():
    pass
def downgrade():
    pass
