from __future__ import annotations

from decimal import Decimal

from app.extensions import db
from app.models import Customer, Document, DocumentLine, User, Workspace


def test_workspace_document_relationships(app):
    with app.app_context():
        user = User(email="owner@example.com", display_name="Owner")
        workspace = Workspace(owner=user, name="Example Co", slug="example-co", base_currency="USD")
        customer = Customer(workspace=workspace, name="Client")
        document = Document(
            workspace=workspace,
            customer=customer,
            document_type="invoice",
            number="INV-001",
            currency="USD",
            subtotal=Decimal("100"),
            grand_total=Decimal("100"),
        )
        document.lines.append(
            DocumentLine(
                description="Service",
                quantity=Decimal("1"),
                unit_price=Decimal("100"),
                line_total=Decimal("100"),
            )
        )
        db.session.add(user)
        db.session.commit()

        saved = db.session.execute(
            db.select(Document).where(Document.number == "INV-001")
        ).scalar_one()
        assert saved.workspace.name == "Example Co"
        assert saved.customer.name == "Client"
        assert saved.lines[0].description == "Service"
        assert saved.grand_total == Decimal("100.0000")


def test_expected_tables_exist(app):
    with app.app_context():
        assert {
            "users",
            "workspaces",
            "memberships",
            "customers",
            "items",
            "documents",
            "document_lines",
        }.issubset(db.metadata.tables)
