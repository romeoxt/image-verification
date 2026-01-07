import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { queryMany, type Verification } from "@/lib/db";
import { ShieldCheck, AlertTriangle, Calendar, MapPin, Smartphone } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getVerifications() {
  try {
    return await queryMany<Verification>(`
      SELECT * FROM verifications 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function GalleryPage() {
  const verifications = await getVerifications();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Gallery</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Browse and audit verified media assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Export CSV</Button>
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-xl border-dashed bg-slate-50/50 dark:bg-slate-900/50">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold">No evidence found</h3>
          <p className="text-slate-500 text-sm max-w-sm text-center mt-2">
            Capture photos using the PoPC mobile app to see them appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {verifications.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                {/* Visual Placeholder or Real Image */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                   {/* In a real app, use <Image src={item.storageUrl} ... /> */}
                   <span className="text-xs font-mono">Asset Preview</span>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${
                    item.verdict === 'verified' 
                      ? 'bg-emerald-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {item.verdict === 'verified' ? (
                      <><ShieldCheck className="h-3 w-3 mr-1" /> Verified</>
                    ) : (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> Tampered</>
                    )}
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-slate-500 truncate w-32" title={item.id}>
                      ID: {item.id.substring(0, 8)}...
                    </p>
                    <p className="text-sm font-medium truncate w-40">
                      {item.asset_mime_type || 'Unknown Type'}
                    </p>
                  </div>
                  {/* Mode Badge */}
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {item.mode || 'HEURISTIC'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar className="h-3 w-3 mr-2" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Smartphone className="h-3 w-3 mr-2" />
                    {item.device_id ? `Device ${item.device_id.substring(0, 6)}...` : 'Unknown Device'}
                  </div>
                  {/* Location Stub */}
                  <div className="flex items-center text-xs text-slate-500">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span className="italic">Location hidden</span>
                  </div>
                </div>

                    <Button asChild className="w-full mt-2" size="sm" variant="secondary">
                  <Link href={`/dashboard/verifications/${item.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


