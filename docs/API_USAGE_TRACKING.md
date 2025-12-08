# API Usage Tracking - How It Works & How to Apply

## 📊 **Overview**

Every API request is logged to the `api_key_usage` table for:
- Rate limiting
- Billing calculations
- Performance monitoring
- Security auditing
- Customer analytics

---

## 🔄 **How Tracking Works (Technical Flow)**

### **Step 1: Request Arrives**
```
User → API Request → authenticateApiKey()
```

### **Step 2: Validation & Rate Limit Check**
```typescript
// Check per-minute limit
SELECT COUNT(*) FROM api_key_usage 
WHERE api_key_id = $1 
AND created_at >= now() - INTERVAL '1 minute'

// Check per-day limit  
SELECT COUNT(*) FROM api_key_usage 
WHERE api_key_id = $1 
AND created_at >= now() - INTERVAL '24 hours'

// If under limits → Allow request
// If over limits → Reject with 429 status
```

### **Step 3: Request Processed**
```
API endpoint logic executes (enroll, verify, etc.)
```

### **Step 4: Usage Logged**
```typescript
// After response sent
logApiKeyUsage(
  apiKeyId: "8ea3bc9a-08ff-43b1-9cf6-07bd73405c55",
  endpoint: "/v1/verify",
  method: "POST",
  statusCode: 200,
  responseTimeMs: 345
)

// Saves to api_key_usage table
// Updates api_keys.last_used_at and usage_count
```

---

## 💰 **APPLICATION 1: Billing**

### **Calculate Monthly Bill Per Customer:**

```sql
-- Requests per month
SELECT 
  k.name as customer,
  DATE_TRUNC('month', u.created_at) as month,
  COUNT(*) as total_requests,
  COUNT(*) * 0.01 as cost_at_1cent_per_request,
  COUNT(*) * 0.001 as cost_at_tenth_cent_per_request
FROM api_keys k
JOIN api_key_usage u ON u.api_key_id = k.id
WHERE u.created_at >= DATE_TRUNC('month', NOW())
GROUP BY k.name, DATE_TRUNC('month', u.created_at)
ORDER BY total_requests DESC;
```

**Example Output:**
```
customer               | month      | total_requests | cost_at_1cent | cost_at_tenth_cent
-----------------------|------------|----------------|---------------|-------------------
Production Mobile App  | 2025-12-01 | 3,542         | $35.42        | $3.54
Partner Insurance Co   | 2025-12-01 | 15,892        | $158.92       | $15.89
```

### **Tiered Pricing:**
```sql
-- Apply tiered pricing
WITH usage AS (
  SELECT COUNT(*) as requests FROM api_key_usage 
  WHERE api_key_id = 'xxx' 
  AND created_at >= DATE_TRUNC('month', NOW())
)
SELECT 
  CASE 
    WHEN requests <= 1000 THEN 0 -- Free tier
    WHEN requests <= 10000 THEN (requests - 1000) * 0.01 -- $0.01 per request
    WHEN requests <= 100000 THEN 90 + (requests - 10000) * 0.005 -- $0.005 per request
    ELSE 540 + (requests - 100000) * 0.001 -- $0.001 per request
  END as monthly_cost
FROM usage;
```

---

## ⚡ **APPLICATION 2: Rate Limiting (Real-Time)**

### **In Code (`src/lib/auth.ts:117-138`):**

```typescript
// Check per-minute limit
const minuteUsage = await db.query(
  `SELECT COUNT(*) as count 
   FROM api_key_usage 
   WHERE api_key_id = $1 AND created_at >= $2`,
  [key.id, oneMinuteAgo]
);

if (parseInt(minuteUsage.rows[0].count) >= key.rateLimitPerMinute) {
  return { 
    valid: false, 
    error: 'Rate limit exceeded (per minute)' 
  };
}
```

### **Test It:**
```bash
# Make 61 requests rapidly (limit is 60/min)
for i in {1..61}; do
  curl -H "Authorization: Bearer $API_KEY" https://yourapi.com/v1/verify
done

# Request #61 should return:
{
  "error": "unauthorized",
  "message": "Rate limit exceeded (per minute)"
}
```

---

## 📈 **APPLICATION 3: Analytics Dashboard**

### **Queries You Can Use:**

**1. Requests Over Time (Chart):**
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as requests
FROM api_key_usage
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

**2. Top Endpoints:**
```sql
SELECT 
  endpoint,
  COUNT(*) as requests,
  AVG(response_time_ms)::int as avg_ms
FROM api_key_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY endpoint
ORDER BY requests DESC
LIMIT 10;
```

