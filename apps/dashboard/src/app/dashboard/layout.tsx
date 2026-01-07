import { Sidebar, MobileNav } from '@/components/dashboard/sidebar';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <Sidebar className="h-full" user={user} />
      </div>

      {/* Mobile Nav */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
