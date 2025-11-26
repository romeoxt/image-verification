import { queryMany, type Device } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeviceActions } from "./device-actions";

function StatusBadge({ revokedAt }: { revokedAt: Date | null }) {
  if (revokedAt) {
    return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80">Revoked</span>
  }
  return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-600 text-white hover:bg-green-600/80">Active</span>
}

export default async function DevicesPage() {
  // Fetch devices from DB
  // We try/catch to handle DB connection errors gracefully in UI
  let devices: Device[] = [];
  let error = null;

  try {
    devices = await queryMany<Device>(`
      SELECT * FROM devices 
      ORDER BY enrolled_at DESC
    `);
  } catch (e) {
    console.error("Failed to fetch devices:", e);
    error = "Failed to connect to database.";
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold">Devices</h1>
           <p className="text-muted-foreground">Manage enrolled capture devices</p>
        </div>
        <Button>Enroll Device</Button>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Model</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Platform</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Enrolled</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {!error && devices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No devices found.
                </td>
              </tr>
            )}
            {devices.map((device) => (
              <tr key={device.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <td className="p-4 align-middle font-mono text-xs">{device.id.substring(0, 8)}...</td>
                <td className="p-4 align-middle">{device.manufacturer} {device.model}</td>
                <td className="p-4 align-middle capitalize">{device.platform || 'Unknown'}</td>
                <td className="p-4 align-middle">
                  <StatusBadge revokedAt={device.revoked_at} />
                </td>
                <td className="p-4 align-middle">{new Date(device.enrolled_at).toLocaleDateString()}</td>
                <td className="p-4 align-middle text-right">
                  <DeviceActions deviceId={device.id} isRevoked={!!device.revoked_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

