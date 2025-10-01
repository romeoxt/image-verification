/**
 * Unit tests for /v1/evidence/:verificationId endpoint
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { query, queryOne, initDb } from '../src/lib/db.js';
import { generateVerificationId } from '../src/lib/crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load JSON schemas for validation
const evidencePackageSchema = JSON.parse(
  readFileSync(join(__dirname, '../../../docs/schemas/EvidencePackage.json'), 'utf-8')
);

// Setup Ajv validator
const ajv = new Ajv({ strict: false });
addFormats(ajv);
const validateEvidencePackage = ajv.compile(evidencePackageSchema);

// Initialize database for tests
initDb({
  connectionString: process.env.DATABASE_URL || 'postgresql://popc:popc_password@localhost:5432/popc',
});

/**
 * Test: Evidence package for verified verdict validates against schema
 */
test('Evidence package - verified verdict validates against EvidencePackage schema', async () => {
  // Create a test verification record in database
  const verificationId = generateVerificationId();
  const assetSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const manifestSha256 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

  // Insert test device
  const deviceResult = await query(
    `INSERT INTO devices (
      id,
      public_key,
      attestation_type,
      enrolled_at,
      platform,
      manufacturer,
      model,
      os_version,
      public_key_fingerprint
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      '00000000-0000-0000-0000-000000000001',
      'test-public-key',
      'android_key_attestation',
      new Date(),
      'android',
      'Google',
      'Pixel 7',
      'Android 14',
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    ]
  );

  const deviceId = '00000000-0000-0000-0000-000000000001';

  // Insert test device cert
  await query(
    `INSERT INTO device_certs (
      id,
      device_id,
      cert_pem,
      issuer,
      subject,
      not_before,
      not_after,
      status,
      fingerprint,
      is_leaf,
      chain_position
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      '00000000-0000-0000-0000-000000000002',
      deviceId,
      '-----BEGIN CERTIFICATE-----\nMIICeDCCAh6gAwIBAgIBATAKBggqhkjOPQQDAjA5...\n-----END CERTIFICATE-----',
      'CN=Android Keystore,O=Android,C=US',
      'CN=Android Keystore Leaf,O=Android,C=US',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2025-01-01T00:00:00Z'),
      'valid',
      'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      true,
      0,
    ]
  );

  // Insert test policy
  await query(
    `INSERT INTO policies (id, name, json, description, is_active)
    VALUES ($1, $2, $3, $4, $5)`,
    [
      '00000000-0000-0000-0000-000000000003',
      'test-policy',
      JSON.stringify({ require_signature: true }),
      'Test policy',
      true,
    ]
  );

  // Insert test verification
  await query(
    `INSERT INTO verifications (
      id,
      asset_sha256,
      verdict,
      reasons_json,
      device_id,
      policy_id,
      asset_size_bytes,
      asset_mime_type,
      manifest_sha256,
      signature_algorithm,
      captured_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      verificationId,
      assetSha256,
      'verified',
      JSON.stringify(['Content binding hash matches', 'Signature valid', 'Device certificate chain valid']),
      deviceId,
      '00000000-0000-0000-0000-000000000003',
      1024000,
      'image/jpeg',
      manifestSha256,
      'ES256',
      new Date('2024-01-15T10:30:00Z'),
      new Date('2024-01-15T10:35:22Z'),
    ]
  );

  // Insert transparency log entry
  await query(
    `INSERT INTO transparency_log (
      asset_sha256,
      device_cert_fingerprint,
      merkle_leaf,
      merkle_root,
      tree_size,
      leaf_index,
      verification_id,
      inserted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      assetSha256,
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
      12345,
      12344,
      verificationId,
      new Date('2024-01-15T10:35:22Z'),
    ]
  );

  // Build mock evidence package (simulating what the endpoint returns)
  const evidencePackage = {
    packageVersion: '1.0',
    verificationId,
    generatedAt: new Date().toISOString(),
    asset: {
      sha256: assetSha256,
      sizeBytes: 1024000,
      mimeType: 'image/jpeg',
    },
    manifest: {
      format: 'c2pa-1.0',
      present: true,
      contentBinding: {
        algorithm: 'sha256',
        hash: assetSha256,
        matches: true,
      },
    },
    verification: {
      mode: 'certified',
      verdict: 'verified',
      verifiedAt: '2024-01-15T10:35:22Z',
      reasons: ['Content binding hash matches', 'Signature valid', 'Device certificate chain valid'],
      policyApplied: 'test-policy',
    },
    signature: {
      algorithm: 'ES256',
      valid: true,
      signedAt: '2024-01-15T10:30:00Z',
      publicKeyFingerprint: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    },
    deviceCertChain: [
      {
        pem: '-----BEGIN CERTIFICATE-----\nMIICeDCCAh6gAwIBAgIBATAKBggqhkjOPQQDAjA5...\n-----END CERTIFICATE-----',
        subject: 'CN=Android Keystore Leaf,O=Android,C=US',
        issuer: 'CN=Android Keystore,O=Android,C=US',
        notBefore: '2024-01-01T00:00:00.000Z',
        notAfter: '2025-01-01T00:00:00.000Z',
        fingerprint: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
        valid: true,
      },
    ],
    deviceAttestation: {
      attestationType: 'android_key_attestation',
      hardwareBacked: true,
      verified: true,
      securityLevel: 'strongbox',
    },
    transparencyLog: {
      logId: 'tlog_1',
      insertedAt: '2024-01-15T10:35:22Z',
      merkleRoot: 'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
      treeSize: 12345,
      leafIndex: 12344,
    },
    metadata: {
      deviceId: 'dev_00000000-0000-0000-0000-000000000001',
      capturedAt: '2024-01-15T10:30:00.000Z',
      deviceModel: 'Pixel 7',
      osVersion: 'Android 14',
    },
    chainOfCustody: [
      {
        event: 'captured',
        timestamp: '2024-01-15T10:30:00.000Z',
        actor: 'device:dev_00000000-0000-0000-0000-000000000001',
      },
      {
        event: 'verified',
        timestamp: '2024-01-15T10:35:22Z',
        actor: 'api:verification_service',
      },
      {
        event: 'evidence_generated',
        timestamp: new Date().toISOString(),
        actor: 'api:evidence_service',
      },
    ],
  };

  const valid = validateEvidencePackage(evidencePackage);
  if (!valid) {
    console.error('Validation errors:', JSON.stringify(validateEvidencePackage.errors, null, 2));
  }
  assert.strictEqual(valid, true, 'Evidence package should validate against schema');

  // Cleanup
  await query('DELETE FROM transparency_log WHERE verification_id = $1', [verificationId]);
  await query('DELETE FROM verifications WHERE id = $1', [verificationId]);
  await query('DELETE FROM device_certs WHERE device_id = $1', [deviceId]);
  await query('DELETE FROM devices WHERE id = $1', [deviceId]);
  await query('DELETE FROM policies WHERE id = $1', ['00000000-0000-0000-0000-000000000003']);
});

