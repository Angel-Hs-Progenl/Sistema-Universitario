from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base
from ...core.models import now


class PeerQuestionnaire(Base):
    __tablename__ = "peer_questionnaires"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    version: Mapped[int] = mapped_column(Integer)
    definition: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    __table_args__ = (
        UniqueConstraint("title", "version", name="one_peer_questionnaire_version"),
        CheckConstraint("version >= 1", name="valid_peer_questionnaire_version"),
    )


class PeerActivity(Base):
    __tablename__ = "peer_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("peer_questionnaires.id", ondelete="RESTRICT"), index=True)
    subject: Mapped[str] = mapped_column(String(150))
    group_name: Mapped[str] = mapped_column(String(80))
    partial: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="borrador")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    __table_args__ = (
        CheckConstraint("status IN ('borrador', 'abierta', 'cerrada')", name="valid_peer_activity_status"),
        CheckConstraint("version >= 1", name="valid_peer_activity_version"),
        CheckConstraint("end_date > start_date", name="valid_peer_activity_dates"),
    )


class PeerAssignment(Base):
    __tablename__ = "peer_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    activity_id: Mapped[int] = mapped_column(ForeignKey("peer_activities.id", ondelete="RESTRICT"), index=True)
    evaluator_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    peer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    __table_args__ = (
        UniqueConstraint("activity_id", "evaluator_id", "peer_id", name="one_peer_assignment_pair"),
        CheckConstraint("evaluator_id <> peer_id", name="peer_assignment_distinct_students"),
    )


class PeerSubmission(Base):
    __tablename__ = "peer_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("peer_assignments.id", ondelete="RESTRICT"), unique=True)
    scores: Mapped[str] = mapped_column(Text)
    strength: Mapped[str] = mapped_column(Text, default="")
    improvement: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
