import Link from "next/link";
import { ShieldCheck, Menu } from "lucide-react";
import { TabsSection } from "@/components/landing/tabs-section";
import { HeroSection } from "@/components/landing/hero-section";

export default function LandingPage() {
  return (
    <>
      <link href="https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/css/fount-system-c9d99c12020c240d71e663bb1f.webflow.shared.745a53245.min.css" rel="stylesheet" type="text/css" />
      
      <div className="page-wrapper bg-[#F8FAF0]">
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
                  <a href="#how-it-works" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                    How It Works
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#use-cases" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                    Use Cases
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#developers" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                    Developers
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#about" className="nav_link eyebrow" style={{ color: "#1a1a1a" }}>
                    About
                  </a>
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

        <main className="page-main">
          
          <HeroSection />

          <div className="u-pv-48-24 u-theme-dark bg-slate-900">
            <div className="w-layout-blockcontainer container w-container mx-auto px-4">
              <div className="u-vflex-stretch-top u-vgap-24-16">
                <div className="row row-center-horizontal">
                  <div className="col col-shrink">
                    <h2 className="eyebrow u-align-center text-slate-400">
                      Built for integrity-critical industries
                    </h2>
                </div>
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 mt-8">
                   <div className="col"><h3 className="h6 text-slate-500 font-bold text-xl">INSURANCE</h3></div>
                   <div className="col"><h3 className="h6 text-slate-500 font-bold text-xl">JOURNALISM</h3></div>
                   <div className="col"><h3 className="h6 text-slate-500 font-bold text-xl">LEGAL</h3></div>
                   <div className="col"><h3 className="h6 text-slate-500 font-bold text-xl">PLATFORMS</h3></div>
                   <div className="col"><h3 className="h6 text-slate-500 font-bold text-xl">ARCHIVE</h3></div>
                </div>
              </div>
            </div>
          </div>

          <section className="track section u-pb-0 bg-[#F8FAF0]">
            <div className="u-vflex-stretch-top u-vgap-64-24">
              <div className="w-layout-blockcontainer container w-container mx-auto px-4">
                <div className="row row-center-horizontal">
                  <div className="col col-lg-8">
                    <h2 className="u-align-center text-slate-900 text-4xl font-bold text-center mb-12">
                      The internet lost its ability to trust images
                    </h2>
            </div>
                </div>
              </div>
              <div className="tracks_container container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="h6 font-bold mb-2">AI is indistinguishable from reality</h3>
                    <p className="text-slate-500 text-sm">Generative models can fake events perfectly.</p>
                </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="h6 font-bold mb-2">Metadata is worthless</h3>
                    <p className="text-slate-500 text-sm">EXIF data is easily spoofed by anyone.</p>
              </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="h6 font-bold mb-2">Tribal knowledge isn't enough</h3>
                    <p className="text-slate-500 text-sm">You can't rely on "knowing" the source anymore.</p>
                </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="h6 font-bold mb-2">Broken trust</h3>
                    <p className="text-slate-500 text-sm">Courts and insurers are rejecting digital evidence.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

          <TabsSection />

          <section className="section u-p-0 bg-[#F8FAF0]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-12 bg-slate-900 text-white">
              <div className="text-center p-4 border-r border-slate-800 last:border-0">
                <h3 className="text-4xl font-bold mb-2">100%</h3>
                <h4 className="text-slate-400 text-sm uppercase tracking-wider">Tamper Proof</h4>
              </div>
              <div className="text-center p-4 border-r border-slate-800 last:border-0">
                <h3 className="text-4xl font-bold mb-2">StrongBox</h3>
                <h4 className="text-slate-400 text-sm uppercase tracking-wider">Hardware Backed</h4>
              </div>
              <div className="text-center p-4 border-r border-slate-800 last:border-0">
                <h3 className="text-4xl font-bold mb-2">C2PA</h3>
                <h4 className="text-slate-400 text-sm uppercase tracking-wider">Standard Compliant</h4>
                </div>
              <div className="text-center p-4 border-r border-slate-800 last:border-0">
                <h3 className="text-4xl font-bold mb-2">Instant</h3>
                <h4 className="text-slate-400 text-sm uppercase tracking-wider">Verification</h4>
              </div>
              <div className="text-center p-4 border-r border-slate-800 last:border-0">
                <h3 className="text-4xl font-bold mb-2">Zero</h3>
                <h4 className="text-slate-400 text-sm uppercase tracking-wider">False Positives</h4>
              </div>
            </div>
          </section>

          <section className="section bg-[#F8FAF0] py-24">
             <div className="w-layout-blockcontainer container w-container mx-auto px-4">
                <div className="row row-center-horizontal">
                    <div className="col col-lg-8 text-center mx-auto">
                        <h2 className="hero_h1 text-5xl font-bold mb-8 text-slate-900">
                            Restore Trust in Digital Media
                        </h2>
                        <Link href="/dashboard" className="inline-flex items-center justify-center h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                            Get Started Now
                        </Link>
                    </div>
            </div>
          </div>
        </section>

          <footer className="u-pv-80-48 u-theme-dark bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
             <div className="w-layout-blockcontainer container w-container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="mb-4 md:mb-0">© 2026 PoPC. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
            </div>
          </div>
          </footer>
      </main>
    </div>
    </>
  );
}
