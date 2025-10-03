# PoPC Desktop Signer CLI

Command-line tool for enrolling web platform devices and signing images with software-backed EC P-256 keys.

## Overview

The Desktop Signer allows web browsers and desktop applications to participate in the PoPC ecosystem using software-backed cryptographic keys. While not as secure as hardware-backed keys (Android Keystore, iOS Secure Enclave), it provides certified verification for desktop workflows.

## Installation

### Global Install (Recommended)

```bash
npm install -g @popc/desktop-signer
```

### Local Install

```bash
cd packages/desktop-signer
npm install
npm link
```

## Quick Start

```bash
# 1. Enroll this device
popc enroll

# 2. Sign an image
popc sign photo.jpg

# 3. Verify the image
popc verify photo.jpg
```

## Commands

### `popc enroll`

Generate a keypair and enroll with the PoPC API.

```bash
popc enroll [options]

Options:
  --api-url <url>    API base URL (default: from config or https://image-verification-production.up.railway.app)
  --force            Overwrite existing enrollment
```

**What it does:**
1. Generates EC P-256 keypair (software-backed)
2. Creates X.509 certificate (self-signed)
3. Sends public key to API via `POST /v1/enroll`
4. Saves config to `~/.popc/config.json`

**Example:**
```bash
$ popc enroll
✓ Generated EC P-256 keypair
✓ Device enrolled successfully

Device ID: 550e8400-e29b-41d4-a716-446655440000
Security Level: software
Public Key Fingerprint: SHA256:abc123def456...
```

### `popc sign`

Sign an image file with your enrolled device key.

```bash
popc sign <image-path> [options]

Options:
  --output <path>    Output path for manifest (default: <image>.c2pa)
```

**What it does:**
1. Reads image file
2. Computes SHA-256 hash
3. Builds C2PA assertions JSON
4. Signs assertions with private key (ES256)
5. Creates C2PA manifest
6. Saves manifest as sidecar file

**Example:**
```bash
$ popc sign photo.jpg
✓ Image hash: a1b2c3d4e5f6...
✓ Signed with device 550e8400-e29b-41d4-a716-446655440000
✓ Manifest saved to photo.jpg.c2pa
```

**Manifest Structure:**
```json
{
  "version": "1.0",
  "claims": [...],
  "signature": {
    "algorithm": "ES256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "signature": "base64-encoded-signature"
  },
  "assertions": {
    "c2pa.hash.data": {
      "algorithm": "sha256",
      "hash": "a1b2c3d4..."
    },
    "popc.device.id": "550e8400-...",
    "c2pa.timestamp": "2025-10-03T12:00:00Z",
    "platform": "web",
    "securityLevel": "software"
  }
}
```

### `popc verify`

Verify an image and its manifest.

```bash
popc verify <image-path> [options]

Options:
  --manifest <path>  Path to manifest file (default: <image>.c2pa)
  --api-url <url>    API base URL
```

**What it does:**
1. Reads image and manifest
2. Uploads to API via `POST /v1/verify`
3. Displays verification result

**Example (Success):**
```bash
$ popc verify photo.jpg
✓ Verification ID: ver_abc123xyz
✓ Mode: CERTIFIED
✓ Verdict: VERIFIED
✓ Confidence: 95%

Reasons:
  • Content binding hash matches
  • Signature valid
  • Device certificate chain valid
  • Device enrolled and active

Evidence: https://api.popc.example.com/v1/evidence/ver_abc123xyz
```

**Example (Tampered):**
```bash
$ popc verify modified.jpg
✗ Verification ID: ver_def456uvw
✗ Mode: CERTIFIED
✗ Verdict: TAMPERED
✗ Confidence: 0%

Reasons:
  • Content hash mismatch
  • Expected: a1b2c3d4...
  • Got: e5f6g7h8...
```

### `popc config`

View or update configuration.

```bash
# Show current config
popc config

# Set API URL
popc config set api-url https://api.popc.example.com

# Show device ID
popc config get device-id
```

## Configuration

