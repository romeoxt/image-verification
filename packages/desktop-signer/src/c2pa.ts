/**
 * C2PA manifest generation - creates sidecar compatible with @popc/c2pa
 */
import { randomUUID } from 'crypto';

export interface ManifestOptions {
  assetHash: string;
  deviceId: string;
  publicKeyPem: string;
  signature: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Create C2PA manifest sidecar compatible with @popc/c2pa parser
 */
export function createManifest(options: ManifestOptions): any {
  const timestamp = options.timestamp || new Date().toISOString();
  const instanceId = randomUUID();

  return {
    version: '1.0',
    claims: [
      {
        claimGenerator: 'PoPC Desktop Signer',
        instanceId,
        assertions: [
          {
            label: 'c2pa.hash.data',
            data: {
              algorithm: 'sha256',
              hash: options.assetHash,
            },
          },
        ],
      },
    ],
    signature: {
      algorithm: 'ES256',
      publicKey: options.publicKeyPem,
      signature: options.signature,
    },
    assertions: {
      'c2pa.hash.data': {
        algorithm: 'sha256',
        hash: options.assetHash,
      },
      'popc.device.id': options.deviceId,
      'c2pa.timestamp': timestamp,
      ...(options.metadata || {}),
    },
  };
}

/**
 * Serialize manifest to JSON string
 */
export function serializeManifest(manifest: any): string {
  return JSON.stringify(manifest, null, 2);
}