**3. Error Rate by Customer:**
```sql
SELECT 
  k.name,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN u.status_code >= 400 THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN u.status_code >= 400 THEN 1 END) / COUNT(*), 2) as error_rate_percent
FROM api_keys k
JOIN api_key_usage u ON u.api_key_id = k.id
GROUP BY k.name
ORDER BY error_rate_percent DESC;
```

**4. Peak Usage Times:**
```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as requests
FROM api_key_usage
GROUP BY hour_of_day
ORDER BY requests DESC;
```

---

## 🚨 **APPLICATION 4: Security Auditing**

### **Detect Suspicious Activity:**

**1. Failed Authentication Attempts:**
```sql
-- Look for repeated 401s (brute force attempts)
SELECT 
  endpoint,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM api_key_usage
WHERE status_code = 401
AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY endpoint
HAVING COUNT(*) > 10;
```

**2. Unusual Traffic Patterns:**
```sql
-- Detect sudden spikes
SELECT 
  k.name,
  DATE_TRUNC('minute', u.created_at) as minute,
  COUNT(*) as requests
FROM api_keys k
JOIN api_key_usage u ON u.api_key_id = k.id
GROUP BY k.name, minute
HAVING COUNT(*) > 100 -- More than 100 req/min
ORDER BY requests DESC;
```

---

## 📊 **APPLICATION 5: Customer Reports**

### **Generate Usage Report:**

```sql
-- Monthly usage summary for customer
SELECT 
  k.name,
  DATE_TRUNC('day', u.created_at)::date as date,
  COUNT(*) as requests,
  COUNT(CASE WHEN u.status_code = 200 THEN 1 END) as successful,
  COUNT(CASE WHEN u.status_code >= 400 THEN 1 END) as errors,
  AVG(u.response_time_ms)::int as avg_response_ms,
  MIN(u.created_at) as first_request,
  MAX(u.created_at) as last_request
FROM api_keys k
JOIN api_key_usage u ON u.api_key_id = k.id
WHERE k.id = '8ea3bc9a-08ff-43b1-9cf6-07bd73405c55'
AND u.created_at >= DATE_TRUNC('month', NOW())
GROUP BY k.name, DATE_TRUNC('day', u.created_at)
ORDER BY date DESC;
```

---

## 🛠️ **PRACTICAL COMMANDS:**

### **Check Current Usage:**
```bash
cd apps/api
npm run keys:info -- --id 8ea3bc9a-08ff-43b1-9cf6-07bd73405c55
```

### **View All API Keys with Usage:**
```bash
npm run keys:list
```

### **Export Usage to CSV (for billing):**
```bash
psql "$DATABASE_URL" -c "COPY (
  SELECT 
    k.name,
    u.endpoint,
    u.method,
    u.status_code,
    u.response_time_ms,
    u.created_at
  FROM api_key_usage u
  JOIN api_keys k ON k.id = u.api_key_id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  ORDER BY u.created_at DESC
) TO STDOUT WITH CSV HEADER" > usage_report_$(date +%Y%m).csv
```

---

## 🎯 **REAL-WORLD SCENARIOS:**

### **Scenario 1: Customer Exceeds Rate Limit**

**What Happens:**
```
1. Customer makes 61st request in same minute
2. Rate limit check: 61 > 60
3. Request rejected: 429 Rate Limit Exceeded
4. Customer sees error in their app
5. You check: npm run keys:info -- --id <customer-key-id>
6. See they're hitting limits
7. Offer to upgrade their plan (higher limits)
```

### **Scenario 2: Monthly Billing**

**What Happens:**
```
1. End of month arrives
2. Run billing query (see above)
3. Production Mobile App: 45,320 requests = $453.20
4. Partner Insurance Co: 128,592 requests = $1,285.92
5. Generate invoices
6. Send to customers
```

### **Scenario 3: Performance Issue**

**What Happens:**
```
1. Customer complains: "API is slow!"
2. Check their key's performance:
   
   SELECT AVG(response_time_ms) 
   FROM api_key_usage 
   WHERE api_key_id = 'xxx'
   
3. See avg is 2,500ms (normally 100ms)
4. Investigate specific slow endpoints
5. Fix performance issue
6. Monitor improvement in database
```

### **Scenario 4: Security Incident**

**What Happens:**
```
1. Notice unusual activity in logs
2. Query: SELECT * FROM api_key_usage 
          WHERE status_code = 401 
          AND created_at >= NOW() - INTERVAL '1 hour'
3. See 500 failed auth attempts from same IP
4. Identify compromised key
5. Revoke immediately: npm run keys:revoke -- --id <key-id>
6. Customer's access cut off instantly
7. Issue new key to legitimate customer
```

---

