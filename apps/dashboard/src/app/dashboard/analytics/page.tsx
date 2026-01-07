import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryOne } from "@/lib/db";
import { OutcomesChart } from "./charts";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getAnalytics() {
  try {
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
            <div className="h-64">
              <OutcomesChart verified={data.verified} tampered={data.tampered} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
              <p className="text-sm text-slate-500">Not enough data for timeline</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


