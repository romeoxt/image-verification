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
 * Sign data with private key (ES256)
 * @param data - The data to sign (will be hashed with SHA-256)
 * @param privateKeyPem - Private key in PEM format
 */
export function signData(data: string | Buffer, privateKeyPem: string): string {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  const signature = sign('sha256', dataBuffer, {
    key: privateKeyPem,
    format: 'pem',
  });
  return signature.toString('base64');
}

/**
 * Sign a digest with private key (ES256)
 * @deprecated Use signData instead
 */
export function signDigest(digest: string, privateKeyPem: string): string {
  // For backward compatibility - assumes digest is hex
  return signData(Buffer.from(digest, 'hex'), privateKeyPem);
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
