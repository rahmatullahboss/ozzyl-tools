#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY="${DEPLOY_REPOSITORY:-rahmatullahboss/ozzyl-tools}"
WORKFLOW_FILE="${DEPLOY_WORKFLOW_FILE:-ci.yml}"
BRANCH="${DEPLOY_BRANCH:-main}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/ozzyl-tools}"
STATE_DIR="${DEPLOY_STATE_DIR:-/var/lib/ozzyl-tools}"
STATE_FILE="${DEPLOY_STATE_FILE:-${STATE_DIR}/deployed-sha}"
LOCK_FILE="${DEPLOY_WATCH_LOCK_FILE:-/tmp/ozzyl-tools-deploy-watch.lock}"
PUBLIC_HEALTH_URL="${DEPLOY_PUBLIC_HEALTH_URL:-https://tools.online-bazar.top/health/}"
API_URL="https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/runs?branch=${BRANCH}&event=push&per_page=1"

log() {
  printf '[deploy-watch] %s\n' "$*"
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another watcher process is already active."
  exit 0
fi

response_file="$(mktemp)"
deploy_script="$(mktemp)"
cleanup() {
  rm -f "$response_file" "$deploy_script"
}
trap cleanup EXIT

curl \
  --fail \
  --silent \
  --show-error \
  --retry 3 \
  --retry-delay 2 \
  --header "Accept: application/vnd.github+json" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --header "User-Agent: ozzyl-tools-deploy-watch" \
  "$API_URL" > "$response_file"

read -r status conclusion head_sha < <(
  python3 - "$response_file" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)

runs = payload.get("workflow_runs") or []
if not runs:
    print("missing missing missing")
else:
    run = runs[0]
    print(
        run.get("status") or "missing",
        run.get("conclusion") or "missing",
        run.get("head_sha") or "missing",
    )
PY
)

if [[ "$status" != "completed" ]]; then
  log "Latest ${BRANCH} workflow is ${status}; nothing to deploy."
  exit 0
fi

if [[ "$conclusion" != "success" ]]; then
  log "Latest ${BRANCH} workflow concluded ${conclusion}; deployment blocked."
  exit 0
fi

if [[ "$head_sha" == "missing" || -z "$head_sha" ]]; then
  log "GitHub did not return a deployable commit SHA."
  exit 0
fi

cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
remote_sha="$(git rev-parse "origin/${BRANCH}")"

if [[ "$remote_sha" != "$head_sha" ]]; then
  log "Verified workflow SHA ${head_sha} is not current origin/${BRANCH} (${remote_sha})."
  exit 0
fi

mkdir -p "$STATE_DIR"
current_sha=""
if [[ -f "$STATE_FILE" ]]; then
  current_sha="$(cat "$STATE_FILE")"
fi

if [[ "$current_sha" == "$head_sha" ]]; then
  log "Commit ${head_sha} is already deployed."
  exit 0
fi

git show "${head_sha}:scripts/deploy-vps.sh" > "$deploy_script"
chmod 700 "$deploy_script"

log "Deploying verified commit ${head_sha}."
APP_DIR="$APP_DIR" \
DEPLOY_PUBLIC_HEALTH_URL="$PUBLIC_HEALTH_URL" \
bash "$deploy_script" "$head_sha"

printf '%s\n' "$head_sha" > "$STATE_FILE"
log "Recorded successful deployment of ${head_sha}."
