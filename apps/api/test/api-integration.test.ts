/**
 * Integration tests for enroll/verify/evidence security flows.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import * as jose from 'jose';
import * as c2pa from '@popc/c2pa';

process.env.NODE_ENV = 'test';
process.env.DISABLE_API_AUTH = 'false';

const { fastify, initializeApp } = await import('../src/index.js');
const { hashApiKey } = await import('../src/lib/auth.js');
const { query } = await import('../src/lib/db.js');

await initializeApp();
let dbReady = true;
try {
  await query('SELECT 1');
} catch {
  dbReady = false;
}

interface TestKeyMaterial {
  privateKey: crypto.KeyObject;
  publicKeyPem: string;
  fingerprint: string;
}

function createKeyMaterial(): TestKeyMaterial {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  return {
    privateKey,
    publicKeyPem,
    fingerprint: crypto.createHash('sha256').update(publicKeyDer).digest('hex'),
  };
}

async function createManifest(params: {
  assetHash: string;
  deviceId: string;
  privateKey: crypto.KeyObject;
  publicKeyPem: string;
  signedHash?: string;
}): Promise<string> {
  const signedHash = params.signedHash || params.assetHash;
  const signedPayload = {
    'c2pa.hash.data': {
      algorithm: 'sha256',
      hash: signedHash,
    },
    'popc.device.id': params.deviceId,
    'c2pa.timestamp': new Date().toISOString(),
  };

  const jwtToken = await new jose.SignJWT(signedPayload)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .sign(params.privateKey);

  return JSON.stringify({
    version: '1.0',
    claims: [
      {
        claimGenerator: 'PoPC Integration Test',
        instanceId: crypto.randomUUID(),
        assertions: [
          {
            label: 'c2pa.hash.data',
            data: { algorithm: 'sha256', hash: params.assetHash },
          },
        ],
      },
    ],
    signature: {
      algorithm: 'ES256',
      publicKey: params.publicKeyPem,
      signature: jwtToken,
    },
    assertions: {
      'c2pa.hash.data': {
        algorithm: 'sha256',
        hash: params.assetHash,
      },
      'popc.device.id': params.deviceId,
      'c2pa.timestamp': new Date().toISOString(),
    },
  });
}

async function createApiKey(scopes: string[]): Promise<string> {
  const rawKey = `pk_${crypto.randomBytes(16).toString('hex')}`;
  await query(
    `INSERT INTO api_keys (key_hash, key_prefix, name, scopes, is_active)
     VALUES ($1, $2, $3, $4, true)`,
    [hashApiKey(rawKey), rawKey.substring(0, 11), `test-${Date.now()}`, scopes]
  );
  return rawKey;
}

async function cleanupApiKey(rawKey: string): Promise<void> {
  await query('DELETE FROM api_keys WHERE key_hash = $1', [hashApiKey(rawKey)]);
}

test('happy flow: enroll web + verify + evidence with scoped auth', async (t) => {
  if (!dbReady) {
    t.skip('Database not available in test environment');
    return;
  }

  const keyMaterial = createKeyMaterial();
  const apiKey = await createApiKey(['verify:write', 'verify:read', 'evidence:read', 'asset:read', 'device:write']);

  try {
    const enrollRes = await fastify.inject({
      method: 'POST',
      url: '/v1/enroll',
      headers: { authorization: `Bearer ${apiKey}` },
      payload: {
        platform: 'web',
        csrPem: keyMaterial.publicKeyPem,
        publicKeyFingerprint: keyMaterial.fingerprint,
        allowSoftware: true,
        algorithm: 'ES256',
        curve: 'P-256',
      },
    });

    assert.strictEqual(enrollRes.statusCode, 201);
    const enrolled = enrollRes.json();
    const deviceId = enrolled.deviceId as string;

    const asset = Buffer.from('integration-test-asset');
    const assetHash = await c2pa.computeHash(asset, 'sha256');
    const manifestJson = await createManifest({
      assetHash,
      deviceId,
      privateKey: keyMaterial.privateKey,
      publicKeyPem: keyMaterial.publicKeyPem,
    });

    const verifyRes = await fastify.inject({
      method: 'POST',
      url: '/v1/verify',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      payload: {
        assetBase64: asset.toString('base64'),
        manifestBase64: Buffer.from(manifestJson).toString('base64'),
      },
    });

    assert.strictEqual(verifyRes.statusCode, 200);
    const verified = verifyRes.json();
    assert.strictEqual(verified.verdict, 'verified');
    assert.strictEqual(verified.mode, 'certified');

    const evidenceRes = await fastify.inject({
      method: 'GET',
      url: `/v1/evidence/${verified.verificationId}`,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    assert.strictEqual(evidenceRes.statusCode, 200);
    assert.strictEqual(evidenceRes.json().verification.verdict, 'verified');
  } finally {
    await cleanupApiKey(apiKey);
  }
});

test('adversarial flow: signed payload hash mismatch is rejected', async (t) => {
  if (!dbReady) {
    t.skip('Database not available in test environment');
    return;
  }

  const keyMaterial = createKeyMaterial();
  const apiKey = await createApiKey(['verify:write', 'device:write']);

  try {
    const enrollRes = await fastify.inject({
      method: 'POST',
      url: '/v1/enroll',
      headers: { authorization: `Bearer ${apiKey}` },
      payload: {
        platform: 'web',
        csrPem: keyMaterial.publicKeyPem,
        publicKeyFingerprint: keyMaterial.fingerprint,
        allowSoftware: true,
        algorithm: 'ES256',
        curve: 'P-256',
      },
    });
    assert.strictEqual(enrollRes.statusCode, 201);
    const deviceId = enrollRes.json().deviceId as string;

    const asset = Buffer.from('asset-payload-binding-test');
    const correctHash = await c2pa.computeHash(asset, 'sha256');
    const manifestJson = await createManifest({
      assetHash: correctHash,
      signedHash: 'f'.repeat(64),
      deviceId,
      privateKey: keyMaterial.privateKey,
      publicKeyPem: keyMaterial.publicKeyPem,
    });

    const verifyRes = await fastify.inject({
      method: 'POST',
      url: '/v1/verify',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      payload: {
        assetBase64: asset.toString('base64'),
        manifestBase64: Buffer.from(manifestJson).toString('base64'),
      },
    });

    assert.strictEqual(verifyRes.statusCode, 200);
    assert.strictEqual(verifyRes.json().verdict, 'invalid');
  } finally {
    await cleanupApiKey(apiKey);
  }
});

test('adversarial flow: manifest key must match enrolled device key', async (t) => {
  if (!dbReady) {
    t.skip('Database not available in test environment');
    return;
  }

  const enrolledKey = createKeyMaterial();
  const attackerKey = createKeyMaterial();
  const apiKey = await createApiKey(['verify:write', 'device:write']);

  try {
    const enrollRes = await fastify.inject({
      method: 'POST',
      url: '/v1/enroll',
      headers: { authorization: `Bearer ${apiKey}` },
      payload: {
        platform: 'web',
        csrPem: enrolledKey.publicKeyPem,
        publicKeyFingerprint: enrolledKey.fingerprint,
        allowSoftware: true,
        algorithm: 'ES256',
        curve: 'P-256',
      },
    });
    assert.strictEqual(enrollRes.statusCode, 201);
    const deviceId = enrollRes.json().deviceId as string;

    const asset = Buffer.from('device-binding-test');
    const assetHash = await c2pa.computeHash(asset, 'sha256');
    const manifestJson = await createManifest({
      assetHash,
      deviceId,
      privateKey: attackerKey.privateKey,
      publicKeyPem: attackerKey.publicKeyPem,
    });

    const verifyRes = await fastify.inject({
      method: 'POST',
      url: '/v1/verify',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      payload: {
        assetBase64: asset.toString('base64'),
        manifestBase64: Buffer.from(manifestJson).toString('base64'),
      },
    });

    assert.strictEqual(verifyRes.statusCode, 200);
    assert.strictEqual(verifyRes.json().verdict, 'invalid');
  } finally {
    await cleanupApiKey(apiKey);
  }
});

test('adversarial flow: evidence requires API auth and scope', async () => {
  const res = await fastify.inject({
    method: 'GET',
    url: '/v1/evidence/00000000-0000-0000-0000-000000000000',
  });
  assert.strictEqual(res.statusCode, 401);
});

