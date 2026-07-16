from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
DEPLOY_SCRIPT = ROOT / "scripts" / "deploy-vps.sh"


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
    assert '"$GITHUB_SHA"' in workflow
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
    assert "rollback" in script
    assert "docker compose logs --tail=120" in script
