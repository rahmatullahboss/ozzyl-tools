from __future__ import annotations

import os

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-change-me"),
        SITE_NAME=os.getenv("SITE_NAME", "Ozzyl Tools"),
        SITE_URL=os.getenv("SITE_URL", "http://localhost:5000").rstrip("/"),
        CONTACT_EMAIL=os.getenv("CONTACT_EMAIL", "hello@example.com"),
        DATABASE_URL=os.getenv("DATABASE_URL", ""),
    )

    if test_config:
        app.config.update(test_config)

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    from .routes import bp

    app.register_blueprint(bp)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self'; "
            "script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'",
        )
        if response.is_json or response.mimetype in {"text/html", "application/xml"}:
            response.headers.setdefault("Cache-Control", "public, max-age=300")
        return response

    return app
