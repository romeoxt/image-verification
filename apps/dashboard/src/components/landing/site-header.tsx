import Link from "next/link";
import { ShieldCheck, Menu } from "lucide-react";

export function SiteHeader() {
  return (
    <nav className="navigation bg-[#F8FAF0]">
      <div className="nav_layout">
        <Link href="/" aria-current="page" className="nav_logo w-inline-block w--current">
          <div className="logo" style={{ color: "#FF5F02" }}>
            <ShieldCheck className="h-8 w-8 text-current" />
          </div>
          <div className="logo_word" style={{ color: "#1a1a1a", fontSize: '24px', fontWeight: 'bold', marginLeft: '10px' }}>
            PoPC
          </div>
        </Link>
        
        <div className="nav_menu">
          <ul role="list" className="nav_list w-list-unstyled">
            <li className="nav_list-item">
              <Link href="/how-it-works" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                How It Works
              </Link>
            </li>
            <li className="nav_list-item">
              <Link href="/use-cases" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                Use Cases
              </Link>
            </li>
            <li className="nav_list-item">
              <Link href="/developers" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                Developers
              </Link>
            </li>
            <li className="nav_list-item">
              <Link href="/about" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                About
              </Link>
            </li>
          </ul>
          
          <div className="nav_list-secondary">
            <Link href="/dashboard" className="nav_link eyebrow cc-secondary" style={{ color: "#1a1a1a" }}>
              Login
            </Link>
            <Link aria-label="" href="/dashboard" className="btn cc-navigation w-inline-block" style={{ borderColor: "#1a1a1a", color: "#1a1a1a" }}>
              <div>Get Started</div>
            </Link>
          </div>
        </div>
        
        <div className="menu_button">
          <Menu className="text-slate-900" />
        </div>
      </div>
      <div className="nav_bg" style={{ opacity: 0, visibility: "hidden" }}></div>
    </nav>
  );
}

