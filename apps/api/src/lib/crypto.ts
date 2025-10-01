/**
 * Cryptographic utilities
 */
import crypto from 'crypto';

/**
 * Compute SHA-256 hash of buffer
 */
export function sha256(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-512 hash of buffer
 */
export function sha512(data: Buffer): string {
  return crypto.createHash('sha512').update(data).digest('hex');
}

/**
 * Compute hash with specified algorithm
 */
export function computeHash(data: Buffer, algorithm: 'sha256' | 'sha512'): string {
  return algorithm === 'sha512' ? sha512(data) : sha256(data);
}

/**
 * Verify ECDSA signature using Node crypto
 * Note: This is now handled by the C2PA package for manifest verification
 * This utility is kept for other potential signature verification needs
 */
export function verifySignature(
  data: Buffer,
  signature: string,
  publicKey: string,
  algorithm: 'ES256' | 'ES384' | 'ES512' | 'EdDSA' = 'ES256'
): boolean {
  try {
    // Map JOSE algorithm to Node crypto algorithm
    const algoMap: Record<string, string> = {
      ES256: 'SHA256',
      ES384: 'SHA384',
      ES512: 'SHA512',
      EdDSA: 'SHA512',
    };

    const hashAlg = algoMap[algorithm] || 'SHA256';

    // Import public key
    const publicKeyObj = crypto.createPublicKey({
      key: Buffer.from(publicKey, 'base64'),
      format: 'der',
      type: 'spki',
    });

    // Verify signature
    const signatureBytes = Buffer.from(signature, 'base64');
    const verify = crypto.createVerify(hashAlg);
    verify.update(data);
    verify.end();

    return verify.verify(publicKeyObj, signatureBytes);
  } catch {
    return false;
  }
}

/**
 * Generate verification ID
 */
export function generateVerificationId(): string {
  return `ver_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Generate device ID from public key fingerprint
 */
export function generateDeviceId(
  platform: string,
  manufacturer: string,
  fingerprint: string
): string {
  const shortFingerprint = fingerprint.substring(0, 12);
  const platformSlug = platform.toLowerCase();
  const manufacturerSlug = manufacturer.toLowerCase().replace(/\s+/g, '');

  return `dev_${platformSlug}_${manufacturerSlug}_${shortFingerprint}`;
}
