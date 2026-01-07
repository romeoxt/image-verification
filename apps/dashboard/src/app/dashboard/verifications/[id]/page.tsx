import { Button } from "@/components/ui/button";
import { queryOne, type Verification, type Device } from "@/lib/db";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  Calendar, 
  MapPin, 
  Hash, 
  FileCode,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getVerification(id: string) {
  try {
    const verification = await queryOne<Verification>(`
      SELECT * FROM verifications WHERE id = $1
    `, [id]);

    if (!verification) return null;

    let device = null;
    if (verification.device_id) {
      device = await queryOne<Device>(`
        SELECT * FROM devices WHERE id = $1
      `, [verification.device_id]);
    }

    return { verification, device };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export default async function VerificationDetailPage({ params }: { params: { id: string } }) {
  const data = await getVerification(params.id);

  if (!data) {
    notFound();
  }

  const { verification, device } = data;

  const getVerdictConfig = (verdict: string) => {
    const v = verdict?.toUpperCase() || '';
    if (v.includes('VERIFIED')) {
      return {
        icon: ShieldCheck,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-500',
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
        color: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-50 dark:bg-slate-900/20',
        borderColor: 'border-slate-500',
        label: verdict?.toUpperCase() || 'UNKNOWN',
      };
    }
  };

  const verdictConfig = getVerdictConfig(verification.verdict);
  const VerdictIcon = verdictConfig.icon;

  // Parse metadata safely
  const metadata = typeof verification.metadata === 'string' 
    ? JSON.parse(verification.metadata) 
    : verification.metadata || {};

  // Parse reasons safely
  const reasons = Array.isArray(verification.reasons_json)
    ? verification.reasons_json
    : typeof verification.reasons_json === 'string'
      ? JSON.parse(verification.reasons_json)
      : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/gallery">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verification Details</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">
            ID: {verification.id}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" asChild>
            <Link href={`/verify/${verification.id}`} target="_blank">
              View Public Page
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Verdict Card */}
          <div className={`${verdictConfig.bgColor} rounded-xl p-8 border-2 ${verdictConfig.borderColor}`}>
            <div className="flex items-center gap-6">
              <VerdictIcon className={`h-16 w-16 ${verdictConfig.color}`} />
              <div>
                <h2 className={`text-3xl font-bold ${verdictConfig.color}`}>
                  {verdictConfig.label}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Confidence: 100% • Mode: {verification.mode || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Asset Preview */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-semibold flex items-center gap-2">
                <FileCode className="h-4 w-4" /> Media Asset
              </h3>
            </div>
            <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              {metadata.storageUrl ? (
                 verification.asset_mime_type?.startsWith('video') ? (
                  <video src={metadata.storageUrl} controls className="max-h-full max-w-full" />
                 ) : (
                  <img src={metadata.storageUrl} alt="Verified Asset" className="max-h-full max-w-full object-contain" />
                 )
              ) : (
                <div className="text-center text-slate-400">
                  <p>Preview not available</p>
                  <p className="text-xs mt-1">Assets are stored in secure volume</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">MIME Type</p>
                <p className="font-mono">{verification.asset_mime_type || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Size</p>
                <p className="font-mono">{(verification.asset_size_bytes || 0).toLocaleString()} bytes</p>
              </div>
            </div>
          </div>

          {/* Verification Checks */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Integrity Checks
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {reasons.map((reason: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  {reason.toLowerCase().includes('invalid') || reason.toLowerCase().includes('failed') ? (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Device Info */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Capture Device
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {device ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="font-medium">{device.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Device ID</p>
                    <p className="font-mono text-xs break-all">{device.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Security Level</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      <span className="text-sm uppercase">{device.security_level || 'Software'}</span>
                    </div>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground">Status</p>
                     <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${
                       !device.revoked_at ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                     }`}>
                       {!device.revoked_at ? 'Active' : 'Revoked'}
                     </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No device information linked.</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4" /> Metadata
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Captured At</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className="text-sm">
                    {verification.captured_at 
                      ? new Date(verification.captured_at).toLocaleString() 
                      : 'Unknown'}
                  </span>
                </div>
              </div>
              
              {metadata.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-sm truncate max-w-[200px]" title={JSON.stringify(metadata.location)}>
                      Lat: {metadata.location.latitude?.toFixed(4)}, Long: {metadata.location.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
                <p className="font-mono text-[10px] break-all mt-1 text-slate-500">
                  {verification.asset_sha256}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

