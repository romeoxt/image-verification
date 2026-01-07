import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Newspaper, Scale, Briefcase, Globe } from "lucide-react";
import Link from "next/link";

export default function UseCasesPage() {
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
                     <h1 className="hero_h1 text-white">Truth in a Digital World</h1>
                     <p className="p-xl u-color-secondary text-slate-400">
                       PoPC provides the layer of trust needed for high-stakes industries where authenticity is non-negotiable.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          <section className="section bg-[#F8FAF0]">
            <div className="w-layout-blockcontainer container w-container">
              
              {/* Case 1 */}
              <div className="mb-24">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-emerald-100 rounded-lg">
                      <Newspaper className="h-8 w-8 text-emerald-600" />
                   </div>
                   <h2 className="text-4xl font-bold">Journalism & Media</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-lg text-slate-600 mb-4">
                      In an era of deepfakes, proving that a photo from a conflict zone is authentic is critical for maintaining public trust.
                    </p>
                    <ul className="space-y-4">
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Conflict Reporting</strong>
                        <span className="text-slate-500">Verify imagery from stringers and freelancers before publishing.</span>
                      </li>
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Archive Integrity</strong>
                        <span className="text-slate-500">Ensure historical records remain unaltered over decades.</span>
                      </li>
                    </ul>
                  </div>
                   <div className="bg-slate-200 rounded-xl min-h-[300px]"></div>
                </div>
              </div>

               {/* Case 2 */}
              <div className="mb-24">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-blue-100 rounded-lg">
                      <Briefcase className="h-8 w-8 text-blue-600" />
                   </div>
                   <h2 className="text-4xl font-bold">Insurance & Claims</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-lg text-slate-600 mb-4">
                      Fraudulent claims using AI-generated or manipulated photos cost insurers billions. PoPC eliminates this vector entirely.
                    </p>
                    <ul className="space-y-4">
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Accident Documentation</strong>
                        <span className="text-slate-500">Drivers capture verified photos of damage at the scene.</span>
                      </li>
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Asset Verification</strong>
                        <span className="text-slate-500">Prove high-value items exist and are in claimed condition.</span>
                      </li>
                    </ul>
                  </div>
                   <div className="bg-slate-200 rounded-xl min-h-[300px]"></div>
                </div>
              </div>

              {/* Case 3 */}
              <div className="mb-24">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-purple-100 rounded-lg">
                      <Scale className="h-8 w-8 text-purple-600" />
                   </div>
                   <h2 className="text-4xl font-bold">Legal & Forensics</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-lg text-slate-600 mb-4">
                      Digital evidence is increasingly challenged in court. PoPC provides a cryptographic chain of custody that stands up to scrutiny.
                    </p>
                    <ul className="space-y-4">
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Chain of Custody</strong>
                        <span className="text-slate-500">Mathematical proof that evidence hasn't changed since capture.</span>
                      </li>
                      <li className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <strong className="block mb-1">Location Assurance</strong>
                        <span className="text-slate-500">Verified GPS coordinates embedded in the signature.</span>
                      </li>
                    </ul>
                  </div>
                   <div className="bg-slate-200 rounded-xl min-h-[300px]"></div>
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

