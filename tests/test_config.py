import pytest

from app.config import ProductionConfig, normalize_database_url, resolve_site_url


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


def test_site_url_prefers_explicit_value(monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://tools.example.com/")
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://ozzyl-tools.onrender.com")
    assert resolve_site_url() == "https://tools.example.com"


def test_site_url_uses_render_fallback(monkeypatch):
    monkeypatch.delenv("SITE_URL", raising=False)
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://ozzyl-tools.onrender.com/")
    assert resolve_site_url() == "https://ozzyl-tools.onrender.com"


def test_production_requires_secret_key(monkeypatch):
    from app import create_app

    monkeypatch.setattr(ProductionConfig, "SECRET_KEY", "dev-only-change-me")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        create_app("production")
