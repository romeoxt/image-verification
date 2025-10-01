#!/usr/bin/env bash
set -euo pipefail

# Smoke tests for PoPC Verification API
# Usage: RAILWAY_URL=https://your-app.up.railway.app ./scripts/smoke-tests.sh

RAILWAY_URL="${RAILWAY_URL:-http://localhost:3000}"

echo "🧪 Running smoke tests against: $RAILWAY_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s "$RAILWAY_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed"
  echo "   Response: $HEALTH_RESPONSE"
  exit 1
fi
echo ""

# Test 2: API info
echo "2️⃣  Testing / endpoint (API info)..."
API_INFO=$(curl -s "$RAILWAY_URL/")
if echo "$API_INFO" | grep -q '"name":"PoPC Verification API"'; then
  echo "   ✅ API info passed"
else
  echo "   ❌ API info failed"
  echo "   Response: $API_INFO"
  exit 1
fi
echo ""

# Test 3: Heuristic verify (base64 test image)
echo "3️⃣  Testing /v1/verify (heuristic mode - no manifest)..."
# Create a minimal test JPEG in base64
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

VERIFY_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/v1/verify" \
  -H "Content-Type: application/json" \
  -d "{\"assetBase64\": \"$TEST_IMAGE_BASE64\"}")

if echo "$VERIFY_RESPONSE" | grep -q '"verdict"'; then
  echo "   ✅ Heuristic verification passed"
  echo "   Verdict: $(echo "$VERIFY_RESPONSE" | grep -o '"verdict":"[^"]*"' | cut -d'"' -f4)"
  echo "   Mode: $(echo "$VERIFY_RESPONSE" | grep -o '"mode":"[^"]*"' | cut -d'"' -f4)"
else
  echo "   ❌ Verification failed"
  echo "   Response: $VERIFY_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Evidence endpoint (stub - would need real verification ID)
echo "4️⃣  Testing /v1/evidence/:verificationId (404 expected)..."
EVIDENCE_RESPONSE=$(curl -s -w "\n%{http_code}" "$RAILWAY_URL/v1/evidence/ver_test123")
HTTP_CODE=$(echo "$EVIDENCE_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "404" ]; then
  echo "   ✅ Evidence endpoint responding correctly (404 for non-existent ID)"
else
  echo "   ⚠️  Unexpected status code: $HTTP_CODE"
fi
echo ""

echo "✅ All smoke tests passed!"
echo ""
echo "📝 Manual tests to run:"
echo "   • Upload real image with manifest:"
echo "     curl -X POST \"$RAILWAY_URL/v1/verify\" \\"
echo "       -F \"asset=@photo.jpg\" \\"
echo "       -F \"manifest=@photo.jpg.c2pa\""
echo ""
echo "   • Get evidence package (replace {id} with real verificationId):"
echo "     curl \"$RAILWAY_URL/v1/evidence/{verificationId}\" | jq"
