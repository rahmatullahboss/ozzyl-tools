from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db


def new_id() -> str:
    return str(uuid4())


def utc_now() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(120))
    password_hash: Mapped[str | None] = mapped_column(String(255))
    locale: Mapped[str] = mapped_column(String(12), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)

    owned_workspaces: Mapped[list[Workspace]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    memberships: Mapped[list[Membership]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Workspace(TimestampMixin, db.Model):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    base_currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    owner: Mapped[User] = relationship(back_populates="owned_workspaces")
    memberships: Mapped[list[Membership]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    customers: Mapped[list[Customer]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    items: Mapped[list[Item]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    documents: Mapped[list[Document]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )


class Membership(TimestampMixin, db.Model):
    __tablename__ = "memberships"

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(24), default="member", nullable=False)

    workspace: Mapped[Workspace] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="memberships")


class Customer(TimestampMixin, db.Model):
    __tablename__ = "customers"
    __table_args__ = (Index("ix_customers_workspace_name", "workspace_id", "name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    company: Mapped[str | None] = mapped_column(String(180))
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(40))
    billing_address: Mapped[str | None] = mapped_column(Text)
    tax_id: Mapped[str | None] = mapped_column(String(80))

    workspace: Mapped[Workspace] = relationship(back_populates="customers")
    documents: Mapped[list[Document]] = relationship(back_populates="customer")


class Item(TimestampMixin, db.Model):
    __tablename__ = "items"
    __table_args__ = (
        UniqueConstraint("workspace_id", "sku", name="uq_items_workspace_sku"),
        Index("ix_items_workspace_name", "workspace_id", "name"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(18, 4), default=Decimal("0"), nullable=False
    )
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(7, 4), default=Decimal("0"), nullable=False)

    workspace: Mapped[Workspace] = relationship(back_populates="items")


class Document(TimestampMixin, db.Model):
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint("workspace_id", "document_type", "number", name="uq_documents_number"),
        Index("ix_documents_workspace_status", "workspace_id", "status"),
        Index("ix_documents_workspace_issue_date", "workspace_id", "issue_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    customer_id: Mapped[str | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), index=True
    )
    document_type: Mapped[str] = mapped_column(String(24), nullable=False)
    number: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="draft", nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    discount_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    tax_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    shipping_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    grand_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    terms: Mapped[str | None] = mapped_column(Text)

    workspace: Mapped[Workspace] = relationship(back_populates="documents")
    customer: Mapped[Customer | None] = relationship(back_populates="documents")
    lines: Mapped[list[DocumentLine]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentLine.sort_order",
    )


class DocumentLine(TimestampMixin, db.Model):
    __tablename__ = "document_lines"
    __table_args__ = (Index("ix_document_lines_document_sort", "document_id", "sort_order"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    item_id: Mapped[str | None] = mapped_column(
        ForeignKey("items.id", ondelete="SET NULL"), index=True
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(7, 4), default=0, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    document: Mapped[Document] = relationship(back_populates="lines")
