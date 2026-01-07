import { Button } from "@/components/ui/button";
import { queryMany, type Device } from "@/lib/db";
import { Smartphone, Shield, AlertTriangle, Trash2 } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getDevices() {
  try {
    return await queryMany<Device>(`
      SELECT * FROM devices 
      ORDER BY enrolled_at DESC
    `);
  } catch (e) {
    return [];
  }
}

export default async function DevicesPage() {
  const devices = await getDevices();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage enrolled capture devices and trusted sources.
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <table className="w-full caption-bottom text-sm text-left">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Device</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Security</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Enrolled</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No devices enrolled yet.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium">{device.model || 'Unknown Model'}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {device.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${device.attestation_type ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="capitalize">{device.security_level || 'Software'}</span>
                    </div>
                  </td>
                <td className="p-4 align-middle">
                    {new Date(device.enrolled_at).toLocaleDateString()}
                </td>
                <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      !device.revoked_at
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {!device.revoked_at ? 'Active' : 'Revoked'}
                    </span>
                </td>
                <td className="p-4 align-middle text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
