#!/usr/bin/env bash
# Deploy a prebuilt image from GHCR to the EC2 server over SSH.
#
#   DEPLOY_HOST=user@server [IMAGE_TAG=sha-<commit>] \
#     [GHCR_USER=<user> GHCR_TOKEN=<token>] ./scripts/deploy.sh
#
# Normally run by GitHub Actions (.github/workflows/deploy.yml) on push to
# main, which builds the image and passes IMAGE_TAG + an ephemeral token.
# Manual use: GHCR_TOKEN="$(gh auth token)" — needs the read:packages scope
# (grant with: gh auth refresh -s read:packages). Without GHCR_TOKEN the
# server must already be logged in to ghcr.io.
#
# IMAGE_TAG defaults to latest. The server no longer builds images or touches
# git; its checkout at /home/ubuntu/apps/amen-circle stays for cron scripts
# (backup-db.sh) but is not updated by deploys. If GHCR is unreachable, the
# compose file's `build: .` fallback still works after a manual git pull, or
# build locally and stream:
#   docker build -t ghcr.io/iphren/amen-circle:latest . \
#     && docker save ghcr.io/iphren/amen-circle:latest | ssh $DEPLOY_HOST docker load
#
# Schema changes (this project uses `prisma db push`, no migrations dir):
# additive changes are applied automatically by the deploy workflow. Changes
# that would lose data make the workflow fail; apply those manually:
#   ssh -N -L 15432:127.0.0.1:15432 $DEPLOY_HOST &
#   DATABASE_URL=postgresql://postgres:<password>@localhost:15432/amen_circle \
#     npx prisma db push --accept-data-loss
set -euo pipefail

HOST="${DEPLOY_HOST:?set DEPLOY_HOST, e.g. DEPLOY_HOST=user@server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
APP_DIR=/home/ubuntu/apps/amen-circle

# Token travels via stdin only — never in remote argv, where it would be
# visible in `ps` on the server.
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  printf '%s' "$GHCR_TOKEN" |
    ssh "$HOST" "docker login ghcr.io -u '${GHCR_USER:-iphren}' --password-stdin"
fi

# The server no longer pulls from git; ship the compose file we deploy with.
scp docker-compose.prod.yml "$HOST":"$APP_DIR"/docker-compose.prod.yml

ssh "$HOST" env IMAGE_TAG="$IMAGE_TAG" bash -s <<'REMOTE'
set -euo pipefail
cd /home/ubuntu/apps/amen-circle
compose() {
  docker compose --env-file .env.production -f docker-compose.prod.yml "$@"
}
# Explicit pull: `up` will not pull while the service also has a `build:` key.
compose pull app
compose up -d
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:13001/; then
    echo "deploy OK ($IMAGE_TAG)"
    docker image prune -f >/dev/null
    docker logout ghcr.io >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done
echo "health check failed after 60s" >&2
compose logs --tail=100 app >&2
exit 1
REMOTE
