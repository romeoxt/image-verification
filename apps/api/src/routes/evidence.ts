/**
 * /v1/evidence/:verificationId endpoint - Download evidence package
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne, type Policy } from '../lib/db.js';

interface EvidenceParams {
  verificationId: string;
}

interface VerificationRow {
  id: string;
  asset_sha256: string;
  verdict: 'verified' | 'tampered' | 'unsigned' | 'invalid' | 'revoked';
  reasons_json: any; // JSONB from PostgreSQL (could be string or array)
  device_id: string | null;
  policy_id: string | null;
  asset_size_bytes: number;
  asset_mime_type: string | null;
  manifest_sha256: string | null;
  signature_algorithm: string | null;
  captured_at: Date | null;
  created_at: Date;
}

interface DeviceRow {
  id: string;
  public_key: string;
  attestation_type: string;
  enrolled_at: Date;
  revoked_at: Date | null;
  platform: string | null;
  manufacturer: string | null;
  model: string | null;
  os_version: string | null;
  public_key_fingerprint: string;
}

interface DeviceCertRow {
  id: string;
  device_id: string;
  cert_pem: string;
  issuer: string;
  subject: string | null;
  not_before: Date;
  not_after: Date;
  status: 'valid' | 'expired' | 'revoked' | 'invalid';
  fingerprint: string;
  is_leaf: boolean;
  chain_position: number | null;
}

interface TransparencyLogRow {
  id: number;
  asset_sha256: string;
  device_cert_fingerprint: string;
  merkle_leaf: string;
  merkle_root: string | null;
  tree_size: number | null;
  leaf_index: number | null;
  inserted_at: Date;
}

export async function evidenceRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/evidence/:verificationId
   */
  fastify.get<{
    Params: EvidenceParams;
  }>('/v1/evidence/:verificationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { verificationId } = request.params as EvidenceParams;

      // Validate verification ID format (UUID)
      if (!verificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return reply.code(400).send({
          error: 'invalid_verification_id',
          message: 'Verification ID must be a valid UUID',
        });
      }

      // Step 1: Load verification record
      const verification = await queryOne<VerificationRow>(
        `SELECT
          id,
          asset_sha256,
          verdict,
          reasons_json,
          device_id,
          policy_id,
          asset_size_bytes,
          asset_mime_type,
          manifest_sha256,
          signature_algorithm,
          captured_at,
          created_at
        FROM verifications
        WHERE id = $1`,
        [verificationId]
      );

      if (!verification) {
        return reply.code(404).send({
          error: 'verification_not_found',
          message: `No verification found with ID: ${verificationId}`,
        });
      }

      // Parse reasons JSON - handle both string and array from PostgreSQL
      const reasons = typeof verification.reasons_json === 'string'
        ? JSON.parse(verification.reasons_json)
        : verification.reasons_json;

      // Step 2: Load device (if present)
      let device: DeviceRow | null = null;
      if (verification.device_id) {
        device = await queryOne<DeviceRow>(
          `SELECT
            id,
            public_key,
            attestation_type,
            enrolled_at,
            revoked_at,
            platform,
            manufacturer,
            model,
            os_version,
            public_key_fingerprint
          FROM devices
          WHERE id = $1`,
          [verification.device_id]
        );
      }

      // Step 3: Load device certificate chain (if device exists)
      let deviceCerts: DeviceCertRow[] = [];
      if (device) {
        const certsResult = await query<DeviceCertRow>(
          `SELECT
            id,
            device_id,
            cert_pem,
            issuer,
            subject,
            not_before,
            not_after,
            status,
            fingerprint,
            is_leaf,
            chain_position
          FROM device_certs
          WHERE device_id = $1
          ORDER BY chain_position ASC NULLS LAST`,
          [device.id]
        );
        deviceCerts = certsResult.rows;
      }

      // Step 4: Load policy (if present)
      let policy: Policy | null = null;
      if (verification.policy_id) {
        policy = await queryOne<Policy>(
          'SELECT * FROM policies WHERE id = $1',
          [verification.policy_id]
        );
      }

      // Step 5: Load transparency log entry (if present)
      let transparencyLogEntry: TransparencyLogRow | null = null;
      if (device) {
        transparencyLogEntry = await queryOne<TransparencyLogRow>(
          `SELECT
            id,
            asset_sha256,
            device_cert_fingerprint,
            merkle_leaf,
            merkle_root,
            tree_size,
            leaf_index,
            inserted_at
          FROM transparency_log
          WHERE asset_sha256 = $1 AND device_cert_fingerprint = $2
          ORDER BY inserted_at DESC
          LIMIT 1`,
          [verification.asset_sha256, device.public_key_fingerprint]
        );
      }

      // Step 6: Build evidence package
      const manifestPresent = verification.manifest_sha256 !== null;

      // Determine mode: certified if manifest was present during verification
      const mode = manifestPresent ? 'certified' : 'heuristic';

      // Build evidence package response
      const evidencePackage = {
        packageVersion: '1.0',
        verificationId: verification.id,
        generatedAt: new Date().toISOString(),

        // Asset information
        asset: {
          sha256: verification.asset_sha256,
          sizeBytes: verification.asset_size_bytes,
          mimeType: verification.asset_mime_type || 'application/octet-stream',
        },

        // Manifest information
        manifest: {
          format: 'c2pa-1.0',
          present: manifestPresent,
          contentBinding: manifestPresent
            ? {
                algorithm: 'sha256',
                hash: verification.asset_sha256,
                matches: verification.verdict === 'verified',
              }
            : undefined,
        },

        // Verification results
        verification: {
          mode,
          verdict: verification.verdict,
          verifiedAt: verification.created_at.toISOString(),
          reasons,
          policyApplied: policy?.name || null,
        },

        // Signature information (only for verified verdicts)
        signature: verification.signature_algorithm
          ? {
              algorithm: verification.signature_algorithm,
              valid: verification.verdict === 'verified',
              signedAt: verification.captured_at?.toISOString() || null,
              publicKeyFingerprint: device?.public_key_fingerprint || null,
            }
          : null,

        // Device certificate chain
        deviceCertChain: deviceCerts.map((cert) => ({
          pem: cert.cert_pem,
          subject: cert.subject || cert.issuer,
          issuer: cert.issuer,
          notBefore: cert.not_before.toISOString(),
          notAfter: cert.not_after.toISOString(),
          fingerprint: cert.fingerprint,
          valid: cert.status === 'valid' && new Date() <= cert.not_after && new Date() >= cert.not_before,
        })),

        // Device attestation (if device exists)
        deviceAttestation: device
          ? {
              attestationType: device.attestation_type,
              hardwareBacked: true, // Stub for MVP
              verified: verification.verdict === 'verified',
              securityLevel: device.attestation_type === 'android_key_attestation' ? 'strongbox' : undefined,
            }
          : null,

        // Transparency log
        transparencyLog: transparencyLogEntry
          ? {
              logId: `tlog_${transparencyLogEntry.id}`,
              insertedAt: transparencyLogEntry.inserted_at.toISOString(),
              merkleRoot: transparencyLogEntry.merkle_root || '0'.repeat(64),
              treeSize: transparencyLogEntry.tree_size || null,
              leafIndex: transparencyLogEntry.leaf_index || null,
            }
          : {
              logId: null,
              insertedAt: null,
              merkleRoot: null,
            },

        // Metadata
        metadata: device
          ? {
              deviceId: `dev_${device.id}`,
              capturedAt: verification.captured_at?.toISOString() || null,
              deviceModel: device.model || undefined,
              osVersion: device.os_version || undefined,
            }
          : null,

        // Chain of custody
        chainOfCustody: [
          ...(verification.captured_at
            ? [
                {
                  event: 'captured',
                  timestamp: verification.captured_at.toISOString(),
                  actor: device ? `device:dev_${device.id}` : 'unknown',
                },
              ]
            : []),
          {
            event: 'verified',
            timestamp: verification.created_at.toISOString(),
            actor: 'api:verification_service',
          },
          {
            event: 'evidence_generated',
            timestamp: new Date().toISOString(),
            actor: 'api:evidence_service',
          },
        ],
      };

      return reply.code(200).send(evidencePackage);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'internal_error',
        message: 'An unexpected error occurred while generating evidence package',
      });
    }
  });
}
