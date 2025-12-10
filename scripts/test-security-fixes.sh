#!/bin/bash

# Security Fixes Test Script
# Tests all Week 1 security improvements

set -e

API_URL="http://localhost:3000"
API_KEY="pk_a00a94a9cc00156a194564a02038ac8c79888712290c5301767e654c7652affa"

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              TESTING WEEK 1 SECURITY FIXES                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Backend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test backend is running
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    print_test_result 0 "Backend server is running"
else
    print_test_result 1 "Backend server is NOT running (HTTP $HTTP_CODE)"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Database Migration - Replay Protection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if photo_sequence column exists
COLUMN_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='devices' AND column_name='photo_sequence';" 2>/dev/null || echo "0")

if [ "$COLUMN_EXISTS" = "1" ]; then
    print_test_result 0 "photo_sequence column exists in devices table"
else
    print_test_result 1 "photo_sequence column MISSING from devices table"
fi

# Check if sequence_number column exists
COLUMN_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='verifications' AND column_name='sequence_number';" 2>/dev/null || echo "0")

if [ "$COLUMN_EXISTS" = "1" ]; then
    print_test_result 0 "sequence_number column exists in verifications table"
else
    print_test_result 1 "sequence_number column MISSING from verifications table"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Software Key Rejection (Development Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Note: In development with ALLOW_SOFTWARE_KEYS=true, software keys are allowed"
echo "      In production, software keys are ALWAYS rejected"
echo ""

# We can't easily test software key rejection without a real device enrollment
echo -e "${YELLOW}⚠ MANUAL TEST REQUIRED${NC}: Test this on Android device"
echo "  1. Temporarily modify KeystoreManager to force useStrongBox = false"
echo "  2. Try to enroll"
echo "  3. Should be rejected with 'software_key_not_allowed' error"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Certificate Pinning"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if CertificatePinning.kt exists
if [ -f "apps/android-popc/src/main/java/com/popc/android/crypto/CertificatePinning.kt" ]; then
    print_test_result 0 "CertificatePinning.kt file exists"
else
    print_test_result 1 "CertificatePinning.kt file NOT FOUND"
fi

echo ""
echo -e "${YELLOW}⚠ MANUAL TEST REQUIRED${NC}: Test this on Android device"
echo "  1. Enroll device (will pin public key)"
echo "  2. Check logs for: 'Public key pinned for device'"
echo "  3. Re-enroll → should see: 'Public key verification passed'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Replay Protection (Backend Logic)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if replay protection code exists in verify.ts
if grep -q "Replay attack detected" apps/api/src/routes/verify.ts; then
    print_test_result 0 "Replay protection code exists in verify.ts"
else
    print_test_result 1 "Replay protection code MISSING from verify.ts"
fi

echo ""
echo -e "${YELLOW}⚠ MANUAL TEST REQUIRED${NC}: Test this on Android device"
echo "  Note: Sequence numbers must be implemented in Android app first"
echo "  1. Take photo #1 → Upload → Should verify"
echo "  2. Take photo #2 → Upload → Should verify"
echo "  3. Re-upload photo #1 → Should be REJECTED (replay attack)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Complete manual Android tests (see above)"
    echo "2. Build & install Android APK: cd apps/android-popc && ./gradlew installDebug"
    echo "3. Test on your Samsung Galaxy S23+"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review errors above.${NC}"
    exit 1
fi

