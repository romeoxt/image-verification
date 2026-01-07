import Link from "next/link";
import { ShieldCheck, Menu } from "lucide-react";
import { TabsSection } from "@/components/landing/tabs-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { TracksSection } from "@/components/landing/tracks-section";

export default function LandingPage() {
  return (
    <>
      <link href="https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/css/fount-system-c9d99c12020c240d71e663bb1f.webflow.shared.745a53245.min.css" rel="stylesheet" type="text/css" />
      
      <div className="page-wrapper bg-[#F8FAF0]">
        <SiteHeader />

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

          <TracksSection />

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

          <SiteFooter />
        </main>
      </div>
    </>
  );
}
