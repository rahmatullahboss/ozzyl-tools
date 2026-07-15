import pytest

from app.config import ProductionConfig, normalize_database_url


def test_neon_url_normalization():
    assert normalize_database_url("postgres://user:pass@host/db").startswith(
        "postgresql+psycopg://"
    )
    assert normalize_database_url("postgresql://user:pass@host/db").startswith(
        "postgresql+psycopg://"
    )
    assert (
        normalize_database_url("postgresql+psycopg://user:pass@host/db")
        == "postgresql+psycopg://user:pass@host/db"
    )


def test_production_requires_secret_key(monkeypatch):
    from app import create_app

    monkeypatch.setattr(ProductionConfig, "SECRET_KEY", "dev-only-change-me")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        create_app("production")
