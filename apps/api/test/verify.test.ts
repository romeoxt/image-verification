/**
 * Unit tests for /v1/verify endpoint with real C2PA verification
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as c2pa from '@popc/c2pa';
import { createSignedManifest, createMalformedManifest, createManifestWithoutBinding } from '@popc/c2pa/dist/test-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load JSON schemas for validation
const verifyResponseSchema = JSON.parse(
  readFileSync(join(__dirname, '../../../docs/schemas/VerifyResponse.json'), 'utf-8')
);

// Setup Ajv validator
const ajv = new Ajv({ strict: false });
addFormats(ajv);
const validateVerifyResponse = ajv.compile(verifyResponseSchema);

/**
 * Test: Valid image verification with real signature
 */
test('verifyManifest - valid image with matching hash and real signature', async () => {
  // Create test asset
  const assetBytes = Buffer.from('test image data from trusted device');
  const assetHash = await c2pa.computeHash(assetBytes, 'sha256');

  // Create signed manifest
  const { manifestJSON } = await createSignedManifest(assetHash, {
    'popc.device.id': 'dev_test_device_123',
    'c2pa.timestamp': new Date().toISOString(),
  });

  const manifestBytes = Buffer.from(manifestJSON);

  // Verify
  const result = await c2pa.verifyManifest(assetBytes, manifestBytes);

  assert.strictEqual(result.valid, true, 'Verification should succeed');
  assert.strictEqual(result.contentBindingMatch, true, 'Content binding should match');
  assert.strictEqual(result.signatureValid, true, 'Signature should be valid');
  assert.strictEqual(result.errors.length, 0, 'Should have no errors');
});

/**
 * Test: Tampered image verification
 */
test('verifyManifest - tampered image with hash mismatch', async () => {
  // Create test asset
  const originalAssetBytes = Buffer.from('original image data');
  const originalHash = await c2pa.computeHash(originalAssetBytes, 'sha256');

  // Create signed manifest with original hash
  const { manifestJSON } = await createSignedManifest(originalHash);

  const manifestBytes = Buffer.from(manifestJSON);

  // Verify with tampered asset (different content)
  const tamperedAssetBytes = Buffer.from('tampered image data - pixels modified');
  const result = await c2pa.verifyManifest(tamperedAssetBytes, manifestBytes);

  assert.strictEqual(result.valid, false, 'Verification should fail');
  assert.strictEqual(result.contentBindingMatch, false, 'Content binding should not match');
  assert.strictEqual(result.errors.length, 1, 'Should have one error');
  assert.strictEqual(result.errors[0], 'content_binding_mismatch', 'Error should be content_binding_mismatch');
});

/**
 * Test: Malformed manifest
 */
test('parseManifest - malformed manifest returns invalid_manifest_format error', async () => {
  const invalidManifest = createMalformedManifest();

  const result = c2pa.parseManifest(invalidManifest);

  assert.strictEqual(result.valid, false, 'Manifest should be invalid');
  assert.ok(result.errors, 'Should have errors');
  assert.ok(
    result.errors.some(e => e.includes('invalid_manifest_format')),
    'Should have invalid_manifest_format error'
  );
});

/**
 * Test: Manifest without content binding
 */
test('parseManifest - manifest without content binding returns manifest_binding_missing error', async () => {
  const manifestWithoutBinding = createManifestWithoutBinding();

  const result = c2pa.parseManifest(manifestWithoutBinding);

  assert.strictEqual(result.valid, false, 'Manifest should be invalid');
  assert.ok(result.errors, 'Should have errors');
  assert.ok(
    result.errors.some(e => e.includes('manifest_binding_missing')),
    'Should have manifest_binding_missing error'
  );
});

/**
 * Test: Parse valid manifest and extract metadata
 */
test('parseManifest - valid manifest extracts signerChain and metadata', async () => {
  const assetHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const deviceId = 'dev_android_pixel7_abc123';
  const capturedAt = new Date('2024-01-15T10:30:00Z');

  const { manifestJSON } = await createSignedManifest(assetHash, {
    'popc.device.id': deviceId,
    'c2pa.timestamp': capturedAt.toISOString(),
    deviceModel: 'Pixel 7',
    osVersion: 'Android 14',
  });

  const manifestBytes = Buffer.from(manifestJSON);
  const result = c2pa.parseManifest(manifestBytes);

  assert.strictEqual(result.valid, true, 'Manifest should be valid');
  assert.strictEqual(result.contentBinding.hash, assetHash, 'Hash should match');
  assert.strictEqual(result.signature.algorithm, 'ES256', 'Algorithm should be ES256');
  assert.strictEqual(result.deviceId, deviceId, 'Device ID should match');
  assert.strictEqual(result.capturedAt, capturedAt.toISOString(), 'Captured time should match');
  assert.strictEqual(result.metadata?.deviceModel, 'Pixel 7', 'Device model should match');
  assert.strictEqual(result.metadata?.osVersion, 'Android 14', 'OS version should match');

  // Check signer chain
  assert.ok(Array.isArray(result.signerChain), 'Signer chain should be an array');
  assert.ok(result.signerChain.length > 0, 'Signer chain should have at least one entry');
  assert.strictEqual(result.signerChain[0].alg, 'ES256', 'First signer should use ES256');
  assert.ok(result.signerChain[0].fingerprint, 'Should have fingerprint');
});

/**
 * Test: SHA-256 hash computation
 */
test('computeHash - sha256 produces correct hash', async () => {
  const data = Buffer.from('hello world');
  const hash = await c2pa.computeHash(data, 'sha256');

  // Expected SHA-256 of "hello world"
  const expected = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

  assert.strictEqual(hash, expected, 'SHA-256 hash should match expected value');
});

/**
 * Test: SHA-512 hash computation
 */
