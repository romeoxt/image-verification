'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="hero section u-theme-dark u-overflow-hidden relative bg-slate-900 text-white py-32 overflow-hidden">
        {/* Animated Background Lines */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <motion.path 
                    d="M147.44 0.25V821.75H0.25V0.25H147.44Z" 
                    stroke="currentColor" 
                    strokeWidth="0.5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path 
                    d="M336.05 0.25V821.75H188.859V0.25H336.05Z" 
                    stroke="currentColor" 
                    strokeWidth="0.5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.path 
                    d="M524.647 0.25V821.75H377.457V0.25H524.647Z" 
                    stroke="currentColor" 
                    strokeWidth="0.5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.4 }}
                />
                {/* Diagonal lines */}
                <motion.path 
                    d="M1513.6 0.25L1163.27 821.598" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                />
                <motion.path 
                    d="M1312.83 0.25L962.493 821.598" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.6 }}
                />
                <motion.path 
                    d="M1112.23 0.25L761.896 821.598" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.7 }}
                />
            </svg>
        </div>

        <div className="w-layout-blockcontainer container u-z-index-2 w-container relative z-10 mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 transform translate-y-[-10%]">
            <div className="flex-1 max-w-3xl">
                <div className="space-y-6">
                <motion.h1 
                    className="hero_h1 text-5xl md:text-7xl font-bold leading-tight tracking-tight"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    Trust what you see.<br />Verify what is <span className="text-emerald-500">real</span>.
                </motion.h1>
                <motion.p 
                    className="p-xl u-color-secondary text-xl text-slate-400 max-w-xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                >
                    PoPC cryptographically verifies that photos and videos were captured by a real device, at a real place and time.
                </motion.p>
                </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Link href="/dashboard" className="btn-primary w-inline-block group bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg pl-6 pr-12 py-4 relative overflow-hidden transition-all">
                        <div aria-label="" className="btn cc-primary font-bold text-lg">
                            <div>Start Verifying</div>
                        </div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                </motion.div>
            </div>
            </div>
        </div>
    </section>
  );
}

