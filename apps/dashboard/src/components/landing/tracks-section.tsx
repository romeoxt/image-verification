'use client';

import { motion, useScroll, useTransform, useSpring, type Variants } from 'framer-motion';
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

  const pathLength = useTransform(smoothProgress, [0.1, 0.6], [0, 1]);
  const barScale = useTransform(smoothProgress, [0.3, 0.7], [0, 1]);

  return (
    <section className="track section u-pb-0" ref={containerRef}>
      <div className="u-vflex-stretch-top u-vgap-64-24">
        <div className="w-layout-blockcontainer container w-container mx-auto px-4">
          <div className="row row-center-horizontal">
            <div className="col col-lg-8">
              <h2 className="u-align-center text-4xl font-bold text-center mb-12">
                The internet lost its ability to trust images
              </h2>
            </div>
          </div>
        </div>
        
        <div className="tracks_container relative" style={{ height: '800px', width: '100%', overflow: 'hidden' }}>
          {/* Text Labels Overlay */}
          <div className="tracks_middle absolute inset-0 z-10 flex flex-col justify-center items-center gap-12 pointer-events-none">
            <h3 className="h6 font-bold text-xl text-center max-w-md bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              AI-generated images are indistinguishable from reality
            </h3>
            <h3 className="h6 font-bold text-xl text-center max-w-md bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              Metadata can be spoofed, making location and time unreliable
            </h3>
            <h3 className="h6 font-bold text-xl text-center max-w-md bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              Courts, insurers, and media have no reliable proof of authenticity
            </h3>
            <h3 className="h6 font-bold text-xl text-center max-w-md bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              Traditional verification methods are too slow and expensive
            </h3>
          </div>

          {/* SVG Tracks */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="100%" 
            height="100%" 
            viewBox="0 0 1440 1478" 
            fill="none" 
            className="u-events-none absolute top-0 left-0 w-full h-full"
            preserveAspectRatio="xMidYMin slice"
          >
            {/* Animated Paths linked to Scroll */}
            <motion.path style={{ pathLength }} d="M430 166V259.611C430 302.154 456.917 340.039 497.09 354.04L896.91 493.383C937.083 507.384 964 545.27 964 587.813V741C964 776.07 992.43 804.5 1027.5 804.5H1440" stroke="#B5B9A6" strokeWidth="2" strokeDasharray="4 4" id="green-path-1" />
            <motion.path style={{ pathLength }} d="M946.5 179V273.897C946.5 315.809 920.364 353.274 881.029 367.746L541.471 492.677C502.136 507.149 476 544.614 476 586.526V691V767.5C476 822.728 431.228 867.5 376 867.5H0" stroke="#B5B9A6" strokeWidth="2" strokeDasharray="4 4" id="green-path-4" />
            <motion.path style={{ pathLength }} d="M1013 206V315.552C1013 326.771 1011.11 337.909 1007.42 348.502L907.084 635.998C903.388 646.591 901.5 657.729 901.5 668.948V1109.5C901.5 1164.73 856.728 1209.5 801.5 1209.5H753.5C698.272 1209.5 653.5 1254.27 653.5 1309.5V1367" stroke="#B5B9A6" strokeWidth="2" strokeDasharray="4 4" id="red-path" />
            <motion.path style={{ pathLength }} d="M882 195V288.411C882 306.881 887.115 324.99 896.779 340.731L1021.22 543.427C1030.88 559.168 1036 577.277 1036 595.747V791.735C1036 829.713 1066.79 860.5 1104.76 860.5H1440" stroke="#B5B9A6" strokeWidth="2" strokeDasharray="4 4" id="green-path-3" />
            <motion.path style={{ pathLength }} d="M557 188V288.567C557 306.939 551.939 324.956 542.372 340.64L418.628 543.518C409.061 559.203 404 577.219 404 595.591V691.735V810C404 865.228 359.228 910 304 910H0" stroke="#B5B9A6" strokeWidth="2" strokeDasharray="4 4" id="green-path-2" />
            
            {/* Plugs/Joints - Keep static or simple fade in */}
            <path d="M456.202 698.5L495.767 698.5L495.767 691.5L456.202 691.5L456.202 698.5Z" stroke="#072C2C" strokeWidth="1" />
            <path d="M475.217 697.485L475.217 692.523L476.754 692.523L476.754 697.485L475.217 697.485Z" fill="#072C2C" />
            <path d="M497.961 696.977L497.961 693.027L500 693.027L500 696.977L497.961 696.977Z" fill="#072C2C" />
            <path d="M452 696.977L452 693.027L454.039 693.027L454.039 696.977L452 696.977Z" fill="#072C2C" />
            
            <path d="M384.202 698.5L423.767 698.5L423.767 691.5L384.202 691.5L384.202 698.5Z" stroke="#072C2C" strokeWidth="1" />
            <path d="M403.217 697.485L403.217 692.523L404.754 692.523L404.754 697.485L403.217 697.485Z" fill="#072C2C" />
            <path d="M425.961 696.977L425.961 693.027L428 693.027L428 696.977L425.961 696.977Z" fill="#072C2C" />
            <path d="M380 696.977L380 693.027L382.039 693.027L382.039 696.977L380 696.977Z" fill="#072C2C" />

            <path d="M944.202 698.496L983.767 698.496L983.767 691.496L944.202 691.496L944.202 698.496Z" stroke="#072C2C" strokeWidth="1" />
            <path d="M963.217 697.482L963.217 692.52L964.754 692.52L964.754 697.482L963.217 697.482Z" fill="#072C2C" />
            <path d="M985.961 696.973L985.961 693.023L988 693.023L988 696.973L985.961 696.973Z" fill="#072C2C" />
            <path d="M940 696.973L940 693.023L942.039 693.023L942.039 696.973L940 696.973Z" fill="#072C2C" />

            <path d="M1016.2 698.496L1055.77 698.496L1055.77 691.496L1016.2 691.496L1016.2 698.496Z" stroke="#072C2C" strokeWidth="1" />
            <path d="M1035.22 697.482L1035.22 692.52L1036.75 692.52L1036.75 697.482L1035.22 697.482Z" fill="#072C2C" />
            <path d="M1057.96 696.973L1057.96 693.023L1060 693.023L1060 696.973L1057.96 696.973Z" fill="#072C2C" />
            <path d="M1012 696.973L1012 693.023L1014.04 693.023L1014.04 696.973L1012 696.973Z" fill="#072C2C" />

            {/* Falling Bars (Animated via Framer Scroll) */}
            <rect x="615" y="1367" width="20" height="111" fill="#E6E6D1" />
            <path d="M743.789 1367H765L721.211 1478H700L743.789 1367Z" fill="#E6E6D1" />
            <path d="M773.789 1367H795L751.211 1478H730L773.789 1367Z" fill="#E6E6D1" />
            <rect x="671" y="1367" width="20" height="111" fill="#E6E6D1" />
            <path d="M803.789 1367H825L781.211 1478H760L803.789 1367Z" fill="#E6E6D1" />
            
            {/* Top Connectors */}
            <rect x="140.5" y="55.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            <rect x="128.5" y="98.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            <rect x="180.5" y="55.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            <rect x="210.5" y="55.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            <rect x="240.5" y="55.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            <rect x="308.5" y="55.5" width="19" height="110" fill="#E6E6D1" stroke="#B5B9A6" />
            
            {/* Green Success Bars (indicating verified flow) */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="547.5" y="77.5" width="19" height="110" fill="#D0FFA8" stroke="#B5B9A6" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="936.5" y="68.5" width="19" height="110" fill="#D0FFA8" stroke="#B5B9A6" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="420.5" y="55.5" width="19" height="110" fill="#D0FFA8" stroke="#B5B9A6" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="872.5" y="84.5" width="19" height="110" fill="#D0FFA8" stroke="#B5B9A6" />
            
            {/* Red Error Bar (indicating tampering/rejection) */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="1003" y="94" width="20" height="111" fill="#FF5F02" />

          </svg>
        </div>
      </div>
    </section>
  );
}
