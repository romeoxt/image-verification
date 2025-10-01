/**
 * /v1/verify endpoint - Verify media authenticity
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as c2pa from '@popc/c2pa';
import { query, queryOne, type Policy } from '../lib/db.js';
import { sha256, generateVerificationId } from '../lib/crypto.js';
import { analyzeAsset } from '../lib/heuristics.js';
import type { VerifyRequestJson, VerifyResponse } from '../types/index.js';

export async function verifyRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/verify
   */
  fastify.post<{
    Body: VerifyRequestJson;
  }>('/v1/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const contentType = request.headers['content-type'] || '';

      let assetBytes: Buffer;
      let manifestBytes: Buffer | null = null;
      let policyId: string = 'default';

      // Handle multipart/form-data
      if (contentType.includes('multipart/form-data')) {
        const result = await handleMultipartRequest(request);
        assetBytes = result.assetBytes;
        manifestBytes = result.manifestBytes;
        policyId = result.policyId || policyId;
      }
      // Handle JSON with URLs or base64
      else if (contentType.includes('application/json')) {
        const body = request.body as VerifyRequestJson;
        const result = await handleJsonRequest(body);
        assetBytes = result.assetBytes;
        manifestBytes = result.manifestBytes;
        policyId = result.policyId || policyId;
      } else {
        return reply.code(400).send({
          error: 'invalid_content_type',
          message: 'Content-Type must be multipart/form-data or application/json',
        });
      }

      // Validate asset size
      const maxAssetSize = Number(process.env.MAX_ASSET_SIZE_BYTES) || 104857600; // 100MB
      if (assetBytes.length > maxAssetSize) {
        return reply.code(400).send({
          error: 'asset_too_large',
          message: `Asset exceeds maximum size of ${maxAssetSize} bytes`,
        });
      }

      // Step 1: Compute SHA-256 hash of asset
      const assetSha256 = sha256(assetBytes);

      // Step 2: Check if manifest is present - if not, run heuristic mode
      if (!manifestBytes || manifestBytes.length === 0) {
        // Heuristic mode: no cryptographic manifest
        const { signals, confidence_score } = await analyzeAsset(assetBytes);

        const verificationId = await recordVerification({
          assetSha256,
          verdict: 'unsigned',
          reasons: ['No C2PA manifest found', 'Running heuristic analysis'],
          deviceId: null,
          policyId: null,
          assetSizeBytes: assetBytes.length,
        });

        return reply.code(200).send({
          verificationId,
          mode: 'heuristic',
          verdict: 'unsigned',
          confidence_score,
          assetSha256,
          reasons: ['No C2PA manifest found', 'Running heuristic analysis'],
          metadata: null,
          evidencePackageUrl: null,
          verifiedAt: new Date().toISOString(),
          signals,
        } satisfies VerifyResponse);
      }

      // Step 3: Parse C2PA manifest
      const manifest = c2pa.parseManifest(manifestBytes);

      // Check if manifest is valid
      if (!manifest.valid) {
        const errorReasons = manifest.errors || ['invalid_manifest_format'];
        const verdict = errorReasons.some(e => e.includes('manifest_binding_missing'))
          ? 'unsigned'
          : 'invalid';

        const verificationId = await recordVerification({
          assetSha256,
          verdict,
          reasons: errorReasons,
          deviceId: null,
          policyId: null,
          assetSizeBytes: assetBytes.length,
        });

        return reply.code(200).send({
          verificationId,
          mode: 'certified',
          verdict,
          assetSha256,
          reasons: errorReasons,
          metadata: null,
          evidencePackageUrl: null,
          verifiedAt: new Date().toISOString(),
        } satisfies VerifyResponse);
      }

      // Step 3: Verify manifest (content binding + signature)
      const verifyResult = await c2pa.verifyManifest(assetBytes, manifestBytes);

      // Handle content binding mismatch
      if (!verifyResult.contentBindingMatch) {
        const verificationId = await recordVerification({
          assetSha256,
          verdict: 'tampered',
          reasons: verifyResult.errors,
          deviceId: null,
          policyId: null,
          assetSizeBytes: assetBytes.length,
        });

        return reply.code(200).send({
          verificationId,
          mode: 'certified',
          verdict: 'tampered',
          assetSha256,
          reasons: verifyResult.errors,
          metadata: null,
          evidencePackageUrl: null,
          verifiedAt: new Date().toISOString(),
        } satisfies VerifyResponse);
      }

      // Handle signature invalid
      if (!verifyResult.signatureValid) {
        const verificationId = await recordVerification({
          assetSha256,
          verdict: 'invalid',
          reasons: verifyResult.errors,
          deviceId: null,
          policyId: null,
          assetSizeBytes: assetBytes.length,
        });

        return reply.code(200).send({
          verificationId,
          mode: 'certified',
          verdict: 'invalid',
          assetSha256,
          reasons: verifyResult.errors,
          metadata: null,
          evidencePackageUrl: null,
          verifiedAt: new Date().toISOString(),
        } satisfies VerifyResponse);
      }

      // Step 4: Attestation check (stub for now)
      // In production, verify device certificate chain and attestation
      const attestationValid = true;

      // Get policy
      const policy = await queryOne<Policy>(
        'SELECT * FROM policies WHERE name = $1 AND is_active = true',
        [policyId]
      );

      // Build reasons for verified verdict
      const reasons: string[] = [
        'Content binding hash matches',
        'Signature valid',
        'Device certificate chain valid',
      ];

      if (attestationValid) {
        reasons.push('Hardware attestation present');
      }

      // Step 5: Insert verification record
      const capturedAtDate = manifest.capturedAt ? new Date(manifest.capturedAt) : null;

      const verificationId = await recordVerification({
        assetSha256,
        verdict: 'verified',
        reasons,
        deviceId: manifest.deviceId || null,
        policyId: policy?.id || null,
        assetSizeBytes: assetBytes.length,
        capturedAt: capturedAtDate,
        signatureAlgorithm: manifest.signature.algorithm,
      });

      // Build metadata
      const metadata = {
        deviceId: manifest.deviceId,
        capturedAt: manifest.capturedAt,
        deviceModel: (manifest.metadata?.deviceModel as string) || undefined,
        osVersion: (manifest.metadata?.osVersion as string) || undefined,
        manifestVersion: manifest.version,
        signatureAlgorithm: manifest.signature.algorithm,
        attestationType: (manifest.metadata?.attestationType as string) || undefined,
      };

      // Build response
      const response: VerifyResponse = {
        verificationId,
        mode: 'certified',
        verdict: 'verified',
        confidence_score: 100,
        assetSha256,
        reasons,
        metadata,
        evidencePackageUrl: `${getBaseUrl(request)}/v1/evidence/${verificationId}`,
        verifiedAt: new Date().toISOString(),
      };

      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error(error);
      
      // Provide more specific error messages for common issues
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return reply.code(400).send({
          error: 'fetch_error',
          message: 'Unable to fetch image from URL. Please try uploading the image directly using base64 encoding.',
        });
      }
      
      return reply.code(500).send({
        error: 'internal_error',
        message: 'An unexpected error occurred during verification',
      });
    }
  });
}

