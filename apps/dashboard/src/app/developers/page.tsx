import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import Link from "next/link";
import { Terminal, Code, Github } from "lucide-react";

export default function DevelopersPage() {
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
                     <h1 className="hero_h1 text-white">Build on Truth</h1>
                     <p className="p-xl u-color-secondary text-slate-400">
                       Integrate PoPC verification into your platform with a few lines of code.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          <section className="section bg-[#F8FAF0]">
            <div className="w-layout-blockcontainer container w-container">
              
              <div className="grid lg:grid-cols-2 gap-16">
                <div>
                   <h2 className="text-3xl font-bold mb-6">Simple Integration</h2>
                   <p className="text-lg text-slate-600 mb-8">
                     Our REST API makes it easy to verify assets. Send the file and the manifest, and get back a verdict instantly.
                   </p>
                   
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="bg-white p-3 rounded-lg shadow-sm h-fit">
                            <Terminal className="w-6 h-6 text-slate-900" />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold">Standard REST API</h3>
                            <p className="text-slate-500">Works with any language or framework.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="bg-white p-3 rounded-lg shadow-sm h-fit">
                            <Code className="w-6 h-6 text-slate-900" />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold">Mobile SDKs</h3>
                            <p className="text-slate-500">Native Android and iOS libraries for secure capture.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="bg-white p-3 rounded-lg shadow-sm h-fit">
                            <Github className="w-6 h-6 text-slate-900" />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold">Open Source</h3>
                            <p className="text-slate-500">Inspect the core logic on GitHub.</p>
                         </div>
                      </div>
                   </div>

                   <div className="mt-12">
                      <Link href="https://github.com/romeoxt/image-verification" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
                         View Documentation &rarr;
                      </Link>
                   </div>
                </div>

                {/* Code Sample */}
                <div className="bg-slate-900 rounded-xl p-6 shadow-2xl overflow-hidden font-mono text-sm">
                   <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-2 text-slate-500 text-xs">verify-request.js</span>
                   </div>
                   <pre className="text-slate-300 overflow-x-auto">
{`const response = await fetch('https://api.popc.dev/v1/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <YOUR_API_KEY>',
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});

const result = await response.json();
console.log(result);

// Response:
{
  "verdict": "verified",
  "confidence": 100,
  "reasons": [
    "Signature valid",
    "Hardware attestation present"
  ],
  "deviceId": "dev_android_..."
}`}
                   </pre>
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

