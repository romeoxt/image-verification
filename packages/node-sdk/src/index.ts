/**
 * PoPC Node.js SDK
 * 
 * Official Node.js SDK for PoPC (Proof of Physical Capture)
 * Verify photos and videos cryptographically in your Node.js app.
 * 
 * @example
 * ```typescript
 * import { PoPC } from '@popc/node';
 * 
 * const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });
 * 
 * const result = await popc.verify(imageBuffer, manifestBuffer);
 * console.log(result.verdict); // 'verified', 'tampered', or 'invalid'
 * ```
 */

import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';

export interface PopcConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface VerificationResult {
  verdict: 'verified' | 'tampered' | 'invalid' | 'unsigned';
  confidence: number;
  mode: string;
  deviceId: string | null;
  securityLevel: string | null;
  reasons: string[];
  verificationId: string;
  timestamp: string;
}

export interface DeviceInfo {
  id: string;
  platform: string;
  securityLevel: string;
  status: string;
  enrolledAt: string;
  metadata?: Record<string, any>;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  rateLimit: {
    perMinute: number;
    perDay: number;
  };
  usage: {
    total: number;
    today: number;
  };
  createdAt: string;
  lastUsedAt: string | null;
}

export class PopcError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PopcError';
  }
}

export class PoPC {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: PopcConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.popc.dev';

    if (!this.apiKey) {
      throw new PopcError('API key is required');
    }
    if (!this.apiKey.startsWith('pk_')) {
      throw new PopcError('Invalid API key format (must start with pk_)');
    }
  }

  /**
   * Verify a photo or video
   * 
   * @param image - Image file as Buffer, Blob, or File
   * @param manifest - C2PA manifest file as Buffer, Blob, or File
   * @returns Verification result
   * 
   * @example
   * ```typescript
   * const imageBuffer = fs.readFileSync('photo.jpg');
   * const manifestBuffer = fs.readFileSync('photo.jpg.c2pa');
   * 
   * const result = await popc.verify(imageBuffer, manifestBuffer);
   * 
   * if (result.verdict === 'verified') {
   *   console.log('Photo is authentic!');
   * }
   * ```
   */
  async verify(
    image: Buffer | Blob | File,
    manifest: Buffer | Blob | File
  ): Promise<VerificationResult> {
    const formData = new FormData();
    
    const imageBlob = image instanceof Buffer 
      ? new Blob([image]) 
      : image;
    const manifestBlob = manifest instanceof Buffer
      ? new Blob([manifest])
      : manifest;

    formData.append('image', imageBlob, 'image.jpg');
    formData.append('manifest', manifestBlob, 'manifest.c2pa');

    const response = await fetch(`${this.apiUrl}/v1/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PopcError(
        error.error || 'Verification failed',
        response.status,
        error
      );
    }

    return await response.json();
  }

  /**
   * Verify multiple photos/videos in batch
   * 
   * @param items - Array of {image, manifest} objects
   * @returns Array of verification results
   * 
   * @example
   * ```typescript
   * const results = await popc.verifyBatch([
   *   { image: buffer1, manifest: manifest1 },
   *   { image: buffer2, manifest: manifest2 },
   * ]);
   * 
   * const verifiedCount = results.filter(r => r.verdict === 'verified').length;
   * console.log(`${verifiedCount}/${results.length} photos verified`);
   * ```
   */
  async verifyBatch(
    items: Array<{ image: Buffer | Blob | File; manifest: Buffer | Blob | File }>
  ): Promise<VerificationResult[]> {
    // Process in parallel for speed
    return await Promise.all(
      items.map(item => this.verify(item.image, item.manifest))
    );
  }

  /**
   * Get verification evidence by ID
   * 
   * @param verificationId - Verification ID returned from verify()
   * @returns Evidence details
   * 
   * @example
   * ```typescript
   * const evidence = await popc.getEvidence('abc123');
   * console.log(evidence.deviceId, evidence.timestamp);
   * ```
   */
  async getEvidence(verificationId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/v1/evidence/${verificationId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PopcError(
        error.error || 'Failed to get evidence',
        response.status,
        error
      );
    }

    return await response.json();
  }

  /**
   * List enrolled devices
   * 
   * @returns Array of device information
   */
  async listDevices(): Promise<DeviceInfo[]> {
    const response = await fetch(`${this.apiUrl}/v1/devices`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PopcError(
        error.error || 'Failed to list devices',
        response.status,
        error
      );
    }

    const data = await response.json();
    return data.devices || [];
  }

  /**
   * Revoke a device (disable future verifications)
   * 
   * @param deviceId - Device ID to revoke
   */
  async revokeDevice(deviceId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/v1/devices/${deviceId}/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PopcError(
        error.error || 'Failed to revoke device',
        response.status,
        error
      );
    }
  }

  /**
   * Get API key information and usage stats
   */
  async getKeyInfo(): Promise<ApiKeyInfo> {
    const response = await fetch(`${this.apiUrl}/v1/keys/info`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PopcError(
        error.error || 'Failed to get key info',
        response.status,
        error
      );
    }

    return await response.json();
  }
}

export default PoPC;

