from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base
from ...core.models import now


class SelfEvaluationQuestionnaire(Base):
    """Cuestionario versionado de autoevaluación."""

    __tablename__ = "self_evaluation_questionnaires"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    version: Mapped[int] = mapped_column(Integer, default=1)
    definition: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=now,
    )

    __table_args__ = (
        UniqueConstraint(
            "title",
            "version",
            name="one_self_evaluation_questionnaire_version",
        ),
        CheckConstraint(
            "version >= 1",
            name="valid_self_evaluation_questionnaire_version",
        ),
    )


class SelfEvaluation(Base):
    """Autoevaluación asociada a una asignatura, grupo y parcial."""

    __tablename__ = "self_evaluations"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String(150))

    questionnaire_id: Mapped[int] = mapped_column(
        ForeignKey(
            "self_evaluation_questionnaires.id",
            ondelete="RESTRICT",
        ),
        index=True,
    )

    subject: Mapped[str] = mapped_column(String(150))
    group_name: Mapped[str] = mapped_column(String(80))
    partial: Mapped[str] = mapped_column(String(50))

    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="borrador",
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    created_by: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=now,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('borrador', 'abierta', 'cerrada')",
            name="valid_self_evaluation_status",
        ),
        CheckConstraint(
            "version >= 1",
            name="valid_self_evaluation_version",
        ),
        CheckConstraint(
            "end_date > start_date",
            name="valid_self_evaluation_dates",
        ),
        Index(
            "ix_self_evaluation_group_subject",
            "group_name",
            "subject",
        ),
    )


class SelfEvaluationAssignment(Base):
    """Asignación individual de una autoevaluación a un estudiante."""

    __tablename__ = "self_evaluation_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)

    evaluation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "self_evaluations.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    student_id: Mapped[str] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=now,
    )

    __table_args__ = (
        UniqueConstraint(
            "evaluation_id",
            "student_id",
            name="one_self_evaluation_assignment",
        ),
    )


class SelfEvaluationSubmission(Base):
    """Respuesta definitiva enviada por un estudiante."""

    __tablename__ = "self_evaluation_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "self_evaluation_assignments.id",
            ondelete="RESTRICT",
        ),
        unique=True,
    )

    answers: Mapped[str] = mapped_column(Text)

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=now,
    )