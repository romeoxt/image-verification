#!/usr/bin/env bash
set -euo pipefail

# --- config you edit once ---
RAILWAY_SERVICE_API="${RAILWAY_SERVICE_API:-}"       # optional: set service name if you have multiple
RAILWAY_SERVICE_DB="${RAILWAY_SERVICE_DB:-}"         # optional: set postgres service name if you have multiple

# You can set DATABASE_URL inline or let Railway dashboard inject it.
# For running migrations locally via external URL, export it before running:
#   export DATABASE_URL="postgresql://postgres:***@metro.proxy.rlwy.net:17842/railway?sslmode=require"

if ! command -v railway >/dev/null 2>&1; then
  echo "Installing Railway CLI..."
  npm i -g @railway/cli
fi

echo "→ Logging into Railway (browser may open if not logged in)..."
railway login >/dev/null 2>&1 || true

echo "→ Linking project (follow prompts to pick workspace/project/env/service)"
railway link

echo "→ Setting environment variables on the API service…"
# Tip: if you set RAILWAY_SERVICE_API, add: --service "$RAILWAY_SERVICE_API"
railway variables set \
  HOST=0.0.0.0 \
  NODE_ENV=production \
  LOG_LEVEL=info \
  LOG_PRETTY=false \
  MAX_ASSET_SIZE_BYTES=104857600 \
  MAX_CLOCK_SKEW_SECONDS=300 \
  DEFAULT_POLICY=default \
  CORS_ORIGIN="*"

echo "→ Running DB migrations + seeds..."
# If DATABASE_URL is not set, this will use the service-injected value only if you run inside a Railway shell/exec.
# Easiest: provide external DATABASE_URL env before running this script.
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "WARNING: DATABASE_URL not set in your shell. If this is a local run, export the external Railway URL with ?sslmode=require."
fi
psql "${DATABASE_URL:?DATABASE_URL not set}" -v ON_ERROR_STOP=1 -f apps/api/db/schema.sql
psql "${DATABASE_URL:?DATABASE_URL not set}" -v ON_ERROR_STOP=1 -f apps/api/db/seed.sql

echo "→ Triggering deployment (Dockerfile build)…"
railway up

echo "✔ Done. Once live, test with:"
echo "  curl \$RAILWAY_URL/health"
echo "  curl -X POST \"\$RAILWAY_URL/v1/verify\" -F \"asset=@test.jpg\""
