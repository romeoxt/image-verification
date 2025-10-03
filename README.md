# Proof of Physical Capture (PoPC) SaaS Platform

A complete system for cryptographically verifying that photos and videos were captured by trusted devices and have not been tampered with.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client SDKs                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Android    │  │  Desktop CLI │  │   Future: iOS/Web    │  │
│  │   (Kotlin)   │  │  (Node.js)   │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    Verification API (Node.js)                    │
│  ┌────────────┐  ┌───────────────┐  ┌────────────────────┐     │
│  │  /v1/enroll │  │  /v1/verify   │  │  /v1/evidence/{id} │     │
│  └────────────┘  └───────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│         devices | verifications | transparency_log               │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+**
- **Docker** (optional, for containerized deployment)
- **Android Studio** (for Android app development)
- **Java 17+** (for Android Gradle builds)

### 1. Clone & Install

```bash
git clone https://github.com/romeoxt/image-verification.git
cd image-verification
npm install
```

### 2. Database Setup

```bash
# Set your PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/popc"

# Run migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed
```

### 3. Start API Server

```bash
npm run dev
# API runs on http://localhost:3000
```

### 4. Test with Desktop Signer

```bash
cd packages/desktop-signer

# Enroll device
npx popc enroll

# Capture and sign an image (use your camera or place image in directory)
npx popc sign test.jpg

# Verify
npx popc verify test.jpg
```

### 5. Build Android App

```bash
cd apps/android-popc

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Or open in Android Studio:
# File > Open > apps/android-popc
```

## Components

### `/apps/api` - Verification API Server
- Fastify-based REST API
- Endpoints: `/v1/enroll`, `/v1/verify`, `/v1/evidence/{id}`
- Database: PostgreSQL with device registry, verification logs
- See: [apps/api/README.md](apps/api/README.md)

### `/apps/android-popc` - Android SDK & Pilot App
- Hardware-backed key generation (StrongBox/TEE/Software)
- CameraX integration for capture
- Gallery import with heuristic/post-sign verification
- See: [apps/android-popc/README.md](apps/android-popc/README.md)

### `/packages/desktop-signer` - CLI for Web Platform
- Software-backed EC P-256 keypair
- ES256 signatures with C2PA manifests
- Commands: `enroll`, `sign`, `verify`
- See: [packages/desktop-signer/README.md](packages/desktop-signer/README.md)

### `/packages/c2pa` - C2PA Verification Library
- Shared library for manifest validation
- Content binding verification
- Signature verification
- Used by API server

## Verification Modes

| Mode | Description | Trust Level |
|------|-------------|-------------|
| **CERTIFIED** | Signed at capture with hardware key | ⭐⭐⭐ Highest |
| **CERTIFIED (post-sign)** | Signed after capture (Import flow) | ⭐⭐ Medium |
| **HEURISTIC** | No signature, metadata analysis only | ⭐ Low |

## Environment Variables

Create `.env` file in root (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/popc

# API Server
PORT=3000
NODE_ENV=development

# Optional: Trusted timestamp authority
TSA_URL=http://timestamp.digicert.com
```

## Docker Deployment

```bash
# Start all services (API + PostgreSQL)
docker compose up --build

# API available at http://localhost:3000
```

## Development Workflow

```bash
# Install dependencies for all workspaces
npm install

# Run API in dev mode (auto-reload)
npm run dev

# Build all packages
npm run build

# Run tests
npm test

# Database operations
npm run db:migrate   # Apply schema
npm run db:seed      # Insert test data
npm run db:reset     # Drop + recreate
```

## Testing

### API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Enroll desktop device
cd packages/desktop-signer
npx popc enroll

# Verify an image
curl -X POST http://localhost:3000/v1/verify \
  -F "asset=@test.jpg" \
  -F "manifest=@test.jpg.c2pa"
```

### Android App

1. Open `apps/android-popc` in Android Studio
2. Run on physical device (hardware attestation requires real device)
3. Workflow:
   - Enroll → Capture → Sign & Verify → View Evidence
   - Or: Import → Verify (Heuristic) / Sign & Verify (Post-Sign)

## Project Structure

```
image-verification/
├── apps/
│   ├── android-popc/          # Android app
│   └── api/                   # Node.js API server
├── packages/
│   ├── c2pa/                  # C2PA verification library
│   └── desktop-signer/        # CLI tool
├── scripts/                   # Deployment scripts
├── docs/                      # OpenAPI specs, schemas
├── docker-compose.yml         # Docker orchestration
└── package.json               # Workspace root
```

## Key Technologies

- **Backend**: Node.js, Fastify, PostgreSQL
- **Android**: Kotlin, CameraX, Android Keystore, Navigation Component
- **Crypto**: EC P-256 (ES256), SHA-256, Hardware TEE/StrongBox
- **Standards**: C2PA manifests, X.509 certificates, RFC-3161 timestamps

## Security Model

### Hardware Attestation (Android)
- Private keys stored in StrongBox/TEE
- Certificate chain proves hardware backing
- Keys cannot be extracted from device

### Content Binding
- SHA-256 hash of image embedded in signed manifest
- Any pixel change invalidates signature

### Device Registry
- API maintains allowlist of enrolled devices
- Certificate revocation for compromised devices

### Transparency Log
- Append-only Merkle tree of all verifications
- Tamper-evident audit trail

## Deployment

### Railway (Production)

```bash
# Already configured in railway.json
railway up
```

### Self-Hosted Docker

```bash
docker compose up -d
```

### Environment Requirements
- CPU: 1 vCPU minimum
- RAM: 512MB minimum
- Storage: 10GB (for logs + evidence packages)
- Network: HTTPS required for production

## Roadmap

- [ ] iOS SDK with Secure Enclave
- [ ] Web SDK with WebAuthn/TPM
- [ ] Zero-knowledge proofs (location-in-tile, time-window)
- [ ] Video support with Merkle-tree chunking
- [ ] Certificate revocation lists (CRLs)
- [ ] Admin dashboard for device management

## License

Proprietary - All rights reserved

## Support

For issues or questions:
- GitHub Issues: https://github.com/romeoxt/image-verification/issues
- Email: herbylegall9@gmail.com
