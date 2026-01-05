import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { parseManifest, verifyManifest, computeHash } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DATA_DIR = join(__dirname, '../testdata');

// Helper to load test files
function loadTestFile(filename: string): Buffer {
  return readFileSync(join(TEST_DATA_DIR, filename));
}

/**
 * Test: Manifest Parsing
 */
test('parseManifest - should fail on empty input', () => {
  const result = parseManifest(Buffer.alloc(0));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors && result.errors.length > 0);
});

test('parseManifest - should fail on malformed JSON', () => {
  const malformed = Buffer.from('{ "version": "1.0", "broken": }');
  const result = parseManifest(malformed);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors && result.errors[0].includes('invalid_manifest_format'));
});

test('parseManifest - should fail when missing required fields', () => {
  const incomplete = Buffer.from(JSON.stringify({
    version: '1.0',
    // Missing signature and assertions
  }));
  const result = parseManifest(incomplete);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors && result.errors[0].includes('Missing required fields'));
});

test('parseManifest - should fail when content binding is missing', () => {
  const noBinding = Buffer.from(JSON.stringify({
    version: '1.0',
    claims: [],
    signature: { algorithm: 'ES256', publicKey: 'pk', signature: 'sig' },
    assertions: { 'some.data': 'test' }
  }));
  const result = parseManifest(noBinding);
  
  if (result.valid) {
    console.error('Unexpectedly valid:', result);
  }
  
  assert.strictEqual(result.valid, false, 'Manifest should be invalid without binding');
  assert.ok(result.errors && result.errors.length > 0, 'Should have errors');
  assert.ok(result.errors[0].includes('manifest_binding_missing'), 
    `Expected error manifest_binding_missing, got: ${result.errors[0]}`);
});

/**
 * Test: Content Binding
 */
test('verifyManifest - should verify valid asset and manifest match', async () => {
  // Create a synthetic valid manifest since we can't sign easily without private keys here
  const asset = Buffer.from('test-image-content');
  const assetHash = await computeHash(asset);
  
  const manifest = JSON.stringify({
    version: '1.0',
    signature: { 
      algorithm: 'ES256', 
      publicKey: 'dGVzdC1wdWJsaWMta2V5', // base64 "test-public-key"
      signature: 'dGVzdC1zaWduYXR1cmU=' // base64 "test-signature"
    },
    assertions: {
      'c2pa.hash.data': {
        algorithm: 'sha256',
        hash: assetHash
      }
    }
  });

  // Mock verifySignature to return true (we test crypto separately)
  // Since we can't easily mock internal functions in ES modules without a framework,
  // we'll rely on verifyManifest returning 'signature_invalid' but 'contentBindingMatch: true'
  
  const result = await verifyManifest(asset, manifest);
  
  assert.strictEqual(result.contentBindingMatch, true, 'Content binding should match');
  // Signature will fail because it's garbage data, but that's expected
  assert.strictEqual(result.signatureValid, false);
});

test('verifyManifest - should detect tampered asset (hash mismatch)', async () => {
  const asset = Buffer.from('original-image');
  const tamperedAsset = Buffer.from('tampered-image');
  const assetHash = await computeHash(asset);
  
  const manifest = JSON.stringify({
    version: '1.0',
    signature: { 
      algorithm: 'ES256', 
      publicKey: 'pk', 
      signature: 'sig' 
    },
    assertions: {
      'c2pa.hash.data': {
        algorithm: 'sha256',
        hash: assetHash
      }
    }
  });

  const result = await verifyManifest(tamperedAsset, manifest);
  
  assert.strictEqual(result.contentBindingMatch, false, 'Content binding should NOT match');
  assert.ok(result.errors.includes('content_binding_mismatch'));
});

/**
 * Test: Crypto Helpers
 */
test('computeHash - should produce correct SHA-256 hash', async () => {
  const input = Buffer.from('test');
  // sha256('test') = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  const expected = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
  const hash = await computeHash(input, 'sha256');
  assert.strictEqual(hash, expected);
});

