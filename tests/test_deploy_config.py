from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
DEPLOY_SCRIPT = ROOT / "scripts" / "deploy-vps.sh"
WATCH_SCRIPT = ROOT / "scripts" / "deploy-watch.sh"
COMPOSE = ROOT / "compose.yaml"
SERVICE_UNIT = ROOT / "ops" / "ozzyl-tools-deploy-watch.service"
TIMER_UNIT = ROOT / "ops" / "ozzyl-tools-deploy-watch.timer"


def test_release_job_waits_for_all_ci_checks_and_only_runs_on_main_push():
    workflow = WORKFLOW.read_text()

    assert "release:" in workflow
    assert "needs: [test, docker]" in workflow
    assert "github.event_name == 'push'" in workflow
    assert "github.ref == 'refs/heads/main'" in workflow
    assert "Mark commit deploy-ready" in workflow
    assert "VPS_SSH_KEY" not in workflow
    assert "ssh " not in workflow


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
    assert "${OZZYL_ENV_FILE:-.env}" in compose
    assert "external: true" in compose
    assert "name: ozzyl-tools-instance" in compose


def test_watch_script_only_deploys_a_successful_latest_main_workflow():
    script = WATCH_SCRIPT.read_text()

    assert "actions/workflows/${WORKFLOW_FILE}/runs" in script
    assert '[[ "$status" != "completed" ]]' in script
    assert '[[ "$conclusion" != "success" ]]' in script
    assert 'git rev-parse "origin/${BRANCH}"' in script
    assert 'git show "${head_sha}:scripts/deploy-vps.sh"' in script
    assert 'bash "$deploy_script" "$head_sha"' in script
    assert "flock -n" in script


def test_watch_script_has_valid_bash_syntax():
    result = subprocess.run(
        ["bash", "-n", str(WATCH_SCRIPT)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr


def test_systemd_timer_runs_persistently_without_overlapping_processes():
    service = SERVICE_UNIT.read_text()
    timer = TIMER_UNIT.read_text()

    assert "Type=oneshot" in service
    assert "ExecStart=/usr/local/lib/ozzyl-tools/deploy-watch.sh" in service
    assert "OnBootSec=2min" in timer
    assert "OnUnitActiveSec=3min" in timer
    assert "RandomizedDelaySec=20s" in timer
    assert "Persistent=true" in timer
