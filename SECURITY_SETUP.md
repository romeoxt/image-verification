# Security Hardening Setup Guide

This guide walks you through implementing all critical security fixes for production deployment.

---

## ✅ Completed Automatically

The following security improvements have been implemented in the code:

### 1. Software Key Protection
- **What:** Production environment now ALWAYS rejects software-backed keys
- **Location:** `apps/api/src/routes/enroll.ts`
- **Status:** ✅ Complete (code updated)

### 2. Certificate Pinning
- **What:** Android app now caches public keys and detects backend compromises
- **Location:** `apps/android-popc/src/main/java/com/popc/android/crypto/CertificatePinning.kt`
- **Status:** ✅ Complete (code updated)

### 3. Replay Protection
- **What:** Sequence numbers prevent photo replay attacks
- **Location:** `apps/api/src/routes/verify.ts`
- **Status:** ✅ Complete (code updated, migration required)

---

## 🔧 Manual Setup Required

### Step 1: Run Database Migration (Replay Protection)

The replay protection feature requires a database schema update.

**On your local machine:**

```bash
# Navigate to API directory
cd /Users/fitzherbert/idea/apps/api

# Run the replay protection migration
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_add_replay_protection.sql
```

**What this does:**
- Adds `photo_sequence` column to `devices` table
- Adds `sequence_number` column to `verifications` table
- Creates indexes for fast lookups
- Adds uniqueness constraint

**Verification:**
```bash
# Check if migration succeeded
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='devices' AND column_name='photo_sequence';"
```

You should see:
```
 column_name   
---------------
 photo_sequence
```

---

### Step 2: Enable Railway Database Backups

Railway Pro plan includes automated backups. Here's how to enable them:

#### Option A: Upgrade to Railway Pro (Recommended)

1. Go to https://railway.app/dashboard
2. Click on your project: `image-verification-production`
3. Go to Settings → Plan
4. Upgrade to **Pro Plan** ($20/month)
5. Benefits:
   - ✅ Automated daily backups (retained for 7 days)
   - ✅ Point-in-time recovery
   - ✅ Read replicas
   - ✅ Higher resource limits

#### Option B: Manual Backup Script (Free Tier)

If you're staying on the free tier, set up manual backups:

**Create backup script:**
```bash
#!/bin/bash
# File: scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/fitzherbert/idea/backups"
BACKUP_FILE="$BACKUP_DIR/popc_backup_$DATE.sql"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "popc_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**Make it executable and run daily:**
```bash
chmod +x scripts/backup-database.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
# 0 2 * * * /Users/fitzherbert/idea/scripts/backup-database.sh
```

---

### Step 3: Set Production Environment Variables

**On Railway Dashboard:**

1. Go to https://railway.app/dashboard
2. Select your `image-verification-production` project
3. Click on the `api` service
4. Go to **Variables** tab
5. Set these variables:

```env
# CRITICAL: Set to production
NODE_ENV=production

# Database (should already be set)
DATABASE_URL=<your-railway-postgres-url>

# Security: Software keys disabled in production (automatic, but good to document)
# ALLOW_SOFTWARE_KEYS is intentionally NOT set in production

# API Settings
PORT=3000
LOG_LEVEL=info

# Limits
MAX_ASSET_SIZE_BYTES=104857600
```

**Verify Production Mode:**
```bash
# Check Railway logs
railway logs --project image-verification-production
```

Look for log line: `"NODE_ENV":"production"`

---

### Step 4: Update Android App for Production

**Update `build.gradle.kts`:**

```kotlin
buildConfigField("String", "BASE_URL", "\"https://image-verification-production.up.railway.app\"")
buildConfigField("String", "API_KEY", "\"pk_a00a94a9cc00156a194564a02038ac8c79888712290c5301767e654c7652affa\"")
```

**Then rebuild:**
```bash
cd /Users/fitzherbert/idea/apps/android-popc
./gradlew assembleRelease
```

---

### Step 5: Enable Android Sequence Numbers

The Android app needs to send sequence numbers with each photo. Update `ManifestBuilder.kt`:

**File:** `apps/android-popc/src/main/java/com/popc/android/c2pa/ManifestBuilder.kt`

**Add to `createAssertions`:**
```kotlin
fun createAssertions(
    assetHash: String,
    deviceId: String,
    sequenceNumber: Long, // NEW parameter
    metadata: Map<String, Any> = emptyMap(),
    customAssertions: Map<String, Any> = emptyMap()
): JSONObject {
    val timestamp = Instant.now().toString()
    return JSONObject().apply {
        put("c2pa.hash.data", JSONObject().apply {
            put("algorithm", "sha256")
            put("hash", assetHash)
        })
        put("popc.device.id", deviceId)
        put("c2pa.timestamp", timestamp)
        put("sequenceNumber", sequenceNumber) // NEW: Add sequence number
        put("platform", "android")
        put("model", Build.MODEL)
        put("manufacturer", Build.MANUFACTURER)
        
        // ... rest of function
    }
}
```

**Update EnrollmentStore to track photo count:**

Add to `EnrollmentData`:
```kotlin
data class EnrollmentData(
    val deviceId: String,
    val enrolledAt: String,
    val securityLevel: String,
    val attestationType: String,
    val hardwareBacked: Boolean,
    val bootState: String?,
    val photoCount: Long = 0L // NEW: Track photos taken
)
```

Add methods to `EnrollmentStore`:
```kotlin
fun incrementPhotoCount(): Long {
    val enrollment = getEnrollment() ?: return 0L
    val newCount = enrollment.photoCount + 1
    prefs.edit().putLong(KEY_PHOTO_COUNT, newCount).apply()
    return newCount
}

