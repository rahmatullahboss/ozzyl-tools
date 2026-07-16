from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLISH_CSS = ROOT / "app" / "static" / "css" / "polish.css"
SERVICE_WORKER = ROOT / "app" / "static" / "js" / "service-worker.js"


def test_base_loads_polish_after_the_existing_design_system(client):
    html = client.get("/").get_data(as_text=True)

    app_index = html.index("css/app.css")
    components_index = html.index("css/components.css")
    polish_index = html.index("css/polish.css")

    assert app_index < components_index < polish_index


def test_polish_styles_are_restrained_and_theme_safe():
    css = POLISH_CSS.read_text()

    assert ".site-header" in css
    assert ".tool-card" in css
    assert ".field-group input" in css
    assert ".preview-window" in css
    assert "@media (hover: hover)" in css
    assert "@media (prefers-reduced-motion: reduce)" in css
    assert "@keyframes" not in css


def test_service_worker_caches_the_polish_stylesheet():
    service_worker = SERVICE_WORKER.read_text()

    assert 'CACHE="ozzyl-tools-v2"' in service_worker
    assert '"/static/css/polish.css"' in service_worker
