import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Smartphone, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/dashboard/devices', label: 'Devices', icon: Smartphone },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800 ${className}`}>
      <div className="p-6 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-emerald-500" />
        <span className="font-bold text-xl tracking-tight">PoPC</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">John Doe</p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-background p-4 flex items-center justify-between sticky top-0 z-50">
       <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <span className="font-bold text-lg">PoPC</span>
      </div>
      
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-slate-200 dark:border-slate-800 p-4 shadow-lg animate-in slide-in-from-top-5">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                   pathname === item.href 
                    ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

