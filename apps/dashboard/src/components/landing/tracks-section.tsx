'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

export function TracksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Paths animate from 0 to 1 as we scroll
  const pathLength = useTransform(smoothProgress, [0.1, 0.5], [0, 1]);
  
  // Bars grow up from the bottom as the path finishes
  const barScale = useTransform(smoothProgress, [0.45, 0.65], [0, 1]);

  return (
    <section className="track section py-24 bg-[#F8FAF0] relative overflow-hidden" ref={containerRef}>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            The internet lost its ability to trust images
          </h2>
          <p className="text-xl text-slate-600">
             Without cryptographic proof, every digital interaction is suspect.
          </p>
        </div>
        
        <div className="tracks_container relative h-[800px] w-full">
          {/* Text Labels Overlay - Positioned to match the tracks roughly */}
          <div className="tracks_middle absolute inset-0 z-10 flex flex-col justify-start pt-24 items-center gap-16 pointer-events-none">
             {/* We can position these more specifically if needed, but centering them is a safe bet for now */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl px-4">
                <div className="text-center">
                    <h3 className="h6 font-bold text-lg text-slate-800 bg-white/90 backdrop-blur p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    AI-generated images are indistinguishable from reality
                    </h3>
                </div>
                <div className="text-center mt-12 md:mt-0">
                    <h3 className="h6 font-bold text-lg text-slate-800 bg-white/90 backdrop-blur p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    Metadata can be spoofed, making location and time unreliable
                    </h3>
                </div>
                <div className="text-center">
                    <h3 className="h6 font-bold text-lg text-slate-800 bg-white/90 backdrop-blur p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    Courts, insurers, and media have no reliable proof
                    </h3>
                </div>
                <div className="text-center mt-12 md:mt-0">
                    <h3 className="h6 font-bold text-lg text-slate-800 bg-white/90 backdrop-blur p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    Traditional verification methods are too slow and expensive
                    </h3>
                </div>
            </div>
          </div>

          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 1478" fill="none" className="u-events-none absolute top-0 left-0 w-full h-full" preserveAspectRatio="xMidYMax meet">
            {/* 
               User Provided SVG Paths 
               Note: We use currentColor for strokes to control them via CSS classes if needed, 
               but here we hardcode the PoPC colors (Emerald for good, Rose for bad/alert)
            */}
            
            {/* Dashed Paths */}
            <motion.path style={{ pathLength }} d="M430 166V259.611C430 302.154 456.917 340.039 497.09 354.04L896.91 493.383C937.083 507.384 964 545.27 964 587.813V741C964 776.07 992.43 804.5 1027.5 804.5H1440" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="text-emerald-500" />
            <motion.path style={{ pathLength }} d="M946.5 179V273.897C946.5 315.809 920.364 353.274 881.029 367.746L541.471 492.677C502.136 507.149 476 544.614 476 586.526V691V767.5C476 822.728 431.228 867.5 376 867.5H0" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="text-emerald-500" />
            
            {/* The Red Path (Center/Problem) */}
            <motion.path style={{ pathLength }} d="M1013 206V315.552C1013 326.771 1011.11 337.909 1007.42 348.502L907.084 635.998C903.388 646.591 901.5 657.729 901.5 668.948V1109.5C901.5 1164.73 856.728 1209.5 801.5 1209.5H753.5C698.272 1209.5 653.5 1254.27 653.5 1309.5V1367" stroke="#F43F5E" strokeWidth="2" strokeDasharray="6 6" className="text-rose-500" />
            
            <motion.path style={{ pathLength }} d="M882 195V288.411C882 306.881 887.115 324.99 896.779 340.731L1021.22 543.427C1030.88 559.168 1036 577.277 1036 595.747V791.735C1036 829.713 1066.79 860.5 1104.76 860.5H1440" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="text-emerald-500" />
            <motion.path style={{ pathLength }} d="M557 188V288.567C557 306.939 551.939 324.956 542.372 340.64L418.628 543.518C409.061 559.203 404 577.219 404 595.591V691.735V810C404 865.228 359.228 910 304 910H0" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="text-emerald-500" />

            {/* Static "Nodes" or "Connectors" on the paths */}
            <path d="M456.202 698.5L495.767 698.5L495.767 691.5L456.202 691.5L456.202 698.5Z" stroke="#064E3B" className="text-emerald-900"/>
            <path d="M475.217 697.485L475.217 692.523L476.754 692.523L476.754 697.485L475.217 697.485Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M497.961 696.977L497.961 693.027L500 693.027L500 696.977L497.961 696.977Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M452 696.977L452 693.027L454.039 693.027L454.039 696.977L452 696.977Z" fill="#064E3B" className="text-emerald-900"/>
            
            <path d="M384.202 698.5L423.767 698.5L423.767 691.5L384.202 691.5L384.202 698.5Z" stroke="#064E3B" className="text-emerald-900"/>
            <path d="M403.217 697.485L403.217 692.523L404.754 692.523L404.754 697.485L403.217 697.485Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M425.961 696.977L425.961 693.027L428 693.027L428 696.977L425.961 696.977Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M380 696.977L380 693.027L382.039 693.027L382.039 696.977L380 696.977Z" fill="#064E3B" className="text-emerald-900"/>

            {/* Right side nodes */}
            <path d="M944.202 698.496L983.767 698.496L983.767 691.496L944.202 691.496L944.202 698.496Z" stroke="#064E3B" className="text-emerald-900"/>
            <path d="M963.217 697.482L963.217 692.52L964.754 692.52L964.754 697.482L963.217 697.482Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M985.961 696.973L985.961 693.023L988 693.023L988 696.973L985.961 696.973Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M940 696.973L940 693.023L942.039 693.023L942.039 696.973L940 696.973Z" fill="#064E3B" className="text-emerald-900"/>

            <path d="M1016.2 698.496L1055.77 698.496L1055.77 691.496L1016.2 691.496L1016.2 698.496Z" stroke="#064E3B" className="text-emerald-900"/>
            <path d="M1035.22 697.482L1035.22 692.52L1036.75 692.52L1036.75 697.482L1035.22 697.482Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M1057.96 696.973L1057.96 693.023L1060 693.023L1060 696.973L1057.96 696.973Z" fill="#064E3B" className="text-emerald-900"/>
            <path d="M1012 696.973L1012 693.023L1014.04 693.023L1014.04 696.973L1012 696.973Z" fill="#064E3B" className="text-emerald-900"/>


            {/* Bottom Blocks (The "City" or "Data Centers") */}
            <rect x="615" y="1367" width="20" height="111" fill="currentColor" className="text-slate-300"/>
            <path d="M743.789 1367H765L721.211 1478H700L743.789 1367Z" fill="currentColor" className="text-slate-300"/>
            <path d="M773.789 1367H795L751.211 1478H730L773.789 1367Z" fill="currentColor" className="text-slate-300"/>
            <rect x="671" y="1367" width="20" height="111" fill="currentColor" className="text-slate-300"/>
            <path d="M803.789 1367H825L781.211 1478H760L803.789 1367Z" fill="currentColor" className="text-slate-300"/>

            {/* Right Group of Blocks */}
            <g className="track_bottom-right">
              <rect width="595" height="111" transform="matrix(1,0,0,1,845,1367)" fill="#E2E8F0"/> {/* slate-200 */}
              <path d="M869.5 1402.57V1442.4H1084.07V1402.57H869.5Z" stroke="#94A3B8"/>
              <path d="M974.23 1421.71H979.335V1423.26H974.23V1421.71Z" fill="#94A3B8"/>
              <path d="M922.866 1444.6H1030.7V1446.65H922.866V1444.6Z" fill="#94A3B8"/>
              <path d="M922.866 1398.34H1030.7V1400.4H922.866V1398.34Z" fill="#94A3B8"/>
              {/* ... simplified rest of the blocks for performance, or include full detail if critical ... */}
              <path d="M1105.07 1402.57V1442.4H1152.1V1402.57H1105.07Z" stroke="#94A3B8"/>
              {/* Add more building details here if needed */}
            </g>

             {/* Left Group of Blocks */}
            <g className="track_bottom-left">
              <rect width="595" height="111" transform="matrix(-1,0,0,1,595,1367)" fill="#E2E8F0"/>
               {/* Mirrored blocks */}
              <path d="M570.5 1402.57V1442.4H355.933V1402.57H570.5Z" stroke="#94A3B8"/>
            </g>

            {/* The Floating Blocks (Connectors at top) */}
            <rect x="140.5" y="55.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="128.5" y="98.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="180.5" y="55.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            {/* ... more top blocks ... */}
            <rect x="344.5" y="13.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="353.5" y="55.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="428.5" y="14.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="520.5" y="55.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="752.5" y="5.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="897.5" y="12.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>
            <rect x="1212.5" y="14.5" width="19" height="110" fill="#E2E8F0" stroke="#94A3B8"/>

            {/* ANIMATED BARS - The "Payloads" moving or growing */}
            {/* Green Bar 1 */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'bottom' }} x="547.5" y="77.5" width="19" height="110" fill="#6EE7B7" stroke="#94A3B8" transform="matrix(-1,0,0,-1,1114,320.5)" />
            
            {/* Red Bar (The threat/problem) */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'bottom' }} x="1003" y="94" width="20" height="111" fill="#F43F5E" transform="matrix(-1,0,0,-1,2026,355.5)" />
            
            {/* Green Bar 2 */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'bottom' }} x="936.5" y="68.5" width="19" height="110" fill="#6EE7B7" stroke="#94A3B8" transform="matrix(-1,0,0,-1,1892.5,302.5)" />
            
             {/* Green Bar 3 */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'bottom' }} x="420.5" y="55.5" width="19" height="110" fill="#6EE7B7" stroke="#94A3B8" transform="matrix(-1,0,0,-1,860,276.5)" />
            
             {/* Green Bar 4 */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'bottom' }} x="872.5" y="84.5" width="19" height="110" fill="#6EE7B7" stroke="#94A3B8" transform="matrix(-1,0,0,-1,1764,334.5)" />

          </svg>
        </div>
      </div>
    </section>
  );
}
