from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
DEPLOY_SCRIPT = ROOT / "scripts" / "deploy-vps.sh"
COMPOSE = ROOT / "compose.yaml"


def test_deploy_job_waits_for_all_ci_checks_and_only_runs_on_main_push():
    workflow = WORKFLOW.read_text()

    assert "deploy:" in workflow
    assert "needs: [test, docker]" in workflow
    assert "github.event_name == 'push'" in workflow
    assert "github.ref == 'refs/heads/main'" in workflow
    assert "environment: production" in workflow
    assert "group: production-deploy" in workflow


def test_workflow_uses_pinned_known_hosts_and_exact_github_sha():
    workflow = WORKFLOW.read_text()

    assert "VPS_KNOWN_HOSTS" in workflow
    assert "StrictHostKeyChecking=yes" in workflow
    assert "GITHUB_SHA: ${{ github.sha }}" in workflow
    assert "bash /tmp/ozzyl-tools-deploy.sh" in workflow
    assert "PRODUCTION_URL" in workflow
    assert "/health/" in workflow


def test_deploy_script_has_valid_bash_syntax():
    result = subprocess.run(
        ["bash", "-n", str(DEPLOY_SCRIPT)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr


def test_deploy_script_contains_required_safety_controls():
    script = DEPLOY_SCRIPT.read_text()

    assert "flock -n" in script
    assert 'git checkout --detach "$TARGET_SHA"' in script
    assert "flask --app run:app db upgrade" in script
    assert "docker compose up -d --no-deps --force-recreate" in script
    assert "DEPLOY_PUBLIC_HEALTH_URL" in script
    assert "OZZYL_IMAGE_TAG" in script
    assert "OZZYL_ENV_FILE" in script
    assert "remove_legacy_container" in script
    assert "CONTAINER_TOUCHED" in script
    assert "rollback" in script
    assert "docker compose logs --tail=120" in script


def test_compose_matches_the_existing_production_container_contract():
    compose = COMPOSE.read_text()

    assert "container_name: ozzyl-tools" in compose
    assert '"127.0.0.1:8000:8000"' in compose
    assert "image: ozzyl-tools:${OZZYL_IMAGE_TAG:-latest}" in compose
    assert "external: true" in compose
    assert "name: ozzyl-tools-instance" in compose


def test_workflow_uses_environment_variables_for_non_sensitive_values():
    workflow = WORKFLOW.read_text()

    assert "vars.VPS_HOST" in workflow
    assert "vars.VPS_USER" in workflow
    assert "vars.VPS_PORT" in workflow
    assert "vars.VPS_APP_DIR" in workflow
    assert "vars.PRODUCTION_URL" in workflow
