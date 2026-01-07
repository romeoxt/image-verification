import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="u-pv-80-48 u-theme-dark bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="w-layout-blockcontainer container w-container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="mb-4 md:mb-0">© 2026 PoPC. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/about" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/about" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/about" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

