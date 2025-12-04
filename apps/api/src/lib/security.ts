/**
 * Security middleware
 * - Security headers
 * - Request validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Add security headers to all responses
 */
export async function securityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Prevent clickjacking
  reply.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  reply.header('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy but still useful)
  reply.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  reply.header(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'"
  );
  
  // Permissions Policy (formerly Feature Policy)
  reply.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  
  // HSTS (HTTP Strict Transport Security) - only for HTTPS
  if (request.protocol === 'https') {
    reply.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: FastifyRequest,
  reply: FastifyReply,
  maxSize: number
): Promise<void> {
  const contentLength = request.headers['content-length'];
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    reply.code(413).send({
      error: 'payload_too_large',
      message: `Request body exceeds maximum size of ${maxSize} bytes`,
    });
  }
}

