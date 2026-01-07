import { 
  ShieldCheck, 
  AlertTriangle, 
  Smartphone, 
  Activity,
  ArrowUpRight,
  Clock,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryOne, queryMany, type Verification } from "@/lib/db";
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const [devicesRes, verificationsRes, tamperedRes] = await Promise.all([
      queryOne<{ total: string }>(`SELECT count(*)::text as total FROM devices WHERE revoked_at IS NULL`),
      queryOne<{ total: string }>(`SELECT count(*)::text as total FROM verifications`),
      queryOne<{ total: string }>(`SELECT count(*)::text as total FROM verifications WHERE verdict != 'verified'`)
    ]);

    const totalVerifications = parseInt(verificationsRes?.total || '0');
    const totalTampered = parseInt(tamperedRes?.total || '0');
    const totalDevices = parseInt(devicesRes?.total || '0');
    
    // Calculate trust score (simple percentage of verified / total)
    const trustScore = totalVerifications > 0 
      ? ((totalVerifications - totalTampered) / totalVerifications * 100).toFixed(1)
      : '100';

    return {
      totalVerifications,
      totalTampered,
      totalDevices,
      trustScore
    };
  } catch (e) {
    console.error("DB Fetch Error", e);
    return {
      totalVerifications: 0,
      totalTampered: 0,
      totalDevices: 0,
      trustScore: '0.0'
    };
  }
}

async function getRecentVerifications() {
  try {
    return await queryMany<Verification>(`
      SELECT * FROM verifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
  } catch (e) {
    return [];
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentVerifications = await getRecentVerifications();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          System health and verification integrity summary.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Media</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVerifications}</div>
            <p className="text-xs text-muted-foreground">
              Total items processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tampered Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTampered}</div>
            <p className="text-xs text-muted-foreground">
              Failed verification checks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled & trusted sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trustScore}%</div>
            <p className="text-xs text-muted-foreground">
              System-wide integrity rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Verifications</h2>
          <Link 
            href="/dashboard/gallery" 
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
          >
            View Gallery <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Timestamp</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Mode</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {recentVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No verifications yet.
                    </td>
                  </tr>
                ) : (
                  recentVerifications.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          item.verdict === 'verified' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {item.verdict === 'verified' ? 'Verified' : 'Tampered'}
                        </span>
                      </td>
                      <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                        {item.id.substring(0, 8)}...
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </td>
                       <td className="p-4 align-middle">
                        <span className="capitalize text-muted-foreground">{item.mode || 'N/A'}</span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link 
                          href={`/verify/${item.id}`}
                          className="text-emerald-600 hover:underline font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