fun getPhotoCount(): Long {
    return prefs.getLong(KEY_PHOTO_COUNT, 0L)
}

companion object {
    // ... existing keys ...
    private const val KEY_PHOTO_COUNT = "photo_count"
}
```

**Update CaptureViewModel to use sequence numbers:**
```kotlin
// Get next sequence number
val sequenceNumber = enrollmentStore.incrementPhotoCount()

// Create assertions with sequence number
val assertionsObj = manifestBuilder.createAssertions(
    assetHash = fileHash,
    deviceId = deviceId,
    sequenceNumber = sequenceNumber, // Pass sequence number
    metadata = mapOf(
        "capturedAt" to timestamp
    )
)
```

---

## 🧪 Testing the Security Fixes

### Test 1: Software Key Rejection (Production)

```bash
# Try to enroll with software key in production
curl -X POST https://image-verification-production.up.railway.app/v1/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_a00a94a9cc00156a194564a02038ac8c79888712290c5301767e654c7652affa" \
  -d '{
    "platform": "android",
    "certChainPem": ["..."],
    "deviceMetadata": {
      "clientSecurityLevel": "software"
    }
  }'
```

**Expected:** HTTP 400 with error `software_key_not_allowed`

---

### Test 2: Certificate Pinning

**On Android:**
1. Enroll device (this pins the public key)
2. Check logs: should see "Public key pinned for device..."
3. Re-enroll same device
4. Check logs: should see "Public key verification passed"

**To test security alert:**
- Manually change the pinned key in SharedPreferences
- Try to verify a photo
- Should see "PUBLIC KEY MISMATCH DETECTED!" in logs

---

### Test 3: Replay Protection

**Scenario: Take 3 photos, try to re-upload #2**

1. Take photo #1 (sequence 1) → Upload → ✅ Verified
2. Take photo #2 (sequence 2) → Upload → ✅ Verified
3. Take photo #3 (sequence 3) → Upload → ✅ Verified
4. Re-upload photo #2 (sequence 2 again) → ❌ REJECTED

**Expected:** HTTP 200 with verdict `invalid`, reason: "Replay attack detected"

---

## 📊 Security Status After Setup

| Security Feature | Status | Protection Level |
|------------------|--------|------------------|
| Software Key Rejection | ✅ Enforced in production | **HIGH** |
| Certificate Pinning | ✅ Public keys cached & verified | **HIGH** |
| Replay Protection | ✅ Sequence numbers enforced | **HIGH** |
| Database Backups | ⚠️ Manual setup required | **MEDIUM** |
| Hardware Attestation | ✅ StrongBox/TEE verified | **VERY HIGH** |

---

## 🚨 What to Monitor

### Railway Logs

```bash
railway logs --project image-verification-production --follow
```

**Watch for:**
- `"Rejected software key in production"` → Good, working correctly
- `"PUBLIC KEY MISMATCH DETECTED"` → **ALERT:** Possible backend compromise
- `"Replay attack detected"` → **ALERT:** Someone trying to reuse photos

### Database Queries

```sql
-- Check devices by security level
SELECT security_level, COUNT(*) FROM devices GROUP BY security_level;

-- Check for replay attack attempts
SELECT device_id, COUNT(*) as attempts 
FROM verifications 
WHERE verdict = 'invalid' AND reasons_json::text LIKE '%Replay%'
GROUP BY device_id 
HAVING COUNT(*) > 5;
```

---

## ⚡ Quick Setup Checklist

- [ ] Run database migration (002_add_replay_protection.sql)
- [ ] Verify migration with psql query
- [ ] Set `NODE_ENV=production` on Railway
- [ ] Enable Railway Pro backups (or set up manual backups)
- [ ] Update Android app with sequence numbers
- [ ] Rebuild Android APK for production
- [ ] Test software key rejection
- [ ] Test certificate pinning
- [ ] Test replay protection
- [ ] Set up log monitoring

---

## 🆘 Troubleshooting

### "Error: column photo_sequence does not exist"

**Solution:** Migration didn't run. Execute:
```bash
psql "$DATABASE_URL" -f db/migrations/002_add_replay_protection.sql
```

### "Software key enrolled in production"

**Solution:** Check `NODE_ENV`:
```bash
railway variables --project image-verification-production
```

Make sure `NODE_ENV=production` (no "development" value)

### "Public key mismatch" in logs

**Serious Issue!** This means either:
1. Backend database was compromised
2. Man-in-the-middle attack
3. You manually changed enrollment data

**Action:** Investigate immediately, check Railway activity logs

---

## 📞 Need Help?

If any step fails:
1. Check Railway logs: `railway logs`
2. Check database connection: `psql "$DATABASE_URL" -c "SELECT 1;"`
3. Verify migrations: `psql "$DATABASE_URL" -c "\d devices"`

---

**Security hardening complete!** 🔐

Your system now has production-grade protection against:
- Software key attacks
- Backend compromise detection
- Photo replay attacks
- Data loss (with backups)

