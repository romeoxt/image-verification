import { queryMany, type Verification } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

export default async function VerificationsPage() {
  let verifications: Verification[] = [];
  let error = null;

  try {
    verifications = await queryMany<Verification>(`
      SELECT * FROM verifications 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
  } catch (e) {
    console.error("Failed to fetch verifications:", e);
    error = "Failed to connect to database.";
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold">Verifications</h1>
           <p className="text-muted-foreground">Recent verification attempts</p>
        </div>
        <Button variant="outline">Export CSV</Button>
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
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Asset</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Verdict</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Captured At</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Verified At</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {!error && verifications.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No verifications found.
                </td>
              </tr>
            )}
            {verifications.map((v) => (
              <tr key={v.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <td className="p-4 align-middle font-mono text-xs">{v.id.substring(0, 8)}...</td>
                <td className="p-4 align-middle font-mono text-xs" title={v.asset_sha256}>{v.asset_sha256.substring(0, 12)}...</td>
                <td className="p-4 align-middle">
                  <VerdictBadge verdict={v.verdict} />
                </td>
                <td className="p-4 align-middle">
                  {v.captured_at ? new Date(v.captured_at).toLocaleString() : '-'}
                </td>
                <td className="p-4 align-middle">
                   {new Date(v.created_at).toLocaleString()}
                </td>
                <td className="p-4 align-middle text-right">
                  <Button variant="ghost" size="sm">Details</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


