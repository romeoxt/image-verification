import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle, FileText } from "lucide-react";

export default function HowItWorksPage() {
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
                     <h1 className="hero_h1 text-white">Security at the Source</h1>
                     <p className="p-xl u-color-secondary text-slate-400">
                       PoPC establishes a cryptographic chain of custody from the moment a photon hits the sensor.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          {/* Steps */}
          <section className="section bg-[#F8FAF0]">
            <div className="w-layout-blockcontainer container w-container">
              <div className="grid gap-24">
                {/* Step 1 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-8">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">1. Capture</h2>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                      Authenticity starts at the hardware level. The PoPC mobile SDK interfaces directly with the camera sensor (via Camera2 API on Android) to capture raw image data.
                    </p>
                    <ul className="space-y-4 text-lg text-slate-600">
                      <li className="flex gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
                        Prevents software injection attacks
                      </li>
                      <li className="flex gap-3">
                         <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
                         Captures GPS and sensor metadata instantly
                      </li>
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 bg-white rounded-2xl shadow-xl p-12 aspect-video flex items-center justify-center border border-slate-100">
                     <span className="text-slate-400 font-mono">Camera Sensor Interface</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="bg-white rounded-2xl shadow-xl p-12 aspect-video flex items-center justify-center border border-slate-100">
                     <span className="text-slate-400 font-mono">StrongBox KeyStore</span>
                  </div>
                   <div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-8">
                      <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">2. Sign</h2>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                      Before the file is saved, it is cryptographically signed using a private key stored in the device's secure hardware (TEE/StrongBox).
                    </p>
                     <ul className="space-y-4 text-lg text-slate-600">
                      <li className="flex gap-3">
                        <CheckCircle className="w-6 h-6 text-blue-500 mt-0.5" />
                        Private keys never leave the hardware
                      </li>
                      <li className="flex gap-3">
                         <CheckCircle className="w-6 h-6 text-blue-500 mt-0.5" />
                         Signatures include time and location
                      </li>
                    </ul>
                  </div>
                </div>

                 {/* Step 3 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                   <div className="order-2 md:order-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-8">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">3. Verify</h2>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                      When media is uploaded, our verification server checks the cryptographic signature against the device's public key and validates the chain of trust.
                    </p>
                     <ul className="space-y-4 text-lg text-slate-600">
                      <li className="flex gap-3">
                        <CheckCircle className="w-6 h-6 text-purple-500 mt-0.5" />
                        Detects single-bit alterations
                      </li>
                      <li className="flex gap-3">
                         <CheckCircle className="w-6 h-6 text-purple-500 mt-0.5" />
                         Confirms device integrity (attestation)
                      </li>
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 bg-white rounded-2xl shadow-xl p-12 aspect-video flex items-center justify-center border border-slate-100">
                     <span className="text-slate-400 font-mono">Server Verification Logic</span>
                  </div>
                </div>

                 {/* Step 4 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                   <div className="bg-white rounded-2xl shadow-xl p-12 aspect-video flex items-center justify-center border border-slate-100">
                     <span className="text-slate-400 font-mono">Evidence Package</span>
                  </div>
                   <div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-8">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">4. Prove</h2>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                      Successful verification generates an immutable evidence package (C2PA compliant) that serves as proof of authenticity for third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section bg-slate-900 text-white text-center py-24">
            <div className="container mx-auto px-4">
               <h2 className="text-4xl font-bold mb-6">Ready to secure your media pipeline?</h2>
               <Link href="/dashboard" className="inline-flex items-center justify-center h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                  Start Building
               </Link>
            </div>
          </section>

          <SiteFooter />
        </main>
      </div>
    </>
  );
}

