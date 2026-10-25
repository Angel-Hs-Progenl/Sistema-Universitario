"""Integra docente, origen de sesión y restricciones de integridad de Becas.

No elimina filas. Si existen duplicados heredados, se detiene para conciliarlos.
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

UNIQUE = [
    ("scholarship_applications", "one_scholarship_application", ["call_id", "user_id"]),
    ("scholarship_payment_orders", "one_scholarship_payment_period", ["application_id", "period"]),
    ("scholarship_renewals", "one_scholarship_renewal_term", ["original_application_id", "academic_term"]),
]
MONEY = {"scholarship_calls": ["amount"], "scholarship_payment_orders": ["amount"], "scholarship_socioeconomic": ["monthly_income", "monthly_expenses"]}


def upgrade():
    connection = op.get_bind()
    for table, name, columns in UNIQUE:
        grouped = ", ".join(columns)
        duplicates = connection.execute(sa.text(f"SELECT 1 FROM {table} GROUP BY {grouped} HAVING COUNT(*) > 1")).first()
        if duplicates:
            raise RuntimeError(f"Conciliar duplicados de {table} antes de migrar; no se eliminó ningún registro.")
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("valid_role", type_="check")
        batch.create_check_constraint("valid_role", "role IN ('estudiante','docente','escolares','administrador','tesoreria','vinculacion','evaluador','auditor')")
    op.add_column("sessions", sa.Column("auth_method", sa.String(20), nullable=False, server_default="password"))
    for table, name, columns in UNIQUE:
        op.create_index(name, table, columns, unique=True)
    for table, columns in MONEY.items():
        with op.batch_alter_table(table) as batch:
            for column in columns:
                batch.alter_column(column, type_=sa.Numeric(12, 2), existing_type=sa.Float(), existing_nullable=False)


def downgrade():
    # Retirar docente sin conciliar sus cuentas destruiría la compatibilidad.
    connection = op.get_bind()
    if connection.execute(sa.text("SELECT 1 FROM users WHERE role = 'docente' LIMIT 1")).first():
        raise RuntimeError("No se puede retirar el rol docente mientras existan cuentas con ese rol.")
    for table, columns in MONEY.items():
        with op.batch_alter_table(table) as batch:
            for column in columns:
                batch.alter_column(column, type_=sa.Float(), existing_type=sa.Numeric(12, 2), existing_nullable=False)
    for table, name, columns in UNIQUE:
        op.drop_index(name, table_name=table)
    op.drop_column("sessions", "auth_method")
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("valid_role", type_="check")
        batch.create_check_constraint("valid_role", "role IN ('estudiante','escolares','administrador','tesoreria','vinculacion','evaluador','auditor')")
