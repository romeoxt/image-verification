# PoPC Verification API

REST API for device enrollment, image verification, and evidence package retrieval.

## Features

- **Device Enrollment**: Register devices with hardware attestation certificates
- **Image Verification**: Validate signatures, content binding, and device trust
- **Evidence Packages**: Tamper-proof verification records with full provenance
- **Verification Modes**: Certified (hardware-signed), heuristic (metadata analysis)

## Quick Start

```bash
cd apps/api
npm install

# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/popc"

# Run migrations
npm run db:migrate

# Start server
npm run dev
# Listens on http://localhost:3000
```

## API Endpoints

### `POST /v1/enroll`

Enroll a device with hardware attestation.

**Request:**
```json
{
  "platform": "android",
  "certChainPem": ["-----BEGIN CERTIFICATE-----\n...", "..."],
  "challenge": "optional-server-challenge",
  "deviceMetadata": {
    "manufacturer": "Google",
    "model": "Pixel 8",
    "osVersion": "14"
  }
}
```

**Response:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "enrolledAt": "2025-10-03T12:00:00Z",
  "status": "active",
  "attestationVerified": true,
  "attestationDetails": {
    "attestationType": "basic",
    "hardwareBacked": true,
    "securityLevel": "strongbox",
    "bootState": "verified"
  },
  "warnings": []
}
```

### `POST /v1/verify`

Verify an image with optional C2PA manifest.

**Request (Multipart):**
```bash
curl -X POST http://localhost:3000/v1/verify \
  -F "asset=@image.jpg" \
  -F "manifest=@image.jpg.c2pa"  # Optional
```

**Response:**
```json
{
  "verificationId": "ver_abc123",
  "mode": "certified",
  "verdict": "verified",
  "confidence_score": 95,
  "assetSha256": "a1b2c3d4...",
  "reasons": [
    "Content binding hash matches",
    "Signature valid",
    "Device certificate chain valid",
    "Device enrolled and active"
  ],
  "metadata": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "capturedAt": "2025-10-03T12:00:00Z",
    "platform": "android"
  },
  "evidencePackageUrl": "/v1/evidence/ver_abc123",
  "verifiedAt": "2025-10-03T12:01:00Z"
}
```

**Verification Modes:**
- `certified`: Image signed with enrolled device key (highest trust)
- `heuristic`: No signature, metadata/EXIF analysis only (low trust)

**Verdicts:**
- `verified`: All checks passed
- `tampered`: Content hash mismatch or signature invalid
- `unsigned`: No manifest provided (heuristic mode)
- `device_unknown`: Device not enrolled
- `device_revoked`: Device certificate revoked

### `GET /v1/evidence/{verificationId}`

Retrieve full evidence package for a verification.

**Response:**
```json
{
  "verificationId": "ver_abc123",
  "version": "1.0",
  "verifiedAt": "2025-10-03T12:01:00Z",
  "verdict": "verified",
  "mode": "certified",
  "asset": {
    "sha256": "a1b2c3d4...",
    "mimeType": "image/jpeg",
    "size": 2048576
  },
  "manifest": { "...": "Full C2PA manifest" },
  "signature": {
    "algorithm": "ES256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "valid": true
  },
  "device": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "enrolled": true,
    "attestationVerified": true,
    "securityLevel": "strongbox"
  },
  "contentBinding": {
    "hashAlgorithm": "sha256",
    "manifestHash": "a1b2c3d4...",
    "computedHash": "a1b2c3d4...",
    "matches": true
  },
  "checks": [
    { "name": "content_binding", "passed": true },
    { "name": "signature_valid", "passed": true },
    { "name": "device_enrolled", "passed": true }
  ],
  "transparencyLog": {
    "merkleRoot": "...",
    "leafIndex": 12345
  }
}
```

## Database Schema

### `devices` Table
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT NOT NULL,
  attestation_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  os_version TEXT,
  public_key_fingerprint TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);
```

### `verifications` Table
```sql
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  asset_sha256 TEXT NOT NULL,
  mode TEXT NOT NULL,
  verdict TEXT NOT NULL,
  confidence_score INTEGER,
  manifest JSONB,
  evidence JSONB NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `transparency_log` Table
```sql
CREATE TABLE transparency_log (
  id SERIAL PRIMARY KEY,
  verification_id TEXT REFERENCES verifications(id),
  merkle_root TEXT,
  leaf_hash TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration

Environment variables (`.env`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/popc

# Server
PORT=3000
NODE_ENV=development

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# Optional: Timestamp authority
TSA_URL=http://timestamp.digicert.com

# Logging
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Start dev server (auto-reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run all tests
npm test

# Test enrollment
curl -X POST http://localhost:3000/v1/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "web",
    "csrPem": "-----BEGIN CERTIFICATE REQUEST-----\n...",
    "publicKeyFingerprint": "SHA256:abc123...",
    "allowSoftware": true
  }'

# Test verification (heuristic)
curl -X POST http://localhost:3000/v1/verify \
  -F "asset=@test.jpg"

# Test verification (certified)
curl -X POST http://localhost:3000/v1/verify \
  -F "asset=@test.jpg" \
  -F "manifest=@test.jpg.c2pa"

# Get evidence
curl http://localhost:3000/v1/evidence/ver_abc123
```

## Deployment

### Docker

```bash
# Build image
docker build -t popc-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  popc-api
```

### Railway

Already configured in `railway.json`:

```bash
railway up
```

## Security Considerations

### Certificate Validation
- X.509 certificate chains validated against device manufacturer roots
- Certificate expiration checked
- Revocation lists (CRLs) supported

### Content Binding
- SHA-256 hash embedded in signed manifest
- Any image modification invalidates signature
- Hash recomputed server-side for every verification

### Device Revocation
- Devices can be marked as revoked in database
- Revoked devices fail all future verifications
- Revocation is permanent and logged

### Rate Limiting
- TODO: Implement rate limiting per device/IP
- Recommended: 100 verifications/hour per device

## API Versioning

- Current version: `v1`
- Breaking changes will use new version prefix (`v2`, etc.)
- Version specified in URL path: `/v1/verify`

## Monitoring

Recommended metrics to track:
- Verification requests/sec
- Success rate by mode (certified vs heuristic)
- Average response time
- Database connection pool usage
- Error rates by endpoint

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify network connectivity

### "Device not found"
- Device must be enrolled via `/v1/enroll` first
- Check device ID in manifest matches enrolled device

### "Signature invalid"
- Verify manifest was signed with correct private key
- Check that assertions JSON matches what was signed
- Ensure public key in manifest matches enrolled device

## License

Proprietary - All rights reserved
