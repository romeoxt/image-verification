#!/bin/bash
# PoPC System Verification Script
# Tests all components of the system to ensure everything is working

set -e

echo "=========================================="
echo "  PoPC System Verification"
echo "  $(date)"
echo "=========================================="
echo ""

# Configuration
API_URL="https://image-verification-production.up.railway.app"
API_KEY="${POPC_API_KEY:-pk_a00a94a9cc00156a194564a02038ac8c79888712290c5301767e654c7652affa}"
DATABASE_URL="${DATABASE_URL}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓ PASS${NC} - $1"
}

fail() {
    echo -e "${RED}✗ FAIL${NC} - $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC} - $1"
}

# Test 1: Database Connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL not set, skipping database tests"
else
    TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('api_keys', 'api_key_usage', 'devices', 'verifications');" | xargs)
    if [ "$TABLES" = "4" ]; then
        pass "Database connected, all 4 required tables exist"
    else
        fail "Expected 4 tables, found $TABLES"
    fi
fi
echo ""

# Test 2: Railway API Health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Railway API Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s "$API_URL/health" | jq -r .status 2>/dev/null || echo "error")
if [ "$HEALTH" = "ok" ]; then
    pass "Railway API is healthy and responding"
else
    fail "Railway API health check failed"
fi
echo ""

# Test 3: Authentication - Reject Unauthorized
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Authentication - Reject Unauthorized"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UNAUTH=$(curl -s "$API_URL/v1/evidence/test-id" | jq -r .error 2>/dev/null || echo "error")
if [ "$UNAUTH" = "unauthorized" ]; then
    pass "Unauthenticated requests correctly rejected"
else
    fail "Authentication not enforcing (got: $UNAUTH)"
fi
echo ""

# Test 4: Authentication - Accept Valid Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Authentication - Accept Valid Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
AUTH_RESULT=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL/v1/evidence/5c536b8e-192e-4617-8b39-0094c6dcfdf6" | jq -r .packageVersion 2>/dev/null || echo "error")
if [ "$AUTH_RESULT" = "1.0" ]; then
    pass "Valid API key accepted, data returned"
else
    fail "Valid API key was rejected (got: $AUTH_RESULT)"
fi
echo ""

# Test 5: Invalid API Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Invalid API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
INVALID=$(curl -s -H "Authorization: Bearer pk_fake_invalid_123" "$API_URL/v1/evidence/test-id" | jq -r .error 2>/dev/null || echo "error")
if [ "$INVALID" = "unauthorized" ]; then
    pass "Invalid API key correctly rejected"
else
    fail "Invalid API key was accepted"
fi
echo ""

# Test 6: Security Headers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEADERS=$(curl -s -I "$API_URL/health" 2>/dev/null)
if echo "$HEADERS" | grep -q "x-frame-options: DENY"; then
    pass "X-Frame-Options header present"
else
    fail "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "x-content-type-options: nosniff"; then
    pass "X-Content-Type-Options header present"
else
    fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "content-security-policy"; then
    pass "Content-Security-Policy header present"
else
    fail "Content-Security-Policy header missing"
fi
echo ""

# Test 7: API Key Stats
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: API Key Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL not set, skipping API key stats"
else
    ACTIVE_KEYS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM api_keys WHERE is_active = true;" | xargs)
    TOTAL_USAGE=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM api_key_usage;" | xargs)
    
    echo "Active API Keys: $ACTIVE_KEYS"
    echo "Total API Requests Logged: $TOTAL_USAGE"
    
    if [ "$ACTIVE_KEYS" -gt 0 ]; then
        pass "Active API keys found"
    else
        warn "No active API keys"
    fi
    
    if [ "$TOTAL_USAGE" -gt 0 ]; then
        pass "Usage tracking is working ($TOTAL_USAGE requests logged)"
    else
        warn "No usage logged yet"
    fi
fi
echo ""

# Test 8: Device Enrollment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Device Enrollment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL not set, skipping device tests"
else
    DEVICE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM devices;" | xargs)
    STRONGBOX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM devices WHERE security_level = 'strongbox';" | xargs)
    
    echo "Total Devices Enrolled: $DEVICE_COUNT"
    echo "StrongBox Devices: $STRONGBOX_COUNT"
    
    if [ "$DEVICE_COUNT" -gt 0 ]; then
        pass "Devices enrolled in system"
    else
        warn "No devices enrolled yet"
    fi
    
    if [ "$STRONGBOX_COUNT" -gt 0 ]; then
        pass "StrongBox hardware attestation working"
    else
        warn "No StrongBox devices (may be normal for testing)"
    fi
fi
echo ""

# Test 9: Verifications
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 9: Verification History"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL not set, skipping verification tests"
else
    VERIFICATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM verifications;" | xargs)
    VERIFIED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM verifications WHERE verdict = 'verified';" | xargs)
    
    echo "Total Verifications: $VERIFICATION_COUNT"
    echo "Verified (Valid): $VERIFIED_COUNT"
    
    if [ "$VERIFICATION_COUNT" -gt 0 ]; then
        pass "Verification system has processed requests"
    else
        warn "No verifications performed yet"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "  VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "System Status: ${GREEN}OPERATIONAL${NC}"
echo ""
echo "Next Steps:"
echo "  1. Build Android app in Android Studio"
echo "  2. Install on phone"
echo "  3. Test enrollment → capture → verify"
echo "  4. Check logs: npm run keys:info -- --id 8ea3bc9a-08ff-43b1-9cf6-07bd73405c55"
echo ""

