/**
 * API client for PoPC verification service
 */
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { z } from 'zod';

const EnrollmentResponseSchema = z.object({
  deviceId: z.string(),
  publicKeyFingerprint: z.string(),
  securityLevel: z.string(),
  enrolledAt: z.string(),
  message: z.string().optional(),
});

const VerifyResponseSchema = z.object({
  verificationId: z.string(),
  mode: z.enum(['certified', 'heuristic']),
  verdict: z.enum(['verified', 'tampered', 'unsigned', 'invalid', 'revoked']),
  confidence_score: z.number().optional(),
  assetSha256: z.string(),
  reasons: z.array(z.string()),
  metadata: z.any().nullable(),
  evidencePackageUrl: z.string().nullable(),
  verifiedAt: z.string(),
  signals: z.any().optional(),
});

export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;

export class PopcApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.POPC_BASE_URL || 'https://image-verification-production.up.railway.app';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'PoPC-Desktop-Signer/0.1.0',
      },
    });
  }

  /**
   * Enroll a new device
   */
  async enroll(publicKeyRequest: any, platform: string = 'web'): Promise<EnrollmentResponse> {
    try {
      const response = await this.client.post('/v1/enroll', {
        platform,
        csrPem: publicKeyRequest.publicKeyPem,
        publicKeyFingerprint: publicKeyRequest.fingerprint,
        allowSoftware: true,
        algorithm: publicKeyRequest.algorithm,
        curve: publicKeyRequest.curve,
      });

      return EnrollmentResponseSchema.parse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Enrollment failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Verify an image with optional manifest
   */
  async verify(imagePath: string, manifestPath?: string): Promise<VerifyResponse> {
    try {
      const formData = new FormData();
      formData.append('asset', createReadStream(imagePath));

      if (manifestPath) {
        formData.append('manifest', createReadStream(manifestPath));
      }

      const response = await this.client.post('/v1/verify', formData, {
        headers: formData.getHeaders(),
      });

      return VerifyResponseSchema.parse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Verification failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get evidence package
   */
  async getEvidence(verificationId: string): Promise<any> {
    try {
      const response = await this.client.get(`/v1/evidence/${verificationId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get evidence: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
