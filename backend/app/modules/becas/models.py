from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, DateTime, Boolean, Float, Integer, Index, Numeric
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column
from ...core.database import Base
from ...core.models import now, uid


class ScholarshipCall(Base):
    __tablename__ = "scholarship_calls"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    title: Mapped[str] = mapped_column(String(150))
    modalidad: Mapped[str] = mapped_column(String(30), index=True)
    description: Mapped[str] = mapped_column(Text)
    min_gpa: Mapped[float] = mapped_column(Float, default=8.0)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    slots: Mapped[int] = mapped_column(Integer, default=50)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_questions: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("ix_scholarship_calls_code", "code"),)


class ScholarshipApplication(Base):
    __tablename__ = "scholarship_applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    folio: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)
    call_id: Mapped[int] = mapped_column(ForeignKey("scholarship_calls.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(25), default="recibida")
    gpa: Mapped[float] = mapped_column(Float)
    academic_term: Mapped[str] = mapped_column(String(50))
    major: Mapped[str] = mapped_column(String(150))
    socioeconomic_score: Mapped[float] = mapped_column(Float, default=50.0)
    custom_answers: Mapped[str] = mapped_column(Text, default="{}")
    committee_notes: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("one_scholarship_application", "call_id", "user_id", unique=True), Index("ix_scholarship_app_call_id", "call_id"), Index("ix_scholarship_app_user_id", "user_id"), Index("ix_scholarship_app_status", "status"))


class ScholarshipDocument(Base):
    __tablename__ = "scholarship_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id")
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
        Index("ix_scholarship_docs_app_id", "application_id"),
    )


class ScholarshipSocioeconomic(Base):
    __tablename__ = "scholarship_socioeconomic"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"), unique=True
    )
    monthly_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    monthly_expenses: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    dependents_count: Mapped[int] = mapped_column(Integer, default=1)
    housing_type: Mapped[str] = mapped_column(String(30), default="propia")
    vulnerability_score: Mapped[float] = mapped_column(Float, default=50.0)
    details: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("ix_scholarship_socio_user_id", "user_id"),)


class ScholarshipPaymentOrder(Base):
    __tablename__ = "scholarship_payment_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id")
    )
    folio_orden: Mapped[str] = mapped_column(String(30), unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    period: Mapped[str] = mapped_column(String(50))
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(25), default="programada")
    reference: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("one_scholarship_payment_period", "application_id", "period", unique=True), Index("ix_scholarship_orders_app_id", "application_id"))


class ScholarshipRenewal(Base):
    __tablename__ = "scholarship_renewals"
    id: Mapped[int] = mapped_column(primary_key=True)
    original_application_id: Mapped[int] = mapped_column(
        ForeignKey("scholarship_applications.id")
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    current_gpa: Mapped[float] = mapped_column(Float)
    academic_term: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(25), default="solicitada")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("one_scholarship_renewal_term", "original_application_id", "academic_term", unique=True),)


class ScholarshipAuditLog(Base):
    __tablename__ = "scholarship_audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    target_type: Mapped[str] = mapped_column(String(50))
    target_id: Mapped[str] = mapped_column(String(50))
    details: Mapped[str] = mapped_column(Text, default="")
    ip_address: Mapped[str] = mapped_column(String(45), default="127.0.0.1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    __table_args__ = (Index("ix_scholarship_audit_user_id", "user_id"),)
