import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, Users, Activity } from "lucide-react";
import { queryOne, queryMany, type Verification } from "@/lib/db";

// Force dynamic rendering so we get fresh data on every load
export const dynamic = 'force-dynamic';

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = {
    verified: "bg-green-100 text-green-800 border-green-200",
    tampered: "bg-red-100 text-red-800 border-red-200",
    unsigned: "bg-yellow-100 text-yellow-800 border-yellow-200",
    invalid: "bg-orange-100 text-orange-800 border-orange-200",
    revoked: "bg-gray-100 text-gray-800 border-gray-200",
  };
  
  // @ts-ignore
  const className = styles[verdict] || "bg-gray-100 text-gray-800 border-gray-200";
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
    </span>
  );
}

export default async function DashboardHome() {
  // Fetch real stats
  let deviceCount = 0;
  let revokedCount = 0;
  let verificationCount = 0;
  let recentVerifications: Verification[] = [];
  let dbError = false;

  try {
    // Parallel queries for speed
    const [devicesRes, verificationsRes, recentRes] = await Promise.all([
      queryOne<{ total: string, revoked: string }>(`
        SELECT 
          count(*)::text as total,
          count(revoked_at)::text as revoked
        FROM devices
      `),
      queryOne<{ total: string }>(`SELECT count(*)::text as total FROM verifications`),
      queryMany<Verification>(`SELECT * FROM verifications ORDER BY created_at DESC LIMIT 5`)
    ]);

    deviceCount = parseInt(devicesRes?.total || '0');
    revokedCount = parseInt(devicesRes?.revoked || '0');
    verificationCount = parseInt(verificationsRes?.total || '0');
    recentVerifications = recentRes;
  } catch (e) {
    console.error("DB Fetch Error", e);
    dbError = true;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="h-6 w-6" />
            <span>PoPC Admin</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/devices">Devices</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/verifications">Logs</Link>
            </Button>
            <Button variant="outline">Sign Out</Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Devices Card */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Devices</h3>
                <p className="text-sm text-muted-foreground">Manage enrolled devices</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dbError ? '-' : deviceCount}</div>
              <p className="text-xs text-muted-foreground">
                {revokedCount > 0 ? `${revokedCount} revoked` : 'All active'}
              </p>
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                 <Link href="/dashboard/devices">View Devices</Link>
              </Button>
            </div>
          </div>

          {/* Verifications Card */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
             <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Verifications</h3>
                <p className="text-sm text-muted-foreground">Total volume</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{dbError ? '-' : verificationCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
             <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                 <Link href="/dashboard/verifications">View Logs</Link>
              </Button>
            </div>
          </div>

          {/* System Health Card */}
           <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
             <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">System Health</h3>
                <p className="text-sm text-muted-foreground">Service status</p>
              </div>
            </div>
            <div className="mt-4">
              {dbError ? (
                <div className="text-2xl font-bold text-destructive">Error</div>
              ) : (
                <div className="text-2xl font-bold text-green-600">Healthy</div>
              )}
              <p className="text-xs text-muted-foreground">
                {dbError ? 'Database connection failed' : 'All systems operational'}
              </p>
            </div>
             <div className="mt-4">
              <Button variant="outline" className="w-full">System Status</Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Asset</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Verdict</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                 {recentVerifications.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="p-4 text-center text-muted-foreground">
                       {dbError ? 'Cannot load activity.' : 'No recent activity.'}
                     </td>
                   </tr>
                 ) : (
                   recentVerifications.map((v) => (
                    <tr key={v.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-mono text-xs">
                        {v.asset_sha256.substring(0, 8)}...
                      </td>
                      <td className="p-4 align-middle">
                        <VerdictBadge verdict={v.verdict} />
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {new Date(v.created_at).toLocaleTimeString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/dashboard/verifications">View</Link>
                        </Button>
                      </td>
                    </tr>
                   ))
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}


