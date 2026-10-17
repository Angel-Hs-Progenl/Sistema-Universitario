from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, DateTime, Boolean, Float, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column
from ...core.database import Base
from ...core.models import now, uid


class ScholarshipCall(Base):
    __tablename__ = "scholarship_calls"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(150))
    modalidad: Mapped[str] = mapped_column(String(30), index=True)
    description: Mapped[str] = mapped_column(Text)
    min_gpa: Mapped[float] = mapped_column(Float, default=8.0)
    amount: Mapped[float] = mapped_column(Float, default=3000.0)
    slots: Mapped[int] = mapped_column(Integer, default=50)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_questions: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ScholarshipApplication(Base):
    __tablename__ = "scholarship_applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    folio: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
    call_id: Mapped[int] = mapped_column(ForeignKey("scholarship_calls.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(25), default="recibida", index=True)
    gpa: Mapped[float] = mapped_column(Float)
    academic_term: Mapped[str] = mapped_column(String(50))
    major: Mapped[str] = mapped_column(String(150))
    socioeconomic_score: Mapped[float] = mapped_column(Float, default=50.0)
    custom_answers: Mapped[str] = mapped_column(Text, default="{}")
    committee_notes: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ScholarshipDocument(Base):
    __tablename__ = "scholarship_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id"), index=True
    )
    kind: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(200))
    stored_name: Mapped[str] = mapped_column(String(80))
    mime: Mapped[str] = mapped_column(String(80))
    size: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(25), default="recibido")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (
        Index("one_scholarship_doc_kind", "application_id", "kind", unique=True),
    )


class ScholarshipSocioeconomic(Base):
    __tablename__ = "scholarship_socioeconomic"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    monthly_income: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    dependents_count: Mapped[int] = mapped_column(Integer, default=1)
    housing_type: Mapped[str] = mapped_column(String(30), default="propia")
    vulnerability_score: Mapped[float] = mapped_column(Float, default=50.0)
    details: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ScholarshipPaymentOrder(Base):
    __tablename__ = "scholarship_payment_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id"), index=True
    )
    folio_orden: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    amount: Mapped[float] = mapped_column(Float)
    period: Mapped[str] = mapped_column(String(50))
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(25), default="programada")
    reference: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ScholarshipRenewal(Base):
    __tablename__ = "scholarship_renewals"
    id: Mapped[int] = mapped_column(primary_key=True)
    original_application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    current_gpa: Mapped[float] = mapped_column(Float)
    academic_term: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(25), default="solicitada")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ScholarshipAuditLog(Base):
    __tablename__ = "scholarship_audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100))
    target_type: Mapped[str] = mapped_column(String(50))
    target_id: Mapped[str] = mapped_column(String(50))
    details: Mapped[str] = mapped_column(Text, default="")
    ip_address: Mapped[str] = mapped_column(String(45), default="127.0.0.1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