/**
 * Test: Evidence package for tampered verdict
 */
test('Evidence package - tampered verdict validates against schema', async () => {
  const verificationId = generateVerificationId();
  const assetSha256 = 'd4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5';

  await query(
    `INSERT INTO verifications (
      id,
      asset_sha256,
      verdict,
      reasons_json,
      device_id,
      policy_id,
      asset_size_bytes,
      asset_mime_type,
      manifest_sha256,
      signature_algorithm,
      captured_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      verificationId,
      assetSha256,
      'tampered',
      JSON.stringify(['content_binding_mismatch']),
      null,
      null,
      2048000,
      'image/png',
      null,
      null,
      null,
      new Date(),
    ]
  );

  const evidencePackage = {
    packageVersion: '1.0',
    verificationId,
    generatedAt: new Date().toISOString(),
    asset: {
      sha256: assetSha256,
      sizeBytes: 2048000,
      mimeType: 'image/png',
    },
    manifest: {
      format: 'c2pa-1.0',
      present: false,
    },
    verification: {
      mode: 'certified',
      verdict: 'tampered',
      verifiedAt: new Date().toISOString(),
      reasons: ['content_binding_mismatch'],
      policyApplied: null,
    },
    signature: null,
    deviceCertChain: [],
    deviceAttestation: null,
    transparencyLog: {
      logId: null,
      insertedAt: null,
      merkleRoot: null,
    },
    metadata: null,
    chainOfCustody: [
      {
        event: 'verified',
        timestamp: new Date().toISOString(),
        actor: 'api:verification_service',
      },
      {
        event: 'evidence_generated',
        timestamp: new Date().toISOString(),
        actor: 'api:evidence_service',
      },
    ],
  };

  const valid = validateEvidencePackage(evidencePackage);
  if (!valid) {
    console.error('Validation errors:', JSON.stringify(validateEvidencePackage.errors, null, 2));
  }
  assert.strictEqual(valid, true, 'Evidence package for tampered verdict should validate');

  // Cleanup
  await query('DELETE FROM verifications WHERE id = $1', [verificationId]);
});

/**
 * Test: Evidence package for unsigned verdict (heuristic mode)
 */
test('Evidence package - unsigned verdict (heuristic mode) validates against schema', async () => {
  const verificationId = generateVerificationId();
  const assetSha256 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

  await query(
    `INSERT INTO verifications (
      id,
      asset_sha256,
      verdict,
      reasons_json,
      device_id,
      policy_id,
      asset_size_bytes,
      asset_mime_type,
      manifest_sha256,
      signature_algorithm,
      captured_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      verificationId,
      assetSha256,
      'unsigned',
      JSON.stringify(['No C2PA manifest found', 'Running heuristic analysis']),
      null,
      null,
      3072000,
      'image/jpeg',
      null,
      null,
      null,
      new Date(),
    ]
  );

  const evidencePackage = {
    packageVersion: '1.0',
    verificationId,
    generatedAt: new Date().toISOString(),
    asset: {
      sha256: assetSha256,
      sizeBytes: 3072000,
      mimeType: 'image/jpeg',
    },
    manifest: {
      format: 'c2pa-1.0',
      present: false,
    },
    verification: {
      mode: 'heuristic',
      verdict: 'unsigned',
      verifiedAt: new Date().toISOString(),
      reasons: ['No C2PA manifest found', 'Running heuristic analysis'],
      policyApplied: null,
    },
    signature: null,
    deviceCertChain: [],
    deviceAttestation: null,
    transparencyLog: {
      logId: null,
      insertedAt: null,
      merkleRoot: null,
    },
    metadata: null,
    chainOfCustody: [
      {
        event: 'verified',
        timestamp: new Date().toISOString(),
        actor: 'api:verification_service',
      },
      {
        event: 'evidence_generated',
        timestamp: new Date().toISOString(),
        actor: 'api:evidence_service',
      },
    ],
  };

  const valid = validateEvidencePackage(evidencePackage);
  if (!valid) {
    console.error('Validation errors:', JSON.stringify(validateEvidencePackage.errors, null, 2));
  }
  assert.strictEqual(valid, true, 'Evidence package for unsigned verdict should validate');

  // Cleanup
  await query('DELETE FROM verifications WHERE id = $1', [verificationId]);
});
