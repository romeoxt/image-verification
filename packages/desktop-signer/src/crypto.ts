/**
 * Cryptographic operations - key generation, signing, hashing
 */
import { createHash, generateKeyPairSync, sign, KeyObject } from 'crypto';
import { exportJWK, importPKCS8, importSPKI } from 'jose';

export interface KeyPair {
  privateKeyPem: string;
  publicKeyPem: string;
  publicKeyFingerprint: string;
}

/**
 * Generate EC P-256 keypair
 */
export function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Compute public key fingerprint (SHA-256 of public key)
  const publicKeyFingerprint = computeHash(publicKey);

  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    publicKeyFingerprint,
  };
}

/**
 * Compute SHA-256 hash of data
 */
export function computeHash(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-256 hash of file buffer
 */
export function computeFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sign a digest with private key (ES256)
 */
export function signDigest(digest: string, privateKeyPem: string): string {
  // Create signature
  const signature = sign('sha256', Buffer.from(digest, 'hex'), {
    key: privateKeyPem,
    format: 'pem',
  });

  return signature.toString('base64');
}

/**
 * Export public key to JWK format
 */
export async function publicKeyToJWK(publicKeyPem: string): Promise<any> {
  const publicKey = await importSPKI(publicKeyPem, 'ES256');
  return await exportJWK(publicKey);
}

/**
 * Import private key from PEM
 */
export async function importPrivateKeyPem(pem: string): Promise<KeyObject> {
  return await importPKCS8(pem, 'ES256') as any;
}

/**
 * Create CSR-like public key object for enrollment
 */
export function createPublicKeyRequest(publicKeyPem: string, fingerprint: string): any {
  return {
    publicKeyPem,
    fingerprint,
    algorithm: 'ES256',
    curve: 'P-256',
  };
}
