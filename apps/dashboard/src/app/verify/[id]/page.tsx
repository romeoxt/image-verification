'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Copy, 
  Check, 
  Share2, 
  Download,
  AlertCircle,
  Clock,
  Smartphone,
  Hash,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationData {
  verificationId: string;
  verdict: string;
  mode: string;
  confidence: number;
  reasons: string[];
  deviceId?: string;
  timestamp?: string;
  sha256?: string;
  deviceInfo?: {
    manufacturer?: string;
    model?: string;
    securityLevel?: string;
    bootState?: string;
  };
  signatureValid?: boolean;
  chainValid?: boolean;
  contentBinding?: boolean;
  metadata?: {
    storageUrl?: string;
    format?: string;
    location?: any;
    sensors?: any;
    motion_label?: string;
  };
}

export default function VerificationResultPage() {
  const params = useParams();
  const router = useRouter();
  const verificationId = params.id as string;
  
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVerificationData();
  }, [verificationId]);

  const fetchVerificationData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://image-verification-production.up.railway.app';
      const response = await fetch(`${apiUrl}/v1/evidence/${verificationId}`);
      
      if (!response.ok) {
        throw new Error('Verification not found');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PoPC Verification: ${data?.verdict}`,
          text: `Image verification result - ${data?.verdict} (${data?.confidence}/100 confidence)`,
          url: url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      copyLink();
    }
  };

  const getVerdictConfig = (verdict: string) => {
    const v = verdict?.toUpperCase() || '';
    if (v.includes('VERIFIED')) {
      return {
        icon: ShieldCheck,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-500',
        label: 'VERIFIED',
      };
    } else if (v.includes('TAMPERED')) {
      return {
        icon: ShieldX,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-500',
        label: 'TAMPERED',
      };
    } else if (v.includes('UNSIGNED')) {
      return {
        icon: ShieldAlert,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-500',
        label: 'UNSIGNED',
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-500',
        label: verdict?.toUpperCase() || 'UNKNOWN',
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 dark:border-white mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verification Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This verification does not exist or has expired.'}
          </p>
          <Button asChild>
            <Link href="/verify">Verify Another Image</Link>
          </Button>
        </div>
      </div>
    );
  }

  const verdictConfig = getVerdictConfig(data.verdict);
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-bold text-xl">PoPC Verifier</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareLink}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/verify">Verify Another</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Verdict Card */}
          <div className={`${verdictConfig.bgColor} rounded-2xl shadow-2xl p-8 mb-8 border-4 ${verdictConfig.borderColor}`}>
            <div className="text-center">
              <VerdictIcon className={`h-20 w-20 mx-auto mb-4 ${verdictConfig.color}`} />
              <h1 className={`text-4xl font-bold mb-2 ${verdictConfig.color}`}>
                {verdictConfig.label}
              </h1>
              {data.mode && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Mode: {data.mode}
                </p>
              )}
              
              {/* Display Asset if available */}
              {data.metadata?.storageUrl && (
                <div className="my-6 max-w-md mx-auto rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                  {data.metadata.format === 'video/mp4' ? (
                    <video 
                      src={data.metadata.storageUrl} 
                      controls 
                      className="w-full h-auto"
                    />
                  ) : (
                    <img 
                      src={data.metadata.storageUrl} 
                      alt="Verified Asset" 
                      className="w-full h-auto"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-2xl font-semibold">
                <span>Confidence:</span>
                <span className={verdictConfig.color}>{data.confidence}/100</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Device Information */}
            {data.deviceId && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Device ID</p>
                    <p className="font-mono text-sm break-all">{data.deviceId}</p>
                  </div>
                  {data.deviceInfo?.manufacturer && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manufacturer</p>
                      <p className="font-semibold">{data.deviceInfo.manufacturer}</p>
                    </div>
                  )}
                  {data.deviceInfo?.model && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Model</p>
                      <p className="font-semibold">{data.deviceInfo.model}</p>
                    </div>
                  )}
                  {data.deviceInfo?.securityLevel && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Security Level</p>
                      <p className="font-semibold uppercase">{data.deviceInfo.securityLevel}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Verification Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verification ID</p>
                  <p className="font-mono text-sm break-all">{data.verificationId}</p>
                </div>
                {data.timestamp && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Captured At</p>
                    <p className="font-semibold">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                {data.sha256 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SHA-256 Hash</p>
                    <p className="font-mono text-xs break-all">{data.sha256}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification Checks */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">Verification Checks</h2>
            <div className="space-y-3">
              {data.reasons && data.reasons.length > 0 ? (
                data.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    {reason.toLowerCase().includes('invalid') || reason.toLowerCase().includes('failed') ? (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No detailed checks available</p>
              )}
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-bold mb-4">Share This Verification</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Anyone with this link can view the verification results as proof of authenticity.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Technical Note */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              This verification uses cryptographic signatures and hardware attestation.
              <br />
              Verification data is retained for 30 days for audit purposes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

