/**
 * Test helpers for generating signed C2PA manifests
 */
import crypto from 'crypto';
import * as jose from 'jose';
import type { C2PAManifest, C2PASignature } from './index.js';

/**
 * Generate a test EC key pair for signing
 */
export async function generateTestKeyPair(algorithm: 'ES256' | 'ES384' | 'ES512' = 'ES256'): Promise<{
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
  publicKeyPEM: string;
  publicKeyBase64: string;
}> {
  const curveMap = {
    ES256: 'prime256v1',
    ES384: 'secp384r1',
    ES512: 'secp521r1',
  };

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: curveMap[algorithm],
  });

  const publicKeyPEM = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  const publicKeyDER = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const publicKeyBase64 = publicKeyDER.toString('base64');

  return {
    privateKey,
    publicKey,
    publicKeyPEM,
    publicKeyBase64,
  };
}

/**
 * Create a signed C2PA manifest using JWT format
 */
export async function createSignedManifest(
  assetHash: string,
  metadata?: Record<string, unknown>,
  algorithm: 'ES256' | 'ES384' | 'ES512' = 'ES256'
): Promise<{
  manifest: C2PAManifest;
  manifestJSON: string;
  publicKey: string;
  privateKey: crypto.KeyObject;
}> {
  const { privateKey, publicKeyPEM, publicKeyBase64 } = await generateTestKeyPair(algorithm);

  // Create JWT signature
  const payload = {
    'c2pa.hash.data': {
      algorithm: 'sha256',
      hash: assetHash,
    },
    ...metadata,
  };

  const jwtToken = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setIssuedAt()
    .setIssuer('popc-test')
    .setAudience('popc-api')
    .sign(privateKey);

  const manifest: C2PAManifest = {
    version: '1.0',
    claims: [
      {
        claimGenerator: 'PoPC Test',
        instanceId: crypto.randomUUID(),
        assertions: [
          {
            label: 'c2pa.hash.data',
            data: {
              algorithm: 'sha256',
              hash: assetHash,
            },
          },
        ],
      },
    ],
    signature: {
      algorithm,
      publicKey: publicKeyPEM,
      signature: jwtToken,
    },
    assertions: {
      'c2pa.hash.data': {
        algorithm: 'sha256',
        hash: assetHash,
      },
      ...metadata,
    },
  };

  return {
    manifest,
    manifestJSON: JSON.stringify(manifest),
    publicKey: publicKeyBase64,
    privateKey,
  };
}

/**
 * Create a malformed manifest
 */
export function createMalformedManifest(): string {
  return '{"invalid": "manifest", "missing": "required fields"}';
}

/**
 * Create a manifest with missing content binding
 */
export function createManifestWithoutBinding(): string {
  const manifest = {
    version: '1.0',
    claims: [],
    signature: {
      algorithm: 'ES256',
      publicKey: 'test-key',
      signature: 'test-sig',
    },
    assertions: {},
  };

  return JSON.stringify(manifest);
}
