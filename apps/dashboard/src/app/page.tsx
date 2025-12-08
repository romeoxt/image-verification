'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Lock, Terminal, Package, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <ShieldCheck className="h-6 w-6 mr-2" />
          <span className="font-bold">PoPC</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="https://github.com/romeoxt/image-verification">
            Docs
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/verify">Try Demo</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Get API Key</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section - Developer-First */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-4 px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold dark:bg-blue-900/30 dark:text-blue-400"
              >
                Developer SDK
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl"
              >
                The easiest way to prove<br />a photo or video is real
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400"
              >
                A developer-first SDK built on C2PA, StrongBox, and hardware attestation.<br />
                Add trusted capture to any app in <span className="font-semibold">minutes</span>, not months.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mt-4"
              >
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/dashboard">
                    Get Started Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Link href="/verify">
                    Try Demo
                  </Link>
                </Button>
              </motion.div>

              {/* Quick Install Code Block */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 p-6 bg-gray-900 text-white rounded-lg text-left max-w-2xl w-full shadow-xl"
              >
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Terminal className="h-4 w-4" />
                  <span>Quick Start</span>
                </div>
                <code className="text-green-400 block mb-3">npm install @popc/node</code>
                <div className="text-sm text-gray-300 font-mono space-y-1">
                  <div><span className="text-blue-400">const</span> popc = <span className="text-blue-400">new</span> PoPC(&#123; apiKey: <span className="text-yellow-300">&apos;pk_...&apos;</span> &#125;);</div>
                  <div><span className="text-blue-400">const</span> result = <span className="text-blue-400">await</span> popc.verify(image, manifest);</div>
                  <div><span className="text-green-400">// &apos;verified&apos;, &apos;tampered&apos;, or &apos;invalid&apos;</span></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="w-full py-12 md:py-24 bg-black text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Think Stripe, Not Truepic</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div>
                <div className="text-4xl mb-4">✓</div>
                <div className="font-bold mb-2">Self-Serve</div>
                <div className="text-gray-400 text-sm">Sign up and go. No sales calls.</div>
              </div>
              <div>
                <div className="text-4xl mb-4">⚡</div>
                <div className="font-bold mb-2">10 Minutes</div>
                <div className="text-gray-400 text-sm">Not 6 months of custom integration.</div>
              </div>
              <div>
                <div className="text-4xl mb-4">$</div>
                <div className="font-bold mb-2">$19/month</div>
                <div className="text-gray-400 text-sm">Not enterprise contracts.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features - Developer Focused */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Three Core Features</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 md:text-xl">
                Everything you need. Nothing you don&apos;t.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-start space-y-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">1. Capture & Sign</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Hardware-backed signing with StrongBox/TEE. C2PA manifest packaging. Device attestation.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">popc.captureAndSign()</div>
                </div>
              </div>
              
              <div className="flex flex-col items-start space-y-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold">2. Verify Authenticity</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  One API endpoint. JSON response. Real or tampered in milliseconds.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">POST /v1/verify</div>
                </div>
              </div>
              
              <div className="flex flex-col items-start space-y-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Terminal className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold">3. Developer Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enrolled devices. Recent verifications. API key management. Usage analytics.
                </p>
                <div className="text-sm text-gray-500">
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/dashboard">View Dashboard →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases - Niche Focus */}
        <section className="w-full py-12 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Perfect For</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                (We don&apos;t do enterprise workflows. We do developer SDKs.)
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-3xl">💪</div>
                <div>
                  <div className="font-bold text-lg mb-1">Fitness Apps</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Verified before/after transformation photos. No more fake progress pics.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-3xl">🏠</div>
                <div>
                  <div className="font-bold text-lg mb-1">Marketplaces</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Verified item listing photos. Show &quot;Verified Photos ✓&quot; badge to build trust.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-3xl">🚚</div>
                <div>
                  <div className="font-bold text-lg mb-1">Delivery Apps</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Verified proof of completion photos. Eliminate delivery disputes.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-3xl">🎨</div>
                <div>
                  <div className="font-bold text-lg mb-1">Creator Platforms</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Verified original content. Prove photos weren&apos;t AI-generated.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Start free. Scale as you grow. No contracts.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Free */}
              <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="text-2xl font-bold mb-2">Free</div>
                <div className="text-3xl font-bold mb-4">$0<span className="text-base font-normal text-gray-600">/mo</span></div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> 100 verifications/mo</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Basic dashboard</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Community support</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Start Free</Link>
                </Button>
              </div>

              {/* Starter */}
              <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="text-2xl font-bold mb-2">Starter</div>
                <div className="text-3xl font-bold mb-4">$19<span className="text-base font-normal text-gray-600">/mo</span></div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> 1,000 verifications</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Android & Web SDK</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Email support</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </div>

              {/* Growth - Most Popular */}
              <div className="p-6 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800 shadow-md relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  MOST POPULAR
                </div>
                <div className="text-2xl font-bold mb-2">Growth</div>
                <div className="text-3xl font-bold mb-4">$79<span className="text-base font-normal text-gray-600">/mo</span></div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> 10,000 verifications</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Team dashboard</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Device revocation API</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Priority support</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </div>

              {/* Pro */}
              <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="text-2xl font-bold mb-2">Pro</div>
                <div className="text-3xl font-bold mb-4">$199<span className="text-base font-normal text-gray-600">/mo</span></div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> 50,000 verifications</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Audit logs</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Custom device types</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> SLA & phone support</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">Need more? <Link href="/dashboard" className="text-blue-600 hover:underline">Contact us</Link> for Enterprise pricing.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join developers building the future of verified media.<br />
              Install the SDK in under 10 minutes.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Link href="/dashboard">Get API Key</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white/10">
                <Link href="https://github.com/romeoxt/image-verification">View Docs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 PoPC. Built by developers, for developers.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="https://github.com/romeoxt/image-verification">
            GitHub
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