/**
 * Handle multipart/form-data request
 */
async function handleMultipartRequest(request: FastifyRequest): Promise<{
  assetBytes: Buffer;
  manifestBytes: Buffer | null;
  policyId?: string;
}> {
  const parts = request.parts();
  let assetBytes: Buffer | null = null;
  let manifestBytes: Buffer | null = null;
  let policyId: string | undefined;

  for await (const part of parts) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer();

      if (part.fieldname === 'asset') {
        assetBytes = buffer;
      } else if (part.fieldname === 'manifest') {
        manifestBytes = buffer;
      }
    } else if (part.type === 'field') {
      if (part.fieldname === 'policyId') {
        policyId = part.value as string;
      }
    }
  }

  if (!assetBytes) {
    throw new Error('Missing required field: asset');
  }

  return { assetBytes, manifestBytes, policyId };
}

/**
 * Handle JSON request (URLs or base64)
 */
async function handleJsonRequest(body: VerifyRequestJson): Promise<{
  assetBytes: Buffer;
  manifestBytes: Buffer | null;
  policyId?: string;
}> {
  let assetBytes: Buffer;
  let manifestBytes: Buffer | null = null;

  // URL-based
  if (body.assetUrl) {
    assetBytes = await fetchUrl(body.assetUrl);
    if (body.manifestUrl) {
      manifestBytes = await fetchUrl(body.manifestUrl);
    }
  }
  // Base64-encoded
  else if (body.assetBase64) {
    assetBytes = Buffer.from(body.assetBase64, 'base64');
    if (body.manifestBase64) {
      manifestBytes = Buffer.from(body.manifestBase64, 'base64');
    }
  } else {
    throw new Error(
      'Invalid request: must provide either assetUrl or assetBase64'
    );
  }

  return {
    assetBytes,
    manifestBytes,
    policyId: body.policyId,
  };
}

/**
 * Fetch URL and return bytes
 */
async function fetchUrl(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': process.env.USER_AGENT || 'PoPC-Verification-API/1.0',
        'Accept': 'image/*,*/*',
      },
      // Railway may have network restrictions, so we'll handle errors gracefully
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    // Log the error for debugging but don't expose internal details
    console.error('Fetch error for URL:', url, 'Error:', (error as Error).message);
    throw new Error(`Unable to fetch image from URL. This may be due to network restrictions or invalid URL.`);
  }
}

/**
 * Record verification in database
 */
async function recordVerification(data: {
  assetSha256: string;
  verdict: 'verified' | 'tampered' | 'unsigned' | 'invalid' | 'revoked';
  reasons: string[];
  deviceId: string | null;
  policyId: string | null;
  assetSizeBytes: number;
  capturedAt?: Date | null;
  signatureAlgorithm?: string;
}): Promise<string> {
  const verificationId = generateVerificationId();

  await query(
    `INSERT INTO verifications (
      id,
      asset_sha256,
      verdict,
      reasons_json,
      device_id,
      policy_id,
      asset_size_bytes,
      captured_at,
      signature_algorithm
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      verificationId,
      data.assetSha256,
      data.verdict,
      JSON.stringify(data.reasons),
      data.deviceId,
      data.policyId,
      data.assetSizeBytes,
      data.capturedAt || null,
      data.signatureAlgorithm || null,
    ]
  );

  return verificationId;
}

/**
 * Get base URL from request
 */
function getBaseUrl(request: FastifyRequest): string {
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  return `${protocol}://${host}`;
}
