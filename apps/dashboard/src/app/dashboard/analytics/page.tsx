import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryOne } from "@/lib/db";
import { BarChart3 } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getAnalytics() {
  try {
    // Simple mock data or real counts
    const [verdictStats] = await Promise.all([
      queryOne<{ verified: string, tampered: string }>(`
        SELECT 
          count(*) filter (where verdict = 'verified') as verified,
          count(*) filter (where verdict != 'verified') as tampered
        FROM verifications
      `)
    ]);

    return {
      verified: parseInt(verdictStats?.verified || '0'),
      tampered: parseInt(verdictStats?.tampered || '0')
    };
  } catch (e) {
    return { verified: 0, tampered: 0 };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Insights into verification trends and system integrity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
              <div className="text-center space-y-2">
                <BarChart3 className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">Charts require client-side rendering (Recharts).</p>
                <div className="flex gap-4 text-sm font-medium mt-4">
                  <span className="text-emerald-600">Verified: {data.verified}</span>
                  <span className="text-red-600">Tampered: {data.tampered}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
              <p className="text-sm text-slate-500">Timeline visualization placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