Config stored at `~/.popc/config.json`:

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\n...",
  "apiUrl": "https://image-verification-production.up.railway.app",
  "platform": "web",
  "securityLevel": "software",
  "enrolledAt": "2025-10-03T12:00:00Z"
}
```

**Security Note:** Private key stored in plaintext. For production use, consider:
- File permissions: `chmod 600 ~/.popc/config.json`
- Encrypted storage (OS keychain)
- Hardware security module (HSM)

## How It Works

### Enrollment Flow

```
┌──────────┐                           ┌──────────┐
│ Desktop  │   1. Generate Keypair     │   API    │
│  Signer  │ ─────────────────────────>│  Server  │
│          │                            │          │
│          │   2. POST /v1/enroll       │          │
│          │ ─────────────────────────>│          │
│          │   {                        │          │
│          │     platform: "web",       │          │
│          │     csrPem: "...",         │          │
│          │     publicKeyFingerprint   │          │
│          │   }                        │          │
│          │                            │          │
│          │   3. Device ID             │          │
│          │ <─────────────────────────│          │
│          │   {                        │          │
│          │     deviceId: "uuid",      │          │
│          │     securityLevel: "soft"  │          │
│          │   }                        │          │
└──────────┘                           └──────────┘
```

### Signing Flow

```
┌──────────┐
│  Image   │   1. Read bytes
│  File    │ ───────────────────────────> SHA-256 hash
│          │
│          │   2. Build assertions
│          │      {
│          │        "c2pa.hash.data": {...},
│          │        "popc.device.id": "uuid"
│          │      }
│          │
│          │   3. Sign assertions JSON
│          │ ───────────────────────────> ES256 signature
│          │      with private key
│          │
│          │   4. Create manifest
│          │      {
│          │        assertions: {...},
│          │        signature: {...}
│          │      }
│          │
│          │   5. Save sidecar
│          │ ───────────────────────────> image.jpg.c2pa
└──────────┘
```

### Verification Flow

```
┌──────────┐                           ┌──────────┐
│ Desktop  │   1. Upload asset +        │   API    │
│  Signer  │      manifest              │  Server  │
│          │ ─────────────────────────>│          │
│          │   POST /v1/verify          │          │
│          │   - asset: image bytes     │          │
│          │   - manifest: JSON         │          │
│          │                            │          │
│          │   2. Server validates:     │          │
│          │      ✓ Hash matches        │          │
│          │      ✓ Signature valid     │          │
│          │      ✓ Device enrolled     │          │
│          │                            │          │
│          │   3. Verification result   │          │
│          │ <─────────────────────────│          │
│          │   {                        │          │
│          │     verdict: "verified",   │          │
│          │     mode: "certified",     │          │
│          │     confidence: 95         │          │
│          │   }                        │          │
└──────────┘                           └──────────┘
```

## Use Cases

### Photojournalism
```bash
# Photographer signs images before submission
popc sign breaking-news.jpg
# Editor verifies authenticity
popc verify breaking-news.jpg
```

### Legal Evidence
```bash
# Investigator signs evidence photos
popc sign evidence-001.jpg
# Court verifies chain of custody
popc verify evidence-001.jpg
```

### Content Moderation
```bash
# User uploads photo with manifest
popc sign user-content.jpg
# Platform verifies no tampering
popc verify user-content.jpg
```

## Limitations

### Security Considerations

**Software-Backed Keys:**
- Private key stored on disk (can be extracted)
- No hardware protection
- Less secure than Android Keystore or iOS Secure Enclave

**Recommended For:**
- ✅ Desktop workflows with trusted operators
- ✅ Development and testing
- ✅ Lower-risk verification scenarios

**Not Recommended For:**
- ❌ High-security applications (use hardware-backed keys)
- ❌ Untrusted environments
- ❌ Legal admissibility (depends on jurisdiction)

## Development

```bash
cd packages/desktop-signer
npm install

# Run locally
npm run build
npm link

# Run tests
npm test

# Publish to npm
npm version patch
npm publish
```

## API Compatibility

- API Version: `v1`
- Endpoints: `/v1/enroll`, `/v1/verify`
- See: [API Documentation](../../apps/api/README.md)

## Troubleshooting

### "Device not enrolled"
```bash
# Re-enroll
popc enroll --force
```

### "API connection failed"
```bash
# Check API URL
popc config get api-url

# Update API URL
popc config set api-url https://your-api-url.com
```

### "Signature invalid"
- Ensure you're using the same device that signed the image
- Check that image hasn't been modified
- Verify config file hasn't been corrupted

### "Permission denied" (config file)
```bash
chmod 600 ~/.popc/config.json
```

## Future Enhancements

- [ ] WebAuthn/Platform Authenticator support
- [ ] TPM integration for Windows
- [ ] macOS Keychain integration
- [ ] Batch signing for multiple files
- [ ] GUI application

## License

Proprietary - All rights reserved