test('computeHash - sha512 produces correct hash', async () => {
  const data = Buffer.from('hello world');
  const hash = await c2pa.computeHash(data, 'sha512');

  // Expected SHA-512 of "hello world"
  const expected =
    '309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f';

  assert.strictEqual(hash, expected, 'SHA-512 hash should match expected value');
});

/**
 * Test: Base64 manifest parsing
 */
test('parseManifest - base64 encoded manifest parses correctly', async () => {
  const assetHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

  const { manifestJSON } = await createSignedManifest(assetHash);

  // Encode as base64
  const manifestBase64 = Buffer.from(manifestJSON).toString('base64');

  // Parse from base64
  const result = c2pa.parseManifest(manifestBase64);

  assert.strictEqual(result.valid, true, 'Manifest should be valid');
  assert.strictEqual(result.contentBinding.hash, assetHash, 'Hash should match');
});

/**
 * Integration test: Full verification flow with real signatures
 */
test('integration - full verification flow with real cryptographic signatures', async () => {
  // 1. Create asset
  const assetBytes = Buffer.from('test photo data from device camera sensor');
  const assetHash = await c2pa.computeHash(assetBytes, 'sha256');

  // 2. Create signed manifest (simulating device capture)
  const { manifestJSON } = await createSignedManifest(
    assetHash,
    {
      'popc.device.id': 'dev_android_pixel7_abc123',
      'c2pa.timestamp': '2024-01-15T10:30:00Z',
      deviceModel: 'Pixel 7',
      osVersion: 'Android 14',
      attestationType: 'android_key_attestation',
    },
    'ES256'
  );

  const manifestBytes = Buffer.from(manifestJSON);

  // 3. Verify
  const verifyResult = await c2pa.verifyManifest(assetBytes, manifestBytes);

  assert.strictEqual(verifyResult.valid, true, 'Verification should succeed');
  assert.strictEqual(verifyResult.contentBindingMatch, true, 'Content binding should match');
  assert.strictEqual(verifyResult.signatureValid, true, 'Signature should be valid');
  assert.strictEqual(verifyResult.errors.length, 0, 'Should have no errors');

  // 4. Parse metadata
  const parsed = c2pa.parseManifest(manifestBytes);

  assert.strictEqual(parsed.deviceId, 'dev_android_pixel7_abc123', 'Device ID should match');
  assert.strictEqual(parsed.metadata?.deviceModel, 'Pixel 7', 'Device model should match');
  assert.strictEqual(parsed.metadata?.attestationType, 'android_key_attestation', 'Attestation type should match');
});

/**
 * Test: VerifyResponse schema validation
 */
test('VerifyResponse - schema validation for verified verdict', async () => {
  const response = {
    verificationId: 'ver_1a2b3c4d5e6f',
    mode: 'certified',
    verdict: 'verified',
    confidence_score: 100,
    assetSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    reasons: [
      'Content binding hash matches',
      'Signature valid',
      'Device certificate chain valid',
      'Hardware attestation present',
    ],
    metadata: {
      deviceId: 'dev_android_pixel7_abc123',
      capturedAt: '2024-01-15T10:30:00Z',
      deviceModel: 'Pixel 7',
      osVersion: 'Android 14',
      manifestVersion: '1.0',
      signatureAlgorithm: 'ES256',
      attestationType: 'android_key_attestation',
    },
    evidencePackageUrl: 'http://localhost:3000/v1/evidence/ver_1a2b3c4d5e6f',
    verifiedAt: '2024-01-15T10:35:22Z',
  };

  const valid = validateVerifyResponse(response);

  assert.strictEqual(valid, true, `Response should validate against schema. Errors: ${JSON.stringify(validateVerifyResponse.errors)}`);
});

/**
 * Test: VerifyResponse schema validation for tampered verdict
 */
test('VerifyResponse - schema validation for tampered verdict', async () => {
  const response = {
    verificationId: 'ver_9z8y7x6w5v4u',
    mode: 'certified',
    verdict: 'tampered',
    assetSha256: 'd4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    reasons: ['content_binding_mismatch'],
    metadata: null,
    evidencePackageUrl: null,
    verifiedAt: '2024-01-15T11:22:45Z',
  };

  const valid = validateVerifyResponse(response);

  assert.strictEqual(valid, true, `Response should validate against schema. Errors: ${JSON.stringify(validateVerifyResponse.errors)}`);
});

/**
 * Test: VerifyResponse schema validation for unsigned verdict
 */
test('VerifyResponse - schema validation for unsigned verdict', async () => {
  const response = {
    verificationId: 'ver_5t4r3e2w1q0p',
    mode: 'certified',
    verdict: 'unsigned',
    assetSha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    reasons: ['manifest_binding_missing'],
    metadata: null,
    evidencePackageUrl: null,
    verifiedAt: '2024-01-15T12:10:33Z',
  };

  const valid = validateVerifyResponse(response);

  assert.strictEqual(valid, true, `Response should validate against schema. Errors: ${JSON.stringify(validateVerifyResponse.errors)}`);
});

/**
 * Test: VerifyResponse schema validation for invalid verdict
 */
test('VerifyResponse - schema validation for invalid verdict', async () => {
  const response = {
    verificationId: 'ver_3x2c1v0b9n8m',
    mode: 'certified',
    verdict: 'invalid',
    assetSha256: 'f1e2d3c4b5a697868950a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2',
    reasons: ['signature_invalid'],
    metadata: null,
    evidencePackageUrl: null,
    verifiedAt: '2024-01-15T13:05:18Z',
  };

  const valid = validateVerifyResponse(response);

  assert.strictEqual(valid, true, `Response should validate against schema. Errors: ${JSON.stringify(validateVerifyResponse.errors)}`);
});
