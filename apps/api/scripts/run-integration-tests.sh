#!/usr/bin/env sh
set -eu

COMPOSE_FILE="docker-compose.test.yml"
TEST_DB_URL="postgresql://popc:popc_password@localhost:55432/popc_test"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for test:integration:db but is not installed or not on PATH."
  exit 1
fi

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

docker compose -f "$COMPOSE_FILE" up -d postgres-test

# Wait for postgres to become healthy
attempts=0
until docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -q "\"Health\":\"healthy\""; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 40 ]; then
    echo "Test database did not become healthy in time"
    exit 1
  fi
  sleep 1
done

export DATABASE_URL="$TEST_DB_URL"
export TEST_DATABASE_URL="$TEST_DB_URL"
export NODE_ENV="test"
export DISABLE_API_AUTH="false"

npm --prefix ../../packages/c2pa run build

npm run db:migrate
psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_add_api_keys.sql
psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_add_replay_protection.sql
psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f db/migrations/003_add_verification_metadata.sql
psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_add_users.sql
npm run db:seed

node --import tsx --test test/api-integration.test.ts test/evidence.test.ts
