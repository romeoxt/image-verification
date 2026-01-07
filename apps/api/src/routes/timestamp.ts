import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryOne } from '../lib/db.js';

interface TimestampRequest {
  assetSha256: string;
}

export async function timestampRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: TimestampRequest;
  }>('/v1/timestamp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { assetSha256 } = request.body as TimestampRequest;

      if (!assetSha256) {
        return reply.code(400).send({
          error: 'invalid_request',
          message: 'assetSha256 is required',
        });
      }

      // Check if the asset exists in verifications or transparency log
      // For now, we'll just simulate a successful timestamp if we have a record
      // In a real implementation, this would interact with an external TSA (RFC 3161)
      
      const verification = await queryOne(
        'SELECT created_at FROM verifications WHERE asset_sha256 = $1 ORDER BY created_at ASC LIMIT 1',
        [assetSha256]
      );

      if (!verification) {
         return reply.code(404).send({
          error: 'asset_not_found',
          message: 'Asset has not been verified yet',
        });
      }

      // Return a simulated trusted timestamp
      // In production, this would be a SignedToken from a TSA
      return reply.code(200).send({
        status: 'timestamped',
        assetSha256,
        timestamp: new Date().toISOString(),
        authority: 'PoPC Internal TSA (Simulation)',
        signature: 'simulated_tsa_signature_base64_placeholder' 
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'internal_error',
        message: 'An unexpected error occurred',
      });
    }
  });
}

