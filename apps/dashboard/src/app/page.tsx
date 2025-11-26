'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Lock, FileCheck, ChevronRight, Smartphone, Server, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <ShieldCheck className="h-6 w-6 mr-2" />
          <span className="font-bold">PoPC</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
            How it Works
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Proof of Physical Capture
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Cryptographically verifiable photos and videos. Eliminate deepfakes and fraud with hardware-backed provenance.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-x-4"
              >
                <Button asChild className="bg-white text-black hover:bg-gray-200">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white">
                  <Link href="#how-it-works">Learn More</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Built for Trust</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 md:text-xl">
                A complete verification stack from silicon to server.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <Smartphone className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Hardware Attestation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Keys generated in StrongBox/TEE. Images signed on-device. Impossible to spoof without physical access.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <FileCheck className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">C2PA Compliant</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Standardized manifests embedded directly into files. Compatible with Adobe, Microsoft, and BBC tools.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <Lock className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Tamper Evident</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Any pixel modification invalidates the cryptographic signature. Detect edits instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
             <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
            </div>
            <div className="relative grid gap-8 md:grid-cols-3 items-start">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-10"></div>
              
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-black text-white text-2xl font-bold border-8 border-white">
                  1
                </div>
                <h3 className="text-xl font-bold">Capture</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  User takes a photo or video using the PoPC SDK. Hardware key signs the pixel data immediately.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                 <div className="flex items-center justify-center w-24 h-24 rounded-full bg-black text-white text-2xl font-bold border-8 border-white">
                  2
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Signed media is uploaded to your server. The API verifies the signature and certificate chain.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                 <div className="flex items-center justify-center w-24 h-24 rounded-full bg-black text-white text-2xl font-bold border-8 border-white">
                  3
                </div>
                <h3 className="text-xl font-bold">Verify</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Consumer apps show a "Verified" badge. Auditors can inspect the C2PA manifest.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 px-10 md:gap-16 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-black text-white px-3 py-1 text-sm">
                  Use Cases
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Trusted by Industries
                </h2>
                <ul className="grid gap-4">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-semibold">Insurance Claims</span> - Prevent fraudulent damage photos.
                  </li>
                  <li className="flex items-center gap-2">
                     <ChevronRight className="h-4 w-4" />
                    <span className="font-semibold">Journalism</span> - Prove authenticity of citizen reporting.
                  </li>
                  <li className="flex items-center gap-2">
                     <ChevronRight className="h-4 w-4" />
                    <span className="font-semibold">Logistics</span> - Verify delivery condition and location.
                  </li>
                   <li className="flex items-center gap-2">
                     <ChevronRight className="h-4 w-4" />
                    <span className="font-semibold">KYC/Identity</span> - Ensure ID documents are captured live.
                  </li>
                </ul>
                 <div className="pt-4">
                  <Button asChild size="lg">
                    <Link href="/dashboard">Try the Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[400px] aspect-[3/4] bg-white rounded-2xl shadow-2xl border p-4 rotate-3 transform transition-transform hover:rotate-0">
                   {/* Mock Phone UI */}
                   <div className="h-full w-full bg-gray-100 rounded-xl overflow-hidden relative">
                      <div className="absolute top-4 left-4 right-4 h-8 bg-black/10 rounded-full z-10"></div>
                      <div className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t">
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                           <ShieldCheck className="h-5 w-5" />
                           <span>Verified Capture</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Signed by Samsung Galaxy S23</p>
                        <p className="text-xs text-gray-500">Nov 25, 2025 • 10:42 AM</p>
                      </div>
                      {/* Placeholder Image */}
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400">
                         <Camera className="h-16 w-16" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 PoPC Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
