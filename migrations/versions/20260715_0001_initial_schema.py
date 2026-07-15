"""Initial workspace and document schema.

Revision ID: 20260715_0001
Revises:
Create Date: 2026-07-15 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260715_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def timestamp_columns():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("locale", sa.String(length=12), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("base_currency", sa.String(length=3), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name="fk_workspaces_owner_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_workspaces"),
    )
    op.create_index("ix_workspaces_owner_id", "workspaces", ["owner_id"], unique=False)
    op.create_index("ix_workspaces_slug", "workspaces", ["slug"], unique=True)

    op.create_table(
        "memberships",
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=24), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_memberships_user_id_users", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            name="fk_memberships_workspace_id_workspaces",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("workspace_id", "user_id", name="pk_memberships"),
    )

    op.create_table(
        "customers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("company", sa.String(length=180), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("billing_address", sa.Text(), nullable=True),
        sa.Column("tax_id", sa.String(length=80), nullable=True),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            name="fk_customers_workspace_id_workspaces",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_customers"),
    )
    op.create_index("ix_customers_workspace_id", "customers", ["workspace_id"], unique=False)
    op.create_index(
        "ix_customers_workspace_name", "customers", ["workspace_id", "name"], unique=False
    )

    op.create_table(
        "items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("unit_price", sa.Numeric(18, 4), nullable=False),
        sa.Column("tax_rate", sa.Numeric(7, 4), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            name="fk_items_workspace_id_workspaces",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_items"),
        sa.UniqueConstraint("workspace_id", "sku", name="uq_items_workspace_sku"),
    )
    op.create_index("ix_items_workspace_id", "items", ["workspace_id"], unique=False)
    op.create_index("ix_items_workspace_name", "items", ["workspace_id", "name"], unique=False)

    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=True),
        sa.Column("document_type", sa.String(length=24), nullable=False),
        sa.Column("number", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("subtotal", sa.Numeric(18, 4), nullable=False),
        sa.Column("discount_total", sa.Numeric(18, 4), nullable=False),
        sa.Column("tax_total", sa.Numeric(18, 4), nullable=False),
        sa.Column("shipping_total", sa.Numeric(18, 4), nullable=False),
        sa.Column("grand_total", sa.Numeric(18, 4), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("terms", sa.Text(), nullable=True),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            name="fk_documents_customer_id_customers",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            name="fk_documents_workspace_id_workspaces",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_documents"),
        sa.UniqueConstraint("workspace_id", "document_type", "number", name="uq_documents_number"),
    )
    op.create_index("ix_documents_customer_id", "documents", ["customer_id"], unique=False)
    op.create_index("ix_documents_workspace_id", "documents", ["workspace_id"], unique=False)
    op.create_index(
        "ix_documents_workspace_issue_date",
        "documents",
        ["workspace_id", "issue_date"],
        unique=False,
    )
    op.create_index(
        "ix_documents_workspace_status", "documents", ["workspace_id", "status"], unique=False
    )

    op.create_table(
        "document_lines",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("item_id", sa.String(length=36), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 4), nullable=False),
        sa.Column("unit_price", sa.Numeric(18, 4), nullable=False),
        sa.Column("tax_rate", sa.Numeric(7, 4), nullable=False),
        sa.Column("line_total", sa.Numeric(18, 4), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name="fk_document_lines_document_id_documents",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["item_id"], ["items.id"], name="fk_document_lines_item_id_items", ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_document_lines"),
    )
    op.create_index(
        "ix_document_lines_document_id", "document_lines", ["document_id"], unique=False
    )
    op.create_index(
        "ix_document_lines_document_sort",
        "document_lines",
        ["document_id", "sort_order"],
        unique=False,
    )
    op.create_index("ix_document_lines_item_id", "document_lines", ["item_id"], unique=False)


def downgrade() -> None:
    op.drop_table("document_lines")
    op.drop_table("documents")
    op.drop_table("items")
    op.drop_table("customers")
    op.drop_table("memberships")
    op.drop_table("workspaces")
    op.drop_table("users")
