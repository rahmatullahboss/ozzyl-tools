#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_SHA="${1:?Usage: deploy-vps.sh <git-sha>}"
APP_DIR="${APP_DIR:-$(pwd)}"
SERVICE="${DEPLOY_SERVICE:-web}"
ENV_FILE="${DEPLOY_ENV_FILE:-/etc/ozzyl-tools/app.env}"
CONTAINER_NAME="${DEPLOY_CONTAINER_NAME:-ozzyl-tools}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:8000/health/}"
PUBLIC_HEALTH_URL="${DEPLOY_PUBLIC_HEALTH_URL:-}"
HEALTH_ATTEMPTS="${DEPLOY_HEALTH_ATTEMPTS:-30}"
HEALTH_INTERVAL="${DEPLOY_HEALTH_INTERVAL:-2}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/tmp/ozzyl-tools-deploy.lock}"
PREVIOUS_SHA=""
CONTAINER_TOUCHED=false

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

remove_legacy_container() {
  local compose_project=""

  if ! docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    return 0
  fi

  compose_project="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  if [[ -z "$compose_project" ]]; then
    log "Removing legacy container ${CONTAINER_NAME} before Compose takeover."
    docker rm -f "$CONTAINER_NAME"
  fi
}

deploy_commit() {
  log "Checking out ${TARGET_SHA}."
  git checkout --detach "$TARGET_SHA"
  export OZZYL_IMAGE_TAG="$TARGET_SHA"

  log "Building ${SERVICE} as ozzyl-tools:${OZZYL_IMAGE_TAG}."
  docker compose build --pull "$SERVICE"

  log "Applying database migrations."
  docker compose run --rm "$SERVICE" flask --app run:app db upgrade

  CONTAINER_TOUCHED=true
  remove_legacy_container

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

  git checkout --detach "$PREVIOUS_SHA"

  if [[ "$CONTAINER_TOUCHED" != "true" ]]; then
    log "The running container was never changed; no runtime rollback is required."
    return 0
  fi

  export OZZYL_IMAGE_TAG="$PREVIOUS_SHA"
  log "Rolling back to ${PREVIOUS_SHA}."

  if ! docker image inspect "ozzyl-tools:${OZZYL_IMAGE_TAG}" >/dev/null 2>&1; then
    docker compose build "$SERVICE"
  fi

  remove_legacy_container
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

if [[ ! -f "$ENV_FILE" ]]; then
  log "Production environment file not found: ${ENV_FILE}"
  exit 4
fi

export OZZYL_ENV_FILE="$ENV_FILE"
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
