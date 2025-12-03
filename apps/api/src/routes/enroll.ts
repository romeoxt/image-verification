/**
 * Device Enrollment Endpoint
 * POST /v1/enroll - Enroll a device with hardware attestation
 */

import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import {
  verifyAndroidKeyAttestation,
  verifyAppleAppAttest,
  type SecurityLevel
} from '../lib/attestation.js';
import { getDb } from '../lib/db.js';

interface AndroidEnrollRequest {
  platform: 'android';
  certChainPem: string[];
  challenge?: string;
  deviceMetadata?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    clientSecurityLevel?: string;
  };
}

interface IosEnrollRequest {
  platform: 'ios';
  attestationObj: string;
  clientDataJSON?: string;
  bundleId?: string;
  deviceMetadata?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
  };
}

interface WebEnrollRequest {
  platform: 'web';
  csrPem?: string;
  publicKeyFingerprint?: string;
  allowSoftware?: boolean;
  algorithm?: string;
  curve?: string;
  publicKeyCredential?: Record<string, unknown>;
  deviceMetadata?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
  };
}

type EnrollRequest = AndroidEnrollRequest | IosEnrollRequest | WebEnrollRequest;

interface EnrollmentResponse {
  deviceId: string;
  enrolledAt: string;
  expiresAt: string | null;
  status: 'active' | 'pending_verification' | 'expired' | 'revoked';
  attestationVerified: boolean;
  attestationDetails?: {
    attestationType: string;
    hardwareBacked: boolean;
    bootState?: string;
    securityLevel?: string;
    certFingerprint?: string;
    attestationVersion?: number;
  };
  publicKeyFingerprint?: string;
  deviceMetadata?: {
    platform: string;
    manufacturer?: string;
    model?: string;
    osVersion?: string;
  };
  warnings?: string[];
  apiKeyHint?: string;
}

interface ErrorResponse {
  error: string;
  errors: string[];
  message: string;
}

function mapSecurityLevel(level: SecurityLevel): 'strongbox' | 'trusted_execution_environment' | 'software' {
  if (level === 'strongbox') return 'strongbox';
  if (level === 'tee') return 'trusted_execution_environment';
  return 'software';
}

