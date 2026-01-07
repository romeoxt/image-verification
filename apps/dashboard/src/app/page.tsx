import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Lock, Terminal, Activity, FileCheck, AlertTriangle, Scale, Newspaper, Briefcase, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* 1. Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-xl tracking-tight">PoPC</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-emerald-600 transition-colors" href="#how-it-works">
            How It Works
          </Link>
          <Link className="text-sm font-medium hover:text-emerald-600 transition-colors" href="#use-cases">
            Use Cases
          </Link>
          <Link className="text-sm font-medium hover:text-emerald-600 transition-colors" href="https://github.com/romeoxt/image-verification">
            Docs
          </Link>
          <div className="hidden sm:flex gap-2">
            <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Log In</Link>
          </Button>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/dashboard">Get Started</Link>
          </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-slate-950 text-white relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center space-y-8 text-center">
                    <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Trusted Media Verification
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto">
                        Proof that a photo was taken in the <span className="text-emerald-500">real world</span>.
                    </h1>
                    <p className="mx-auto max-w-[800px] text-slate-400 md:text-xl leading-relaxed">
                        PoPC cryptographically verifies that photos and videos were captured by a real device, at a real place and time, and were never altered.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center pt-4">
                        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
                            <Link href="/dashboard">Request Demo</Link>
                </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-slate-700 hover:bg-slate-800 hover:text-white text-slate-300">
                            <Link href="#how-it-works">How It Works</Link>
                </Button>
                </div>
            </div>
          </div>
        </section>

        {/* 3. The Problem */}
        <section className="w-full py-20 bg-muted/40 dark:bg-muted/10">
            <div className="container px-4 md:px-6">
                <div className="grid gap-12 lg:grid-cols-3">
                    <div className="flex flex-col items-start space-y-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                            <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold">AI is Indistinguishable</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Generative AI can create photorealistic events that never happened. The human eye can no longer tell the difference.
                        </p>
                    </div>
                    <div className="flex flex-col items-start space-y-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold">Metadata is Worthless</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            EXIF data (GPS, time) is easily spoofed. Anyone can edit a file's location to be anywhere on earth.
                        </p>
              </div>
                    <div className="flex flex-col items-start space-y-4">
                        <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-xl">
                            <FileCheck className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              </div>
                        <h3 className="text-xl font-bold">Trust is Broken</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Courts, insurers, and media platforms have no reliable way to verify digital evidence. PoPC restores that trust.
                        </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How It Works */}
        <section id="how-it-works" className="w-full py-20 md:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How PoPC Works</h2>
                    <p className="max-w-[700px] text-slate-500 dark:text-slate-400 md:text-xl">
                        A chain of custody from the camera sensor to the final verification.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-4 relative">
                     {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

                    <div className="flex flex-col items-center text-center space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-4 border-white dark:border-slate-950">
                            <Camera className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                        <h3 className="text-xl font-bold">1. Capture</h3>
                        <p className="text-sm text-slate-500">Secure camera app captures photo/video directly from hardware.</p>
              </div>
              
                    <div className="flex flex-col items-center text-center space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-4 border-white dark:border-slate-950">
                            <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold">2. Sign</h3>
                        <p className="text-sm text-slate-500">Hardware-backed key (StrongBox) signs media immediately.</p>
                </div>

                    <div className="flex flex-col items-center text-center space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-4 border-white dark:border-slate-950">
                            <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                        <h3 className="text-xl font-bold">3. Verify</h3>
                        <p className="text-sm text-slate-500">Backend validates integrity, origin, and checks for edits.</p>
              </div>
              
                    <div className="flex flex-col items-center text-center space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-4 border-white dark:border-slate-950">
                            <FileCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                        <h3 className="text-xl font-bold">4. Prove</h3>
                        <p className="text-sm text-slate-500">Immutable evidence package is created for court or audit.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Trust Moat Comparison */}
        <section className="w-full py-20 bg-muted/40 dark:bg-muted/10">
             <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter">Why PoPC is Different</h2>
                    <p className="text-slate-500">Metadata and watermarks aren't enough. You need cryptography.</p>
                </div>
                
                <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="p-4 font-semibold">Feature</th>
                                <th className="p-4 font-bold text-emerald-600 dark:text-emerald-400">PoPC</th>
                                <th className="p-4 font-medium text-slate-500">Metadata (EXIF)</th>
                                <th className="p-4 font-medium text-slate-500">Watermarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr>
                                <td className="p-4 font-medium">Tamper-Proof</td>
                                <td className="p-4 text-emerald-600">✔ Yes</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Hardware-Backed</td>
                                <td className="p-4 text-emerald-600">✔ Yes</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Court-Ready</td>
                                <td className="p-4 text-emerald-600">✔ Yes</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">AI-Resistant</td>
                                <td className="p-4 text-emerald-600">✔ Yes</td>
                                <td className="p-4 text-slate-500">✖ No</td>
                                <td className="p-4 text-slate-500">Partial</td>
                            </tr>
                        </tbody>
                    </table>
            </div>
          </div>
        </section>

        {/* 6. Use Cases */}
        <section id="use-cases" className="w-full py-20 md:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter mb-12 text-center">Built For Critical Evidence</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                        <Newspaper className="h-10 w-10 text-emerald-600 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Journalism</h3>
                        <p className="text-slate-500 text-sm">Prove photos from conflict zones are real. Defend credibility against fake news accusations.</p>
                    </div>
                    <div className="flex flex-col p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                        <Briefcase className="h-10 w-10 text-emerald-600 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Insurance</h3>
                        <p className="text-slate-500 text-sm">Eliminate AI-generated claims. Reduce fraud by verifying accident scene photos instantly.</p>
            </div>
                    <div className="flex flex-col p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                        <Scale className="h-10 w-10 text-emerald-600 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Legal</h3>
                        <p className="text-slate-500 text-sm">Authenticate digital evidence for court. Establish a cryptographic chain of custody.</p>
              </div>
                    <div className="flex flex-col p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                        <Globe className="h-10 w-10 text-emerald-600 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Platforms</h3>
                        <p className="text-slate-500 text-sm">Flag fake content at upload. Restore user trust in marketplace listings and news feeds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Final CTA */}
        <section className="w-full py-20 bg-slate-950 text-white text-center">
            <div className="container px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
                    Restore Trust in Digital Media
                </h2>
                <p className="mx-auto max-w-[600px] text-slate-400 mb-10 text-lg">
                    If evidence matters, PoPC is the standard.
            </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8">
                        <Link href="/dashboard">Request Demo</Link>
              </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 border-slate-700 hover:bg-slate-800 text-slate-300">
                         <Link href="mailto:contact@popc.dev">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-8 border-t bg-background">
            <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500">© 2026 PoPC. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link className="text-sm text-slate-500 hover:underline" href="#">Privacy</Link>
                    <Link className="text-sm text-slate-500 hover:underline" href="#">Terms</Link>
                    <Link className="text-sm text-slate-500 hover:underline" href="#">Contact</Link>
                </div>
            </div>
        </footer>
      </main>
    </div>
  );
}
