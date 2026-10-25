"""Persistencia de evaluación docente con asignaciones y respuesta única."""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("evaluation_questionnaires",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("title", "version", name="one_questionnaire_version"))
    op.create_table("evaluation_periods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("questionnaire_id", sa.Integer(), sa.ForeignKey("evaluation_questionnaires.id"), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("minimum_responses", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("evaluation_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("period_id", sa.Integer(), sa.ForeignKey("evaluation_periods.id"), nullable=False),
        sa.Column("student_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("subject", sa.String(150), nullable=False),
        sa.Column("group_name", sa.String(80), nullable=False),
        sa.UniqueConstraint("period_id", "student_id", "teacher_id", "subject", name="one_evaluation_assignment"))
    for column in ("period_id", "student_id", "teacher_id"):
        op.create_index(f"ix_evaluation_assignments_{column}", "evaluation_assignments", [column])
    op.create_table("evaluation_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("evaluation_assignments.id"), nullable=False, unique=True),
        sa.Column("answers", sa.Text(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("public_comment", sa.Text(), nullable=False),
        sa.Column("comment_reviewed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("evaluation_improvement_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("period_id", sa.Integer(), sa.ForeignKey("evaluation_periods.id"), nullable=False),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("period_id", "teacher_id", name="one_evaluation_plan"))


def downgrade():
    for table in ("evaluation_improvement_plans", "evaluation_submissions", "evaluation_assignments", "evaluation_periods", "evaluation_questionnaires"):
        op.drop_table(table)