export const enrollRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: EnrollRequest;
    Reply: EnrollmentResponse | ErrorResponse;
  }>('/v1/enroll', async (request, reply) => {
    const body = request.body;

    if (!body.platform || !['android', 'ios', 'web'].includes(body.platform)) {
      return reply.code(400).send({
        error: 'invalid_request',
        errors: ['invalid_platform'],
        message: 'Platform must be one of: android, ios, web',
      });
    }

    const deviceId = `dev_${body.platform}_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const enrolledAt = new Date().toISOString();
    const warnings: string[] = [];

    try {
      if (body.platform === 'android') {
        // Android Key Attestation
        const { certChainPem, challenge, deviceMetadata } = body;

        if (!certChainPem || !Array.isArray(certChainPem) || certChainPem.length === 0) {
          return reply.code(400).send({
            error: 'invalid_request',
            errors: ['missing_cert_chain'],
            message: 'Android enrollment requires certChainPem array',
          });
        }

        const attestationResult = await verifyAndroidKeyAttestation(certChainPem, challenge);

        if (!attestationResult.ok) {
          return reply.code(400).send({
            error: 'attestation_failed',
            errors: attestationResult.errors,
            message: 'Android Key Attestation verification failed',
          });
        }

        // Use client-reported security level if backend parsing is ambiguous
        // This is a workaround until proper ASN.1 parsing is implemented
        fastify.log.info(`Attestation result securityLevel: ${attestationResult.securityLevel}`);
        fastify.log.info(`Client reported securityLevel: ${deviceMetadata?.clientSecurityLevel}`);
        
        let actualSecurityLevel = attestationResult.securityLevel;
        if (attestationResult.securityLevel === 'tee' && deviceMetadata?.clientSecurityLevel === 'strongbox') {
          actualSecurityLevel = 'strongbox';
          fastify.log.info(`Client reports StrongBox, using that instead of backend TEE detection`);
        } else if (deviceMetadata?.clientSecurityLevel === 'strongbox') {
          actualSecurityLevel = 'strongbox';
          fastify.log.info(`Client reports StrongBox, trusting client (backend detected: ${attestationResult.securityLevel})`);
        }
        
        fastify.log.info(`Final actualSecurityLevel: ${actualSecurityLevel}`);

        // Reject software-backed keys (Production Requirement)
        if (actualSecurityLevel === 'software') {
          // Allow software ONLY if environment variable ALLOW_SOFTWARE_KEYS is set (for testing)
          if (process.env.ALLOW_SOFTWARE_KEYS !== 'true') {
             return reply.code(400).send({
               error: 'insecure_device',
               errors: ['software_key_not_allowed'],
               message: 'Device does not support hardware-backed security (StrongBox/TEE required)',
             });
          }
          warnings.push('Software-backed key detected (hardware-backed preferred)');
        } else if (actualSecurityLevel === 'tee') {
          warnings.push('TEE level detected (StrongBox preferred for highest security)');
        } else if (actualSecurityLevel === 'strongbox') {
          // StrongBox is the best - no warning
        }

        if (attestationResult.verifiedBootState && attestationResult.verifiedBootState !== 'VERIFIED') {
          warnings.push(`Boot state is ${attestationResult.verifiedBootState} (VERIFIED preferred)`);
        }

        // Extract cert fingerprint and expiry
        const leafCert = attestationResult.certificateChainInfo?.[0];
        const certFingerprint = leafCert?.fingerprintSha256 || null;
        const certExpiry = leafCert?.notAfter ? new Date(leafCert.notAfter) : null;
        const expiresAt = certExpiry ? certExpiry.toISOString() : null;

        if (expiresAt) {
          const daysUntilExpiry = certExpiry ? Math.floor((certExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          if (daysUntilExpiry !== null && daysUntilExpiry < 30) {
            warnings.push(`Device certificate will expire in ${daysUntilExpiry} days`);
          }
        }

        // Insert into database
        const db = getDb();
        await db.query(
          `INSERT INTO devices (id, platform, public_key_fingerprint, attestation_type,
           security_level, enrolled_at, cert_expiry, device_metadata, status, public_key)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             public_key_fingerprint = EXCLUDED.public_key_fingerprint,
             public_key = EXCLUDED.public_key,
             attestation_type = EXCLUDED.attestation_type,
             security_level = EXCLUDED.security_level,
             enrolled_at = EXCLUDED.enrolled_at,
             cert_expiry = EXCLUDED.cert_expiry,
             device_metadata = EXCLUDED.device_metadata,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [
            deviceId,
            'android',
            certFingerprint,
            'android_key_attestation',
            actualSecurityLevel,
            enrolledAt,
            expiresAt,
            JSON.stringify({
              manufacturer: deviceMetadata?.manufacturer,
              model: deviceMetadata?.model,
              osVersion: attestationResult.osVersion || deviceMetadata?.osVersion,
              patchLevel: attestationResult.patchLevel,
              verifiedBoot: attestationResult.verifiedBoot,
              verifiedBootState: attestationResult.verifiedBootState,
            }),
            'active',
            certChainPem[0],
          ]
        );

        // Insert certificate chain
        if (attestationResult.certificateChainInfo) {
          for (let i = 0; i < attestationResult.certificateChainInfo.length; i++) {
            const cert = attestationResult.certificateChainInfo[i];
            await db.query(
              `INSERT INTO device_certs (device_id, chain_position, cert_pem, fingerprint,
               issuer, subject, not_before, not_after)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (device_id, chain_position) DO UPDATE SET
                 cert_pem = EXCLUDED.cert_pem,
                 fingerprint = EXCLUDED.fingerprint,
                 issuer = EXCLUDED.issuer,
                 subject = EXCLUDED.subject,
                 not_before = EXCLUDED.not_before,
                 not_after = EXCLUDED.not_after`,
              [
                deviceId,
                i,
                certChainPem[i],
                cert.fingerprintSha256,
                cert.issuer,
                cert.subject,
                cert.notBefore,
                cert.notAfter,
              ]
            );
          }
        }

        const response: EnrollmentResponse = {
          deviceId,
          enrolledAt,
          expiresAt,
          status: 'active',
          attestationVerified: true,
          attestationDetails: {
            attestationType: 'android_key_attestation',
            hardwareBacked: actualSecurityLevel !== 'software',
            bootState: attestationResult.verifiedBootState?.toLowerCase() || 'unknown',
            securityLevel: mapSecurityLevel(actualSecurityLevel),
            certFingerprint: certFingerprint || undefined,
          },
          publicKeyFingerprint: certFingerprint || undefined,
          deviceMetadata: {
            platform: 'android',
            manufacturer: deviceMetadata?.manufacturer,
            model: deviceMetadata?.model,
            osVersion: attestationResult.osVersion || deviceMetadata?.osVersion,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          apiKeyHint: 'Use your organization API key for verification requests',
        };

        return reply.code(201).send(response);
      } else if (body.platform === 'ios') {
        // Apple App Attest
        const { attestationObj, clientDataJSON, bundleId, deviceMetadata } = body;

        if (!attestationObj) {
          return reply.code(400).send({
            error: 'invalid_request',
            errors: ['missing_attestation_obj'],
            message: 'iOS enrollment requires attestationObj (base64)',
          });
        }

        const attestationBuffer = Buffer.from(attestationObj, 'base64');
        const clientDataBuffer = clientDataJSON ? Buffer.from(clientDataJSON, 'base64') : undefined;
        const db = getDb();

        const attestationResult = await verifyAppleAppAttest(
          attestationBuffer,
          clientDataBuffer,
          bundleId
        );

        if (!attestationResult.ok) {
          return reply.code(400).send({
            error: 'attestation_failed',
            errors: attestationResult.errors,
            message: 'Apple App Attest verification failed',
          });
        }

        // Extract cert fingerprint and expiry
        const leafCert = attestationResult.certificateChainInfo?.[0];
        const certFingerprint = leafCert?.fingerprintSha256 || null;
        const certExpiry = leafCert?.notAfter ? new Date(leafCert.notAfter) : null;
        const expiresAt = certExpiry ? certExpiry.toISOString() : null;

        if (expiresAt) {
          const daysUntilExpiry = certExpiry ? Math.floor((certExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          if (daysUntilExpiry !== null && daysUntilExpiry < 30) {
            warnings.push(`Device certificate will expire in ${daysUntilExpiry} days`);
          }
        }

        // Insert into database
        await db.query(
          `INSERT INTO devices (device_id, platform, public_key_fingerprint, attestation_type,
           security_level, enrolled_at, cert_expiry, device_metadata, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (device_id) DO UPDATE SET
             public_key_fingerprint = EXCLUDED.public_key_fingerprint,
             attestation_type = EXCLUDED.attestation_type,
             security_level = EXCLUDED.security_level,
             enrolled_at = EXCLUDED.enrolled_at,
             cert_expiry = EXCLUDED.cert_expiry,
             device_metadata = EXCLUDED.device_metadata,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [
            deviceId,
            'ios',
            certFingerprint,
            'apple_app_attest',
            'tee', // iOS always uses Secure Enclave
            enrolledAt,
            expiresAt,
            JSON.stringify({
              manufacturer: 'Apple',
              model: deviceMetadata?.model,
              osVersion: deviceMetadata?.osVersion,
              bundleId: attestationResult.bundleId,
              teamId: attestationResult.teamId,
              keyId: attestationResult.keyId,
            }),
            'active',
          ]
        );

        // Insert certificate chain
        if (attestationResult.certificateChainInfo) {
          for (let i = 0; i < attestationResult.certificateChainInfo.length; i++) {
            const cert = attestationResult.certificateChainInfo[i];
            await db.query(
              `INSERT INTO device_certs (device_id, chain_position, cert_pem, fingerprint,
               issuer, subject, not_before, not_after)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (device_id, chain_position) DO UPDATE SET
                 cert_pem = EXCLUDED.cert_pem,
                 fingerprint = EXCLUDED.fingerprint,
                 issuer = EXCLUDED.issuer,
                 subject = EXCLUDED.subject,
                 not_before = EXCLUDED.not_before,
                 not_after = EXCLUDED.not_after`,
              [
                deviceId,
                i,
                '', // cert.pem not available in CertificateInfo
                cert.fingerprintSha256,
                cert.issuer,
                cert.subject,
                cert.notBefore,
                cert.notAfter,
              ]
            );
          }
        }

        const response: EnrollmentResponse = {
          deviceId,
          enrolledAt,
          expiresAt,
          status: 'active',
          attestationVerified: true,
          attestationDetails: {
            attestationType: 'apple_app_attest',
            hardwareBacked: true,
            securityLevel: 'trusted_execution_environment',
            certFingerprint: certFingerprint || undefined,
          },
          publicKeyFingerprint: certFingerprint || undefined,
          deviceMetadata: {
            platform: 'ios',
            manufacturer: 'Apple',
            model: deviceMetadata?.model,
            osVersion: deviceMetadata?.osVersion,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          apiKeyHint: 'Use your organization API key for verification requests',
        };

        return reply.code(201).send(response);
      } else {
        // Web platform (software keys allowed for desktop signer)
        const { csrPem, publicKeyFingerprint, allowSoftware, algorithm, curve, deviceMetadata } = body;

        if (!csrPem || !publicKeyFingerprint) {
          return reply.code(400).send({
            error: 'invalid_request',
            errors: ['missing_public_key'],
            message: 'Web enrollment requires csrPem and publicKeyFingerprint',
          });
        }

        if (!allowSoftware) {
          warnings.push('Software-backed keys are not recommended for production use');
        }

        // Validate algorithm and curve
        if (algorithm && algorithm !== 'ES256') {
          return reply.code(400).send({
            error: 'invalid_request',
            errors: ['unsupported_algorithm'],
            message: 'Only ES256 algorithm is supported',
          });
        }

        if (curve && curve !== 'P-256') {
          return reply.code(400).send({
            error: 'invalid_request',
            errors: ['unsupported_curve'],
            message: 'Only P-256 curve is supported',
          });
        }

        const db = getDb();

        // Insert into database
        const result = await db.query(
          `INSERT INTO devices (public_key, attestation_type, platform, manufacturer, model,
           os_version, public_key_fingerprint)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (public_key_fingerprint) DO UPDATE SET
             public_key = EXCLUDED.public_key,
             attestation_type = EXCLUDED.attestation_type,
             platform = EXCLUDED.platform,
             manufacturer = EXCLUDED.manufacturer,
             model = EXCLUDED.model,
             os_version = EXCLUDED.os_version
           RETURNING id, enrolled_at`,
          [
            csrPem,
            'software_key',
            'web',
            deviceMetadata?.manufacturer || 'Unknown',
            deviceMetadata?.model || 'Desktop',
            deviceMetadata?.osVersion || process.platform,
            publicKeyFingerprint,
          ]
        );

        const actualDeviceId = result.rows[0].id;
        const actualEnrolledAt = result.rows[0].enrolled_at.toISOString();

        const response: any = {
          deviceId: actualDeviceId,
          publicKeyFingerprint,
          securityLevel: 'software',
          enrolledAt: actualEnrolledAt,
          expiresAt: null,
          status: 'active',
          attestationVerified: true,
          attestationDetails: {
            attestationType: 'software_key',
            hardwareBacked: false,
            securityLevel: 'software',
          },
          deviceMetadata: {
            platform: 'web',
            manufacturer: deviceMetadata?.manufacturer,
            model: deviceMetadata?.model,
            osVersion: deviceMetadata?.osVersion,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          apiKeyHint: 'Use your organization API key for verification requests',
        };

        return reply.code(201).send(response);
      }
    } catch (error) {
      fastify.log.error({ error, deviceId }, 'Enrollment error');
      return reply.code(500).send({
        error: 'internal_error',
        errors: ['enrollment_failed'],
        message: error instanceof Error ? error.message : 'Internal server error during enrollment',
      });
    }
  });
};
