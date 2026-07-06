#!/usr/bin/env bash
# Deploy to the EC2 server over SSH.
#
#   DEPLOY_HOST=user@server ./scripts/deploy.sh
#
# Builds the image on the server from origin/main and restarts the stack.
# If the server is ever too small to build (OOM), build locally instead:
#   docker build -t amen-circle-app . && docker save amen-circle-app | ssh $DEPLOY_HOST docker load
#
# Schema changes (this project uses `prisma db push`, no migrations dir):
#   ssh -N -L 15432:127.0.0.1:15432 $DEPLOY_HOST &
#   DATABASE_URL=postgresql://postgres:<password>@localhost:15432/amen_circle npx prisma db push
set -euo pipefail

HOST="${DEPLOY_HOST:?set DEPLOY_HOST, e.g. DEPLOY_HOST=user@server}"

ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /home/ubuntu/apps/amen-circle
git fetch origin main
git reset --hard origin/main
docker compose --env-file .env.production -f docker-compose.prod.yml build app
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:13001/; then
    echo "deploy OK"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
echo "health check failed after 60s" >&2
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app >&2
exit 1
REMOTE
