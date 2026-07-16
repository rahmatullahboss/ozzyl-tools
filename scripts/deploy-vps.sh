#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_SHA="${1:?Usage: deploy-vps.sh <git-sha>}"
APP_DIR="${APP_DIR:-$(pwd)}"
SERVICE="${DEPLOY_SERVICE:-web}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:8000/health/}"
PUBLIC_HEALTH_URL="${DEPLOY_PUBLIC_HEALTH_URL:-}"
HEALTH_ATTEMPTS="${DEPLOY_HEALTH_ATTEMPTS:-30}"
HEALTH_INTERVAL="${DEPLOY_HEALTH_INTERVAL:-2}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/tmp/ozzyl-tools-deploy.lock}"
PREVIOUS_SHA=""

log() {
  printf '[deploy] %s\n' "$*"
}

wait_for_health() {
  local url="$1"
  local label="$2"
  local attempt

  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1)); do
    if curl --fail --silent --show-error --max-time 5 "$url" >/dev/null; then
      log "${label} health check passed on attempt ${attempt}."
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
  done

  log "${label} health check failed after ${HEALTH_ATTEMPTS} attempts."
  return 1
}

deploy_commit() {
  log "Checking out ${TARGET_SHA}."
  git checkout --detach "$TARGET_SHA"

  log "Building ${SERVICE}."
  docker compose build --pull "$SERVICE"

  log "Applying database migrations."
  docker compose run --rm "$SERVICE" flask --app run:app db upgrade

  log "Recreating ${SERVICE}."
  docker compose up -d --no-deps --force-recreate "$SERVICE"

  wait_for_health "$HEALTH_URL" "Local"
  if [[ -n "$PUBLIC_HEALTH_URL" ]]; then
    wait_for_health "$PUBLIC_HEALTH_URL" "Public"
  fi
}

rollback() {
  if [[ -z "$PREVIOUS_SHA" ]]; then
    log "No rollback SHA is available."
    return 1
  fi

  log "Rolling back to ${PREVIOUS_SHA}."
  git checkout --detach "$PREVIOUS_SHA"
  docker compose build "$SERVICE"
  docker compose up -d --no-deps --force-recreate "$SERVICE"
  wait_for_health "$HEALTH_URL" "Rollback local"
  log "Rollback health check passed."
}

on_error() {
  local exit_code=$?
  trap - ERR

  log "Deployment failed with exit code ${exit_code}."
  docker compose ps || true
  docker compose logs --tail=120 "$SERVICE" || true
  rollback || log "Rollback failed; manual intervention is required."
  exit "$exit_code"
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running."
  exit 75
fi

cd "$APP_DIR"

if [[ "$(git rev-parse --is-inside-work-tree)" != "true" ]]; then
  log "APP_DIR is not a Git repository: ${APP_DIR}"
  exit 2
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  log "Tracked local changes detected; refusing to overwrite the VPS checkout."
  exit 3
fi

PREVIOUS_SHA="$(git rev-parse HEAD)"
trap on_error ERR

log "Fetching origin/main."
git fetch --prune origin main

git cat-file -e "${TARGET_SHA}^{commit}"
deploy_commit

mkdir -p instance
printf '%s\n' "$TARGET_SHA" > instance/deployed-sha
trap - ERR
log "Deployment completed for ${TARGET_SHA}."
