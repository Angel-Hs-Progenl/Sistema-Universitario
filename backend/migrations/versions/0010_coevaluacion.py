"""Crear coevaluación entre estudiantes.

Revision ID: 0010
Revises: 0009
"""

from alembic import op
import sqlalchemy as sa


revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "peer_questionnaires",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("version >= 1", name="valid_peer_questionnaire_version"),
        sa.UniqueConstraint("title", "version", name="one_peer_questionnaire_version"),
    )
    op.create_table(
        "peer_activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("questionnaire_id", sa.Integer(), sa.ForeignKey("peer_questionnaires.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("subject", sa.String(150), nullable=False),
        sa.Column("group_name", sa.String(80), nullable=False),
        sa.Column("partial", sa.String(50), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('borrador', 'abierta', 'cerrada')", name="valid_peer_activity_status"),
        sa.CheckConstraint("version >= 1", name="valid_peer_activity_version"),
        sa.CheckConstraint("end_date > start_date", name="valid_peer_activity_dates"),
    )
    op.create_index("ix_peer_activities_questionnaire_id", "peer_activities", ["questionnaire_id"])
    op.create_index("ix_peer_activities_created_by", "peer_activities", ["created_by"])
    op.create_table(
        "peer_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("activity_id", sa.Integer(), sa.ForeignKey("peer_activities.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("evaluator_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("peer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("evaluator_id <> peer_id", name="peer_assignment_distinct_students"),
        sa.UniqueConstraint("activity_id", "evaluator_id", "peer_id", name="one_peer_assignment_pair"),
    )
    op.create_index("ix_peer_assignments_activity_id", "peer_assignments", ["activity_id"])
    op.create_index("ix_peer_assignments_evaluator_id", "peer_assignments", ["evaluator_id"])
    op.create_index("ix_peer_assignments_peer_id", "peer_assignments", ["peer_id"])
    op.create_table(
        "peer_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("peer_assignments.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("scores", sa.Text(), nullable=False),
        sa.Column("strength", sa.Text(), nullable=False),
        sa.Column("improvement", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    op.drop_table("peer_submissions")
    op.drop_index("ix_peer_assignments_peer_id", table_name="peer_assignments")
    op.drop_index("ix_peer_assignments_evaluator_id", table_name="peer_assignments")
    op.drop_index("ix_peer_assignments_activity_id", table_name="peer_assignments")
    op.drop_table("peer_assignments")
    op.drop_index("ix_peer_activities_created_by", table_name="peer_activities")
    op.drop_index("ix_peer_activities_questionnaire_id", table_name="peer_activities")
    op.drop_table("peer_activities")
    op.drop_table("peer_questionnaires")