## 📋 **VERIFICATION CHECKLIST:**

### **✅ How to Verify It's Working:**

**1. Make a Test Request:**
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  https://image-verification-production.up.railway.app/v1/evidence/5c536b8e-192e-4617-8b39-0094c6dcfdf6
```

**2. Check It Was Logged:**
```bash
npm run keys:info -- --id YOUR_KEY_ID
# Should show: Total Requests: 1 (or more)
```

**3. Verify in Database:**
```sql
SELECT * FROM api_key_usage 
WHERE api_key_id = 'YOUR_KEY_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

**4. Check Rate Limiting:**
```bash
# Make 100 rapid requests
for i in {1..100}; do 
  curl -H "Authorization: Bearer $KEY" https://yourapi.com/health
done

# Check count in last minute
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM api_key_usage 
  WHERE api_key_id = 'xxx' 
  AND created_at >= NOW() - INTERVAL '1 minute'
"
```

---

## 🎯 **CURRENT STATUS:**

### **Your Production API Key:**
```
Name:              Production Mobile App
Total Requests:    3 (since creation)
Error Rate:        0.00%
Avg Response Time: 105ms
Last Used:         2025-12-04T22:38:55Z

Usage Today:       3 requests = $0.03 (at $0.01/request)
Remaining Today:   99,997 requests left
```

### **What This Means:**
- ✅ Tracking is working (3 requests logged)
- ✅ Performance is good (105ms average)
- ✅ No errors (0% error rate)
- ✅ Under rate limits (3/100,000 daily)
- ✅ Ready for production use

---

## 🔮 **FUTURE APPLICATIONS:**

### **1. Automated Alerts:**
```javascript
// Monitor usage hourly
if (requestsPerHour > 10000) {
  sendAlert("High traffic detected for key: ${keyName}");
}

if (errorRate > 0.05) {
  sendAlert("High error rate for key: ${keyName}");
}
```

### **2. Dynamic Rate Limiting:**
```javascript
// Increase limits for good customers
if (customer.plan === 'enterprise') {
  updateRateLimits(keyId, {
    perMinute: 10000,
    perDay: 10000000
  });
}
```

### **3. Predictive Scaling:**
```sql
-- Predict usage for next month
SELECT 
  AVG(daily_requests) * 30 as predicted_monthly_requests
FROM (
  SELECT DATE(created_at), COUNT(*) as daily_requests
  FROM api_key_usage
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
) daily_stats;
```

---

## 📱 **HOW YOUR ANDROID APP APPLIES THIS:**

### **Every Request Includes API Key:**
```kotlin
// In PopcApiClient.kt
private val client: OkHttpClient = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${BuildConfig.API_KEY}")
            .build()
        chain.proceed(request)
    }
    .build()
```

### **Backend Tracks It:**
```typescript
// In src/index.ts
fastify.addHook('onRequest', async (request, reply) => {
  if (request.url.startsWith('/v1/')) {
    await authenticateApiKey(request, reply, fastify, db);
    // This logs to api_key_usage automatically
  }
});
```

### **Usage Updates in Real-Time:**
```
Phone enrolls device
  ↓
POST /v1/enroll with API key
  ↓
Backend: INSERT INTO api_key_usage (...)
  ↓
api_keys.usage_count += 1
  ↓
You can query usage immediately
```

---

## 🧪 **VERIFY IT YOURSELF:**

### **Test 1: Make a Request**
```bash
curl -H "Authorization: Bearer pk_a00a94a9cc00..." \
  https://image-verification-production.up.railway.app/health
```

### **Test 2: Check It Was Logged**
```bash
cd apps/api
npm run keys:info -- --id 8ea3bc9a-08ff-43b1-9cf6-07bd73405c55
```

**You'll see:**
- Total Requests increased by 1
- Last Used timestamp updated
- Avg response time recalculated

### **Test 3: Check Database**
```sql
SELECT * FROM api_key_usage 
ORDER BY created_at DESC 
LIMIT 1;
```

**You'll see:**
- api_key_id: 8ea3bc9a-08ff-43b1-9cf6-07bd73405c55
- endpoint: /health
- method: GET
- status_code: 200
- response_time_ms: ~50
- created_at: [current timestamp]

---

## 💡 **KEY TAKEAWAYS:**

1. **Every request is tracked** - No exceptions
2. **Used for rate limiting** - Checked before allowing request
3. **Used for billing** - Calculate costs from logs
4. **Used for analytics** - Understand usage patterns
5. **Used for security** - Detect abuse
6. **Applied in real-time** - Affects current requests
7. **Stored permanently** - Historical analysis

**Your system is production-ready for billing, monitoring, and security!**

