import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <link href="https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/css/fount-system-c9d99c12020c240d71e663bb1f.webflow.shared.745a53245.min.css" rel="stylesheet" type="text/css" />
      
      <div className="page-wrapper bg-[#F8FAF0]">
        <SiteHeader />

        <main className="page-main">
          {/* Hero */}
          <section className="hero section u-theme-dark u-overflow-hidden bg-slate-900">
            <div className="w-layout-blockcontainer container u-z-index-2 w-container">
               <div className="row row-bottom row-between u-vgap-24">
                  <div className="col col-lg-8 col-sm-12">
                     <h1 className="hero_h1 text-white">Our Mission</h1>
                     <p className="p-xl u-color-secondary text-slate-400">
                       We believe that for the digital world to function, we need to know what is real.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          <section className="section bg-[#F8FAF0]">
            <div className="w-layout-blockcontainer container w-container max-w-3xl mx-auto">
               <div className="prose prose-lg prose-slate">
                  <p className="text-xl leading-relaxed text-slate-600 mb-8">
                     The rise of generative AI has created a crisis of confidence. When any image can be synthesized in seconds, the assumption of truth that photography once held is gone.
                  </p>
                  <p className="text-lg text-slate-600 mb-8">
                     PoPC (Proof of Physical Capture) was built to restore that trust. We don't try to detect fakes—a losing battle against rapidly improving AI models. Instead, we prove authenticity.
                  </p>
                  <p className="text-lg text-slate-600 mb-12">
                     By anchoring digital media to physical hardware at the exact moment of capture, we create a chain of custody that cannot be forged.
                  </p>
               </div>

               <div className="border-t border-slate-200 pt-12 mt-12">
                  <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div>
                        <h3 className="font-bold text-lg mb-2">General Inquiries</h3>
                        <a href="mailto:contact@popc.dev" className="text-emerald-600 hover:underline">contact@popc.dev</a>
                     </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Sales & Partnerships</h3>
                        <a href="mailto:sales@popc.dev" className="text-emerald-600 hover:underline">sales@popc.dev</a>
                     </div>
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

