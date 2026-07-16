from __future__ import annotations

import logging
import os
import secrets
from pathlib import Path

from flask import Flask, g, render_template, request
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import CONFIG_BY_NAME
from .extensions import db, migrate


def create_app(config_name: str | None = None, test_config: dict | None = None) -> Flask:
    resolved_config = config_name or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(CONFIG_BY_NAME.get(resolved_config, CONFIG_BY_NAME["development"]))

    if test_config:
        app.config.update(test_config)

    if resolved_config == "production" and app.config["SECRET_KEY"] == "dev-only-change-me":
        raise RuntimeError("SECRET_KEY must be set in production.")

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    migrate.init_app(app, db)

    # Import models after the extension is initialized so Alembic sees metadata.
    from . import models  # noqa: F401
    from .routes import bp
    from .utility_tools import bp as utility_tools_bp
    from .word_tools import bp as word_tools_bp

    app.register_blueprint(word_tools_bp)
    app.register_blueprint(utility_tools_bp)
    app.register_blueprint(bp)
    register_request_hooks(app)
    register_error_handlers(app)
    configure_logging(app)

    return app


def register_request_hooks(app: Flask) -> None:
    @app.before_request
    def create_csp_nonce() -> None:
        g.csp_nonce = secrets.token_urlsafe(18)

    @app.after_request
    def add_response_headers(response):
        nonce = getattr(g, "csp_nonce", "")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"
        )
        response.headers.setdefault(
            "Content-Security-Policy",
            "; ".join(
                [
                    "default-src 'self'",
                    f"script-src 'self' 'nonce-{nonce}'",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob:",
                    "font-src 'self'",
                    "connect-src 'self' https://raw.githubusercontent.com",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                    "frame-ancestors 'none'",
                    "worker-src 'self' blob:",
                    "manifest-src 'self'",
                    "upgrade-insecure-requests" if request.is_secure else "",
                ]
            )
            .replace("; ;", ";")
            .rstrip("; "),
        )

        if request.is_secure:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )

        if request.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif response.mimetype in {"text/html", "application/json"}:
            response.headers.setdefault("Cache-Control", "no-cache")

        return response


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(error):
        return render_template(
            "errors/404.html",
            page_title="Page not found",
            meta_description="The requested Ozzyl Tools page could not be found.",
            noindex=True,
        ), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template(
            "errors/500.html",
            page_title="Something went wrong",
            meta_description="Ozzyl Tools encountered an unexpected error.",
            noindex=True,
        ), 500


def configure_logging(app: Flask) -> None:
    if not app.debug:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)
