#!/usr/bin/env bash
# Nightly DB backup: pg_dump (custom format) streamed straight to S3, no
# local file. Runs ON the server via cron, e.g. (crontab -e as ubuntu):
#
#   15 3 * * * /home/ubuntu/apps/amen-circle/scripts/backup-db.sh >> /home/ubuntu/backup.log 2>&1
#
# One-time setup on the server:
#   aws configure --profile amen-backup   # keys from `terraform output backup_access_key_id`
#                                         # and `terraform output -raw backup_secret_access_key`
#
# The IAM user can only PutObject — it cannot read or delete backups, and the
# bucket expires dumps after 30 days (infra/backups.tf).
#
# Restore (from a machine with read access to the bucket):
#   aws s3 cp s3://<bucket>/db/<timestamp>.dump .
#   docker compose --env-file .env.production -f docker-compose.prod.yml \
#     exec -T db pg_restore -U postgres -d amen_circle --clean --if-exists < <timestamp>.dump
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin

BUCKET="${BACKUP_BUCKET:-amen-circle-backups-387479857085}"
APP_DIR="/home/ubuntu/apps/amen-circle"
STAMP="$(date -u +%Y-%m-%dT%H%MZ)"

cd "$APP_DIR"
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T db pg_dump -U postgres -Fc amen_circle \
  | aws s3 cp --profile amen-backup - "s3://$BUCKET/db/$STAMP.dump" --expected-size 104857600

echo "backup OK $STAMP"
