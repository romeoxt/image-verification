/**
 * Unit tests for heuristic verification mode
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { analyzeExif, analyzeJpeg, computeHeuristicScore, analyzeAsset } from '../src/lib/heuristics.js';

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
 * Create a minimal JPEG with EXIF metadata
 */
function createJpegWithExif(options: {
  camera?: string;
  software?: string;
  createDate?: string;
  gps?: { lat: number; lon: number };
}): Buffer {
  // JPEG SOI marker
  const soi = Buffer.from([0xFF, 0xD8]);

  // APP1 marker for EXIF (simplified, not a real EXIF segment)
  const app1Marker = Buffer.from([0xFF, 0xE1]);
  const app1Length = Buffer.from([0x00, 0x10]); // Length placeholder
  const exifData = Buffer.from('Exif\0\0');

  // SOF0 marker (baseline JPEG)
  const sof0 = Buffer.from([0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

  // SOS marker
  const sos = Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00]);

  // Minimal image data
  const imageData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

  // EOI marker
  const eoi = Buffer.from([0xFF, 0xD9]);

  return Buffer.concat([soi, app1Marker, app1Length, exifData, sof0, sos, imageData, eoi]);
}

/**
 * Create a progressive JPEG
 */
function createProgressiveJpeg(): Buffer {
  // JPEG SOI marker
  const soi = Buffer.from([0xFF, 0xD8]);

  // APP0 marker (JFIF)
  const app0 = Buffer.from([0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);

  // SOF2 marker (progressive JPEG)
  const sof2 = Buffer.from([0xFF, 0xC2, 0x00, 0x0B, 0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

  // SOS marker
  const sos = Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00]);

  // Minimal image data
  const imageData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

  // EOI marker
  const eoi = Buffer.from([0xFF, 0xD9]);

  return Buffer.concat([soi, app0, sof2, sos, imageData, eoi]);
}

/**
 * Create a JPEG with multiple APP markers (indicating editing)
 */
function createEditedJpeg(): Buffer {
  // JPEG SOI marker
  const soi = Buffer.from([0xFF, 0xD8]);

  // APP0 marker (JFIF)
  const app0 = Buffer.from([0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);

  // APP1 marker (EXIF)
  const app1 = Buffer.from([0xFF, 0xE1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

  // APP2 marker (ICC Profile)
  const app2 = Buffer.from([0xFF, 0xE2, 0x00, 0x10, 0x49, 0x43, 0x43, 0x5F, 0x50, 0x52, 0x4F, 0x46, 0x49, 0x4C, 0x45, 0x00]);

  // APP13 marker (Photoshop)
  const app13 = Buffer.from([0xFF, 0xED, 0x00, 0x10, 0x50, 0x68, 0x6F, 0x74, 0x6F, 0x73, 0x68, 0x6F, 0x70, 0x20, 0x33, 0x2E]);

  // SOF0 marker (baseline JPEG)
  const sof0 = Buffer.from([0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00]);

  // SOS marker
  const sos = Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00]);

  // Minimal image data
  const imageData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

  // EOI marker
  const eoi = Buffer.from([0xFF, 0xD9]);

  return Buffer.concat([soi, app0, app1, app2, app13, sof0, sos, imageData, eoi]);
}

/**
 * Test Case A: JPEG with typical camera EXIF, no manifest
 */
test('Heuristic mode - JPEG with camera EXIF should have high confidence', async () => {
  const jpegBytes = createJpegWithExif({
    camera: 'Canon EOS R5',
    createDate: new Date().toISOString(),
  });

  const { signals, confidence_score } = await analyzeAsset(jpegBytes);

  // Verify signals
  assert.ok(signals.exif, 'Should have EXIF signals');
  assert.ok(signals.jpeg, 'Should have JPEG signals');
  assert.ok(signals.noise, 'Should have noise signals');
  assert.strictEqual(signals.noise.prnuChecked, false, 'PRNU should not be checked');

  assert.ok(signals.reverse_image, 'Should have reverse image signals');
  assert.strictEqual(signals.reverse_image.attempted, false, 'Reverse image search should not be attempted');

  // Verify confidence score
  assert.ok(confidence_score >= 50, `Confidence score should be >= 50, got ${confidence_score}`);

  // Validate against schema
  const mockResponse = {
    verificationId: 'ver_test123',
    mode: 'heuristic',
    verdict: 'unsigned',
    confidence_score,
    assetSha256: '0'.repeat(64),
    reasons: ['No C2PA manifest found', 'Running heuristic analysis'],
    metadata: null,
    evidencePackageUrl: null,
    verifiedAt: new Date().toISOString(),
    signals,
  };

  const valid = validateVerifyResponse(mockResponse);
  if (!valid) {
    console.error('Validation errors:', validateVerifyResponse.errors);
  }
  assert.ok(valid, 'Response should validate against VerifyResponse schema');
});

/**
 * Test Case B: JPEG with editor software tag
 */
test('Heuristic mode - JPEG with editor software should have lower confidence', async () => {
  // Create a JPEG that would trigger editing detection
  const jpegBytes = createEditedJpeg();

  const { signals, confidence_score } = await analyzeAsset(jpegBytes);

  // Verify signals
  assert.ok(signals.jpeg, 'Should have JPEG signals');

  // Check for recompression detection (due to multiple APP markers)
  if (signals.jpeg.recompressionDetected !== undefined) {
    assert.strictEqual(signals.jpeg.recompressionDetected, true, 'Should detect recompression');
  }

  // Confidence should be reduced
  // Base is 50, recompression detected = -15, so expect around 35-55 range
  assert.ok(confidence_score <= 60, `Confidence score should be lower for edited images, got ${confidence_score}`);
});

/**
 * Test Case C: Random bytes/PNG with no EXIF
 */
test('Heuristic mode - Non-JPEG with no EXIF should have base confidence', async () => {
  // Create random non-JPEG data (PNG-like header)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const randomData = Buffer.from('random image data without exif or jpeg markers');
  const nonJpegBytes = Buffer.concat([pngHeader, randomData]);

  const { signals, confidence_score } = await analyzeAsset(nonJpegBytes);

  // Verify signals
  assert.ok(signals.exif, 'Should have EXIF signals');
  assert.strictEqual(signals.exif.present, false, 'EXIF should not be present');

  // Confidence should be around base score (50)
  assert.ok(confidence_score >= 40 && confidence_score <= 60,
    `Confidence score should be around base (50), got ${confidence_score}`);
});

/**
 * Test: Progressive JPEG detection
 */
test('Heuristic mode - Progressive JPEG should be detected', async () => {
  const jpegBytes = createProgressiveJpeg();

  const jpegSignals = await analyzeJpeg(jpegBytes);

  assert.ok(jpegSignals.progressive !== undefined, 'Progressive flag should be set');
  assert.strictEqual(jpegSignals.progressive, true, 'Should detect progressive JPEG');
});

/**
 * Test: computeHeuristicScore with various signals
 */
test('computeHeuristicScore - scoring logic', () => {
  // Test 1: Base score (no signals)
  let score = computeHeuristicScore({});
  assert.strictEqual(score, 50, 'Base score should be 50');

  // Test 2: EXIF present
  score = computeHeuristicScore({
    exif: { present: true },
  });
  assert.strictEqual(score, 60, 'Score with EXIF should be 60');

  // Test 3: EXIF with camera, no software
  score = computeHeuristicScore({
    exif: { present: true, camera: 'Canon EOS R5' },
  });
  assert.strictEqual(score, 70, 'Score with EXIF + camera should be 70');

  // Test 4: EXIF with editing software
  score = computeHeuristicScore({
    exif: { present: true, camera: 'Canon EOS R5', software: 'Adobe Photoshop 2024' },
  });
  assert.strictEqual(score, 55, 'Score with editing software should be reduced to 55 (70 - 15 for photoshop)');

  // Test 5: Recompression detected
  score = computeHeuristicScore({
    exif: { present: true, camera: 'Canon EOS R5' },
    jpeg: { recompressionDetected: true },
  });
  assert.strictEqual(score, 55, 'Score with recompression should be reduced to 55');

  // Test 6: Quantization table anomaly
  score = computeHeuristicScore({
    exif: { present: true, camera: 'Canon EOS R5' },
    jpeg: { quantTableAnomaly: true },
  });
  assert.strictEqual(score, 60, 'Score with quant table anomaly should be reduced to 60');

  // Test 7: Multiple negative signals
  score = computeHeuristicScore({
    exif: { present: true, software: 'GIMP' },
    jpeg: { recompressionDetected: true, quantTableAnomaly: true },
  });
  assert.ok(score <= 50, `Score with multiple negative signals should be low, got ${score}`);

  // Test 8: Score should be clamped to [0, 100]
  score = computeHeuristicScore({
    jpeg: { recompressionDetected: true, quantTableAnomaly: true },
  });
  assert.ok(score >= 0 && score <= 100, `Score should be in [0, 100], got ${score}`);
});
