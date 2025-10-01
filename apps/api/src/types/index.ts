/**
 * Type definitions for API
 */

export interface VerifyRequestJson {
  assetUrl?: string;
  manifestUrl?: string;
  assetBase64?: string;
  manifestBase64?: string;
  policyId?: string;
}

export interface HeuristicSignals {
  exif?: {
    present: boolean;
    camera?: string;
    software?: string;
    createDate?: string;
    gps?: {
      lat?: number;
      lon?: number;
    };
  };
  jpeg?: {
    recompressionDetected?: boolean;
    quantTableAnomaly?: boolean;
    progressive?: boolean;
  };
  noise?: {
    prnuChecked: boolean;
    matched?: boolean;
    score?: number;
  };
  ml?: {
    model?: string;
    score?: number;
  };
  reverse_image?: {
    attempted: boolean;
    earliestFound?: string;
    source?: string;
  };
  upload_channel?: {
    signedForm?: boolean;
  };
}

export interface VerifyResponse {
  verificationId: string;
  mode: 'certified' | 'heuristic';
  verdict: 'verified' | 'tampered' | 'unsigned' | 'invalid' | 'revoked';
  confidence_score?: number;
  assetSha256: string;
  reasons: string[];
  metadata: {
    deviceId?: string;
    capturedAt?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    } | null;
    deviceModel?: string;
    osVersion?: string;
    manifestVersion?: string;
    signatureAlgorithm?: string;
    attestationType?: string;
  } | null;
  evidencePackageUrl: string | null;
  policyViolations?: Array<{
    policyRule: string;
    message: string;
  }>;
  transparencyLogEntry?: {
    logId: string;
    merkleRoot: string;
    inclusionProof?: string[];
  } | null;
  verifiedAt?: string;
  signals?: HeuristicSignals;
}

export interface EnrollmentRequest {
  platform: 'android' | 'ios' | 'web';
  publicKey: string;
  attestationCertChain: string[];
  attestationType: string;
  deviceMetadata?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    sdkVersion?: string;
    appId?: string;
  };
  nonce?: string;
  challenge?: string;
}

export interface EnrollmentResponse {
  deviceId: string;
  enrolledAt: string;
  expiresAt: string | null;
  status: 'active' | 'pending_verification' | 'expired' | 'revoked';
  attestationVerified: boolean;
}

export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  logLevel: string;
  logPretty: boolean;
  maxAssetSize: number;
  maxClockSkew: number;
  defaultPolicy: string;
  corsOrigin: string;
}
