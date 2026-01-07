'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

const tabs = [
  {
    id: 0,
    title: "1. Capture",
    description: "Secure camera app captures media directly from hardware sensors.",
    lottieUrl: "https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/691ce4f0e3b9190e110e359c_8f6b8d382f17fb6b82c9fee0aa08fa77_Vooma%20-%20Animation%201.json"
  },
  {
    id: 1,
    title: "2. Sign",
    description: "Hardware-backed key signs the data immediately on-device.",
    lottieUrl: "https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/691ce4f061dda993dae89a30_4060ea6f4b7bdbe2fd55ce23788fe8d5_Vooma%20-%20Animation%202.json"
  },
  {
    id: 2,
    title: "3. Verify",
    description: "Backend validates the cryptographic signature and origin.",
    lottieUrl: "https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/691ce4f0b3211c8ab2551da1_9b0afe685e71fd03191ac31251fbeff4_Vooma%20-%20Animation%203.json"
  },
  {
    id: 3,
    title: "4. Prove",
    description: "Generate an immutable evidence package for audit.",
    lottieUrl: "https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/691ce4f068737019d7816909_adcef3f8b5e2b5dced6381416bf6e76f_Vooma%20-%20Animation%204.json"
  }
];

export function TabsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [animationData, setAnimationData] = useState<any>(null);

  // Auto-rotate tabs
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 5000); // Switch every 5 seconds
    return () => clearInterval(timer);
  }, []);

  // Fetch Lottie JSON
  useEffect(() => {
    const fetchLottie = async () => {
      try {
        const response = await fetch(tabs[activeTab].lottieUrl);
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error("Failed to load Lottie animation", error);
      }
    };
    fetchLottie();
  }, [activeTab]);

  return (
    <section className="home_product section u-theme-dark bg-slate-900 text-white py-24">
      <div className="w-layout-blockcontainer tab_container container w-container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
          <div className="flex flex-col justify-between h-full z-10 relative">
            <div className="space-y-6 mb-12">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                PRODUCT
              </h2>
              <p className="text-3xl md:text-4xl font-bold leading-tight">
                A complete chain of custody from sensor to cloud
              </p>
            </div>
            
            <div role="tablist" className="flex flex-col gap-4">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer group relative p-4 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-slate-800 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-xl font-semibold transition-colors ${
                        activeTab === tab.id ? 'text-white' : 'text-slate-400'
                    }`}>
                      {tab.title}
                    </h2>
                  </div>
                  
                  <motion.div
                    initial={false}
                    animate={{ height: activeTab === tab.id ? "auto" : 0, opacity: activeTab === tab.id ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-slate-400 text-base pb-2">
                      {tab.description}
                    </p>
                  </motion.div>

                  {/* Progress Bar for Active Tab */}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-b-lg" 
                         style={{ 
                           width: '100%',
                           animation: 'progress 5s linear' 
                         }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[400px] lg:h-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
             <AnimatePresence mode='wait'>
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center p-8"
                >
                    {animationData && (
                        <Lottie 
                            animationData={animationData} 
                            loop={true} 
                            className="w-full h-full max-w-md"
                        />
                    )}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}

