from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, DateTime, Boolean, Index, text
from sqlalchemy.orm import Mapped, mapped_column
from ...core.database import Base
from ...core.models import now, uid


class Application(Base):
    __tablename__ = "title_applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    folio: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(25), default="borrador", index=True)
    clearance: Mapped[bool] = mapped_column(Boolean, default=False)
    clearance_note: Mapped[str] = mapped_column(Text, default="")
    reference: Mapped[str] = mapped_column(String(150), default="")
    delivery: Mapped[str] = mapped_column(Text, default="")
    profile_snapshot: Mapped[str] = mapped_column(Text, default="{}")
    version: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (
        Index(
            "one_active_title",
            "user_id",
            unique=True,
            postgresql_where=text("status <> 'cancelado'"),
            sqlite_where=text("status <> 'cancelado'"),
        ),
    )


class Document(Base):
    __tablename__ = "title_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("title_applications.id"), index=True
    )
    kind: Mapped[str] = mapped_column(String(25))
    name: Mapped[str] = mapped_column(String(200))
    stored_name: Mapped[str] = mapped_column(String(80))
    mime: Mapped[str] = mapped_column(String(80))
    size: Mapped[int] = mapped_column()
    status: Mapped[str] = mapped_column(String(25), default="recibido")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (
        Index("one_document_kind", "application_id", "kind", unique=True),
    )


class Event(Base):
    __tablename__ = "title_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("title_applications.id"), index=True
    )
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
