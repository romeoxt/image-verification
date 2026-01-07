import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Lock, FileCheck, Activity, AlertTriangle, Newspaper, Briefcase, Scale, Globe, ArrowRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAF0] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-slate-200/60 bg-[#F8FAF0]/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="bg-slate-900 text-white p-1 rounded-md group-hover:bg-emerald-600 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-slate-900">PoPC</span>
        </Link>
        <nav className="ml-auto flex gap-6 sm:gap-10 items-center">
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="#how-it-works">
            How It Works
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="#use-cases">
            Use Cases
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="https://github.com/romeoxt/image-verification">
            Developers
          </Link>
          <div className="hidden sm:flex gap-3">
            <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <Link href="/dashboard">Log In</Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-emerald-600 text-white shadow-sm transition-all duration-300">
                <Link href="/dashboard">Get Started <ArrowRight className="ml-2 h-3 w-3" /></Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 bg-[#F8FAF0] relative overflow-hidden">
             {/* Subtle Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="container px-4 md:px-6 relative z-10 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Now available in beta
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                    Trust what you see.<br/>
                    <span className="text-emerald-600">Verify what is real.</span>
                </h1>
                
                <p className="mx-auto max-w-2xl text-slate-600 md:text-xl leading-relaxed mb-10">
                    PoPC adds a cryptographic layer of trust to digital media. Verify the origin, time, and integrity of photos and videos instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild size="lg" className="h-14 px-8 text-base bg-slate-900 hover:bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                        <Link href="/dashboard">Start Verifying</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full shadow-sm">
                        <Link href="mailto:contact@popc.dev">Contact Sales</Link>
                    </Button>
                </div>

                <div className="mt-20 pt-10 border-t border-slate-200/60 flex flex-col items-center">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">Built for integrity-critical industries</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
                        {/* Logos would go here - using text placeholders for now matching the clean style */}
                        <span className="text-xl font-bold text-slate-400">INSURANCE</span>
                        <span className="text-xl font-bold text-slate-400">NEWS</span>
                        <span className="text-xl font-bold text-slate-400">LEGAL</span>
                        <span className="text-xl font-bold text-slate-400">ARCHIVE</span>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. The Problem */}
        <section className="w-full py-24 bg-white border-t border-slate-100">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                <div className="grid gap-16 lg:grid-cols-3">
                    <div className="space-y-4">
                        <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                            <Activity className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">AI is Indistinguishable</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Generative AI can create photorealistic events that never happened. The human eye is no longer a reliable detector of truth.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="h-12 w-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Metadata is Worthless</h3>
                        <p className="text-slate-600 leading-relaxed">
                            EXIF data like GPS and timestamps are easily spoofed. Anyone can edit a file's location to be anywhere on earth in seconds.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                            <FileCheck className="h-6 w-6 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Trust is Broken</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Courts, insurers, and media platforms have no reliable way to verify digital evidence. PoPC restores that trust with math, not opinion.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. How It Works */}
        <section id="how-it-works" className="w-full py-24 bg-[#F8FAF0] border-t border-slate-100">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                <div className="mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">A chain of custody.<br/>Unbroken.</h2>
                    <p className="max-w-xl text-slate-600 text-lg">
                        From the photon hitting the sensor to the pixel on your screen, we secure every step of the journey.
                    </p>
                </div>

                <div className="grid gap-12 md:grid-cols-4 relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-slate-200 -z-10"></div>

                    {[
                        { icon: Camera, title: "1. Capture", desc: "Secure app captures media directly from hardware sensors." },
                        { icon: Lock, title: "2. Sign", desc: "Hardware-backed key signs the data immediately on-device." },
                        { icon: ShieldCheck, title: "3. Verify", desc: "Backend validates the cryptographic signature and origin." },
                        { icon: FileCheck, title: "4. Prove", desc: "Generate an immutable evidence package for audit." }
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-start bg-[#F8FAF0] pr-4">
                            <div className="h-16 w-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm z-10">
                                <step.icon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* 5. Comparison */}
        <section className="w-full py-24 bg-white border-t border-slate-100">
             <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Why PoPC is Different</h2>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm md:text-base">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 font-semibold text-slate-900">Feature</th>
                                <th className="p-6 font-bold text-emerald-700 bg-emerald-50/50">PoPC</th>
                                <th className="p-6 font-medium text-slate-500">Metadata (EXIF)</th>
                                <th className="p-6 font-medium text-slate-500">Watermarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                { label: "Tamper-Proof", popc: true, meta: false, water: false },
                                { label: "Hardware-Backed", popc: true, meta: false, water: false },
                                { label: "Court-Ready", popc: true, meta: false, water: false },
                                { label: "AI-Resistant", popc: true, meta: false, water: "Partial" }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 font-medium text-slate-900">{row.label}</td>
                                    <td className="p-6 text-emerald-700 font-semibold bg-emerald-50/30">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4" /> Yes
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-400">{row.meta ? "Yes" : "No"}</td>
                                    <td className="p-6 text-slate-400">{row.water === "Partial" ? "Partial" : (row.water ? "Yes" : "No")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        {/* 6. Use Cases */}
        <section id="use-cases" className="w-full py-24 bg-[#F8FAF0] border-t border-slate-100">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-16 text-slate-900">Built for critical evidence</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { icon: Newspaper, title: "Journalism", desc: "Prove photos from conflict zones are real. Defend credibility." },
                        { icon: Briefcase, title: "Insurance", desc: "Eliminate AI claims. Verify accident scenes instantly." },
                        { icon: Scale, title: "Legal", desc: "Authenticate digital evidence for court. Establish chain of custody." },
                        { icon: Globe, title: "Platforms", desc: "Flag fake content at upload. Restore user trust." }
                    ].map((card, i) => (
                        <div key={i} className="flex flex-col p-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <card.icon className="h-10 w-10 text-emerald-600 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* 7. Final CTA */}
        <section className="w-full py-32 bg-slate-900 text-white text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
            <div className="container px-4 md:px-6 relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
                    Restore Trust in Digital Media
                </h2>
                <p className="mx-auto max-w-xl text-slate-400 mb-12 text-lg">
                    If evidence matters, PoPC is the standard. Start verifying today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="h-14 px-10 text-base bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium">
                        <Link href="/dashboard">Get Started Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-10 text-base border-slate-700 bg-transparent hover:bg-slate-800 text-white rounded-full">
                         <Link href="mailto:contact@popc.dev">Talk to Sales</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 bg-[#F8FAF0] border-t border-slate-200">
            <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 text-white p-1 rounded-sm">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-slate-900">PoPC</span>
                </div>
                <p className="text-sm text-slate-500">© 2026 Proof of Physical Capture. All rights reserved.</p>
                <div className="flex gap-8">
                    <Link className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">Privacy</Link>
                    <Link className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">Terms</Link>
                    <Link className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">Contact</Link>
                </div>
            </div>
        </footer>
      </main>
    </div>
  );
}
