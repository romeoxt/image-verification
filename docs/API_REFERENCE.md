# API Reference

Complete API documentation for PoPC (Proof of Physical Capture).

**Base URL:** `https://api.popc.dev`  
**Authentication:** Bearer token in `Authorization` header

---

## 🔐 **Authentication**

All API requests require an API key:

```bash
curl https://api.popc.dev/v1/verify \
  -H "Authorization: Bearer pk_your_key_here"
```

**API Key Format:** `pk_` followed by 64 hex characters

**Get an API Key:**
- Dashboard: [popc.dev/dashboard](https://popc.dev/dashboard)
- CLI: `popc keys create --name "My App"`

---

## 📊 **Rate Limits**

| Plan | Per Minute | Per Day |
|------|------------|---------|
| Free | 60 | 100 |
| Starter | 1,000 | 1,000 |
| Growth | 1,000 | 10,000 |
| Pro | 10,000 | 50,000 |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704326400
```

**429 Response:**
```json
{
  "error": "unauthorized",
  "message": "Rate limit exceeded (per minute)"
}
```

---

## 🔹 **POST /v1/verify**

Verify a photo or video's authenticity.

### **Request**

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `image` (file, required) - Image or video file
- `manifest` (file, required) - C2PA manifest file (.c2pa)

### **Example**

```bash
curl -X POST https://api.popc.dev/v1/verify \
  -H "Authorization: Bearer pk_your_key_here" \
  -F "image=@photo.jpg" \
  -F "manifest=@photo.jpg.c2pa"
```

### **Response**

**Status:** `200 OK`

```json
{
  "verdict": "verified",
  "confidence": 100,
  "mode": "certified",
  "deviceId": "dev_android_abc123",
  "securityLevel": "strongbox",
  "reasons": [
    "hardware_attestation_present",
    "signature_valid",
    "content_binding_valid"
  ],
  "verificationId": "5c536b8e-192e-4617-8b39-0094c6dcfdf6",
  "timestamp": "2025-12-04T22:38:55.591876Z",
  "metadata": {
    "capturedAt": "2025-12-04T22:35:10Z",
    "deviceModel": "Samsung SM-S928U",
    "platform": "android",
    "osVersion": "16"
  }
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `verdict` | string | `verified`, `tampered`, `invalid`, or `unsigned` |
| `confidence` | number | 0-100 confidence score |
| `mode` | string | `certified` (hardware) or `signed` (software) |
| `deviceId` | string\|null | Device that captured the media |
| `securityLevel` | string\|null | `strongbox`, `tee`, `software`, or `unknown` |
| `reasons` | string[] | Array of reasons for the verdict |
| `verificationId` | string | UUID for this verification |
| `timestamp` | string | ISO 8601 timestamp |
| `metadata` | object | Additional device/capture info |

### **Verdict Types**

- **`verified`**: Signature valid, content untampered, hardware attestation present
- **`tampered`**: Signature valid but content modified
- **`invalid`**: Signature invalid or verification failed
- **`unsigned`**: No signature/manifest found

### **Security Levels**

- **`strongbox`**: Android StrongBox (highest security)
- **`tee`**: Trusted Execution Environment
- **`software`**: Software-backed keys
- **`unknown`**: Security level not determined

### **Error Responses**

**400 Bad Request:**
```json
{
  "error": "invalid_request",
  "message": "Missing required file: manifest",
  "details": "Both image and manifest files are required"
}
```

**401 Unauthorized:**
```json
{
  "error": "unauthorized",
  "message": "Invalid API key"
}
```

**429 Too Many Requests:**
```json
{
  "error": "unauthorized",
  "message": "Rate limit exceeded (per minute)"
}
```

**413 Payload Too Large:**
```json
{
  "error": "payload_too_large",
  "message": "Image size exceeds 100MB limit"
}
```

---

## 🔹 **POST /v1/enroll**

Enroll a new device (generates hardware-backed keypair).

### **Request**

**Content-Type:** `application/json`

```json
{
  "platform": "android",
  "certChainPem": [
    "-----BEGIN CERTIFICATE-----\n...",
    "-----BEGIN CERTIFICATE-----\n..."
  ],
  "challenge": "base64_encoded_challenge",
  "deviceMetadata": {
    "manufacturer": "Samsung",
    "model": "SM-S928U",
    "osVersion": "16",
    "clientSecurityLevel": "strongbox"
  }
}
```

### **Response**

**Status:** `201 Created`

```json
{
  "deviceId": "dev_android_abc123",
  "enrolledAt": "2025-12-04T22:30:00Z",
  "securityLevel": "strongbox",
  "expiresAt": "2048-01-01T00:00:00Z",
  "attestationDetails": {
    "bootState": "verified",
    "verifiedBootKey": true,
    "osVersion": "16",
    "patchLevel": "2025-11"
  }
}
```

### **Errors**

**400 - Software Key Not Allowed (Production):**
```json
{
  "error": "enrollment_rejected",
  "message": "Device does not support hardware-backed security. StrongBox or TEE required.",
  "details": {
    "detectedSecurityLevel": "software",
    "requiredSecurityLevel": "strongbox|tee"
  }
}
```

---

## 🔹 **GET /v1/evidence/:verificationId**

Get detailed evidence for a specific verification.

### **Request**

```bash
curl https://api.popc.dev/v1/evidence/5c536b8e-192e-4617-8b39-0094c6dcfdf6 \
  -H "Authorization: Bearer pk_your_key_here"
```

### **Response**

**Status:** `200 OK`

```json
{
  "verificationId": "5c536b8e-192e-4617-8b39-0094c6dcfdf6",
  "verdict": "verified",
  "confidence": 100,
  "deviceId": "dev_android_abc123",
  "verifiedAt": "2025-12-04T22:38:55Z",
  "evidence": {
    "signature": {
      "algorithm": "ES256",
      "valid": true,
      "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
    },
    "contentBinding": {
      "hashAlgorithm": "sha256",
      "imageHash": "abc123...",
      "manifestHash": "def456...",
      "match": true
    },
    "attestation": {
      "securityLevel": "strongbox",
      "bootState": "verified",
      "certChainValid": true,
      "certChainLength": 4
    },
    "metadata": {
      "capturedAt": "2025-12-04T22:35:10Z",
      "platform": "android",
      "deviceModel": "Samsung SM-S928U",
      "location": null,
      "custom": {}
    }
  }
}
```

### **Errors**

**404 Not Found:**
```json
{
  "error": "not_found",
  "message": "Verification not found"
}
```

---

## 🔹 **GET /v1/devices**

List all enrolled devices for your account.

### **Request**

```bash
curl https://api.popc.dev/v1/devices \
  -H "Authorization: Bearer pk_your_key_here"
```

### **Response**

**Status:** `200 OK`

```json
{
  "devices": [
    {
      "id": "dev_android_abc123",
      "platform": "android",
      "securityLevel": "strongbox",
      "status": "active",
      "enrolledAt": "2025-12-01T10:00:00Z",
      "lastUsedAt": "2025-12-04T22:35:10Z",
      "metadata": {
        "manufacturer": "Samsung",
        "model": "SM-S928U",
        "osVersion": "16"
      }
    }
  ],
  "total": 1
}
```

---

## 🔹 **POST /v1/devices/:deviceId/revoke**

Revoke a device (disable future verifications from it).

### **Request**

```bash
curl -X POST https://api.popc.dev/v1/devices/dev_android_abc123/revoke \
  -H "Authorization: Bearer pk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Device lost or stolen"}'
```

### **Response**

**Status:** `200 OK`

```json
{
  "deviceId": "dev_android_abc123",
  "status": "revoked",
  "revokedAt": "2025-12-04T23:00:00Z",
  "reason": "Device lost or stolen"
}
```

### **Effect**

After revocation:
- All future verifications from this device will return `verdict: "invalid"`
- Past verifications remain unchanged
- Device cannot be re-enrolled (generate new keypair)

---

## 🔹 **GET /v1/keys/info**

Get information about your current API key.

### **Request**

```bash
curl https://api.popc.dev/v1/keys/info \
  -H "Authorization: Bearer pk_your_key_here"
```

### **Response**

**Status:** `200 OK`

```json
{
  "id": "8ea3bc9a-08ff-43b1-9cf6-07bd73405c55",
  "name": "Production Mobile App",
  "scopes": ["verify:read", "verify:write", "device:read", "device:write"],
  "rateLimit": {
    "perMinute": 1000,
    "perDay": 100000
  },
  "usage": {
    "total": 3542,
    "today": 127,
    "thisMonth": 3542
  },
  "createdAt": "2025-11-01T00:00:00Z",
  "lastUsedAt": "2025-12-04T22:38:55Z",
  "expiresAt": null
}
```

---

## 🔹 **GET /v1/verifications**

List recent verifications (paginated).

### **Request**

```bash
curl "https://api.popc.dev/v1/verifications?limit=10&offset=0" \
  -H "Authorization: Bearer pk_your_key_here"
```

### **Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of results (max 100) |
| `offset` | number | 0 | Pagination offset |
| `verdict` | string | - | Filter by verdict (`verified`, `tampered`, etc.) |
| `deviceId` | string | - | Filter by device |
| `since` | string | - | ISO 8601 timestamp (only results after) |

### **Response**

**Status:** `200 OK`

```json
{
  "verifications": [
    {
      "id": "5c536b8e-192e-4617-8b39-0094c6dcfdf6",
      "verdict": "verified",
      "confidence": 100,
      "deviceId": "dev_android_abc123",
      "verifiedAt": "2025-12-04T22:38:55Z"
    }
  ],
  "total": 3542,
  "limit": 10,
  "offset": 0
}
```

---

## 🔹 **Webhooks (Coming Soon)**

Subscribe to events:

- `verification.completed`
- `device.enrolled`
- `device.revoked`
- `verification.failed`

**Webhook Payload Example:**
```json
{
  "event": "verification.completed",
  "timestamp": "2025-12-04T22:38:55Z",
  "data": {
    "verificationId": "5c536b8e-...",
    "verdict": "verified",
    "deviceId": "dev_android_abc123"
  }
}
```

---

## 🛠️ **SDKs**

### **Node.js**

```bash
npm install @popc/node
```

```javascript
const { PoPC } = require('@popc/node');

const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

const result = await popc.verify(imageBuffer, manifestBuffer);
console.log(result.verdict);
```

[Full Node.js Docs →](../packages/node-sdk/README.md)

### **Android**

```gradle
implementation 'com.popc:android:1.0.0'
```

```kotlin
val popc = PoPC(apiKey = BuildConfig.POPC_API_KEY)
val result = popc.verify(imageFile, manifestFile)
```

[Full Android Docs →](../apps/android-popc/README.md)

### **CLI**

```bash
npm install -g @popc/cli

popc verify photo.jpg photo.jpg.c2pa
```

---

## 🔒 **Security**

### **Best Practices**

1. **Never commit API keys** to version control
2. **Use environment variables** for key storage
3. **Rotate keys regularly** (every 90 days)
4. **Use different keys** for dev/staging/production
5. **Verify on backend**, not client-side only

### **Key Rotation**

```bash
# Create new key
popc keys create --name "Production Mobile App v2"

# Update your app
export POPC_API_KEY=pk_new_key_here

# Revoke old key
popc keys revoke --id old_key_id
```

---

## 📊 **Status Codes**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (enrollment) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (insufficient scopes) |
| 404 | Not Found |
| 413 | Payload Too Large (>100MB) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 🌐 **Environments**

### **Production**
```
https://api.popc.dev
```

### **Staging (Coming Soon)**
```
https://api-staging.popc.dev
```

---

## 💬 **Support**

- **Email:** support@popc.dev
- **Discord:** [Join community](https://discord.gg/popc)
- **Status Page:** [status.popc.dev](https://status.popc.dev)

---

## 📚 **More Resources**

- [Quick Start Guide](./QUICK_START.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Changelog](./CHANGELOG.md)

---

**Last Updated:** December 8, 2025  
**API Version:** v1

