from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def normalize_database_url(value: str | None) -> str:
    """Normalize provider URLs for SQLAlchemy 2 + Psycopg 3."""
    if not value:
        return f"sqlite:///{BASE_DIR / 'instance' / 'ozzyl_tools.db'}"
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql://") and "+" not in value.split("://", 1)[0]:
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    return value


def resolve_site_url() -> str:
    """Use an explicit origin, then Render's generated URL, then localhost."""
    return (
        os.getenv("SITE_URL") or os.getenv("RENDER_EXTERNAL_URL") or "http://localhost:5000"
    ).rstrip("/")


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
    SITE_NAME = os.getenv("SITE_NAME", "Ozzyl Tools")
    SITE_URL = resolve_site_url()
    CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "hello@example.com")
    DEFAULT_LOCALE = os.getenv("DEFAULT_LOCALE", "en")
    SUPPORTED_LOCALES = tuple(
        locale.strip()
        for locale in os.getenv("SUPPORTED_LOCALES", "en").split(",")
        if locale.strip()
    )
    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.getenv("DATABASE_URL"))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    SEND_FILE_MAX_AGE_DEFAULT = 31536000


class DevelopmentConfig(BaseConfig):
    ENV = "development"
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = (
        normalize_database_url(os.getenv("DATABASE_URL"))
        if os.getenv("DATABASE_URL")
        else "sqlite+pysqlite:///:memory:"
    )
    WTF_CSRF_ENABLED = False


class ProductionConfig(BaseConfig):
    ENV = "production"
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True


CONFIG_BY_NAME = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
