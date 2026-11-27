"""Crear modulo de autoevaluacion"""
from alembic import op
import sqlalchemy as sa
revision = '61dbabf45860'
down_revision = '0007'
branch_labels = None
depends_on = None
def upgrade():
    
    op.create_table('self_evaluation_questionnaires',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('definition', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('version >= 1', name='valid_self_evaluation_questionnaire_version'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('title', 'version', name='one_self_evaluation_questionnaire_version')
    )
    op.create_table('self_evaluations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('questionnaire_id', sa.Integer(), nullable=False),
    sa.Column('subject', sa.String(length=150), nullable=False),
    sa.Column('group_name', sa.String(length=80), nullable=False),
    sa.Column('partial', sa.String(length=50), nullable=False),
    sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("status IN ('borrador', 'abierta', 'cerrada')", name='valid_self_evaluation_status'),
    sa.CheckConstraint('end_date > start_date', name='valid_self_evaluation_dates'),
    sa.CheckConstraint('version >= 1', name='valid_self_evaluation_version'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['questionnaire_id'], ['self_evaluation_questionnaires.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_self_evaluation_group_subject', 'self_evaluations', ['group_name', 'subject'], unique=False)
    op.create_index(op.f('ix_self_evaluations_created_by'), 'self_evaluations', ['created_by'], unique=False)
    op.create_index(op.f('ix_self_evaluations_questionnaire_id'), 'self_evaluations', ['questionnaire_id'], unique=False)
    op.create_table('self_evaluation_assignments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('evaluation_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['evaluation_id'], ['self_evaluations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('evaluation_id', 'student_id', name='one_self_evaluation_assignment')
    )
    op.create_index(op.f('ix_self_evaluation_assignments_evaluation_id'), 'self_evaluation_assignments', ['evaluation_id'], unique=False)
    op.create_index(op.f('ix_self_evaluation_assignments_student_id'), 'self_evaluation_assignments', ['student_id'], unique=False)
    op.create_table('self_evaluation_submissions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('assignment_id', sa.Integer(), nullable=False),
    sa.Column('answers', sa.Text(), nullable=False),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['assignment_id'], ['self_evaluation_assignments.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('assignment_id')
    )
   
def downgrade():
    
    op.drop_table('self_evaluation_submissions')
    op.drop_index(op.f('ix_self_evaluation_assignments_student_id'), table_name='self_evaluation_assignments')
    op.drop_index(op.f('ix_self_evaluation_assignments_evaluation_id'), table_name='self_evaluation_assignments')
    op.drop_table('self_evaluation_assignments')
    op.drop_index(op.f('ix_self_evaluations_questionnaire_id'), table_name='self_evaluations')
    op.drop_index(op.f('ix_self_evaluations_created_by'), table_name='self_evaluations')
    op.drop_index('ix_self_evaluation_group_subject', table_name='self_evaluations')
    op.drop_table('self_evaluations')
    op.drop_table('self_evaluation_questionnaires')
