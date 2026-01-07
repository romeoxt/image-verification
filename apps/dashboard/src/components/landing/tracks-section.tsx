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

          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 1478" fill="none" className="u-events-none absolute top-0 left-0 w-full h-full text-slate-300 dark:text-slate-700" preserveAspectRatio="xMidYMin slice">
             {/* Main Paths */}
            <motion.path style={{ pathLength }} d="M430 166V259.611C430 302.154 456.917 340.039 497.09 354.04L896.91 493.383C937.083 507.384 964 545.27 964 587.813V741C964 776.07 992.43 804.5 1027.5 804.5H1440" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" id="green-path-1" />
            <motion.path style={{ pathLength }} d="M946.5 179V273.897C946.5 315.809 920.364 353.274 881.029 367.746L541.471 492.677C502.136 507.149 476 544.614 476 586.526V691V767.5C476 822.728 431.228 867.5 376 867.5H0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" id="green-path-4" />
            <motion.path style={{ pathLength }} d="M1013 206V315.552C1013 326.771 1011.11 337.909 1007.42 348.502L907.084 635.998C903.388 646.591 901.5 657.729 901.5 668.948V1109.5C901.5 1164.73 856.728 1209.5 801.5 1209.5H753.5C698.272 1209.5 653.5 1254.27 653.5 1309.5V1367" className="text-rose-500 stroke-current" strokeWidth="2" strokeDasharray="4 4" id="red-path" />
            <motion.path style={{ pathLength }} d="M882 195V288.411C882 306.881 887.115 324.99 896.779 340.731L1021.22 543.427C1030.88 559.168 1036 577.277 1036 595.747V791.735C1036 829.713 1066.79 860.5 1104.76 860.5H1440" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" id="green-path-3" />
            <motion.path style={{ pathLength }} d="M557 188V288.567C557 306.939 551.939 324.956 542.372 340.64L418.628 543.518C409.061 559.203 404 577.219 404 595.591V691.735V810C404 865.228 359.228 910 304 910H0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" id="green-path-2" />

            {/* Static Elements */}
            <path d="M456.202 698.5L495.767 698.5L495.767 691.5L456.202 691.5L456.202 698.5Z" className="stroke-slate-700 dark:stroke-slate-300" />
            <path d="M475.217 697.485L475.217 692.523L476.754 692.523L476.754 697.485L475.217 697.485Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M497.961 696.977L497.961 693.027L500 693.027L500 696.977L497.961 696.977Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M452 696.977L452 693.027L454.039 693.027L454.039 696.977L452 696.977Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M384.202 698.5L423.767 698.5L423.767 691.5L384.202 691.5L384.202 698.5Z" className="stroke-slate-700 dark:stroke-slate-300" />
            <path d="M403.217 697.485L403.217 692.523L404.754 692.523L404.754 697.485L403.217 697.485Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M425.961 696.977L425.961 693.027L428 693.027L428 696.977L425.961 696.977Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M380 696.977L380 693.027L382.039 693.027L382.039 696.977L380 696.977Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M944.202 698.496L983.767 698.496L983.767 691.496L944.202 691.496L944.202 698.496Z" className="stroke-slate-700 dark:stroke-slate-300" />
            <path d="M963.217 697.482L963.217 692.52L964.754 692.52L964.754 697.482L963.217 697.482Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M985.961 696.973L985.961 693.023L988 693.023L988 696.973L985.961 696.973Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M940 696.973L940 693.023L942.039 693.023L942.039 696.973L940 696.973Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M1016.2 698.496L1055.77 698.496L1055.77 691.496L1016.2 691.496L1016.2 698.496Z" className="stroke-slate-700 dark:stroke-slate-300" />
            <path d="M1035.22 697.482L1035.22 692.52L1036.75 692.52L1036.75 697.482L1035.22 697.482Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M1057.96 696.973L1057.96 693.023L1060 693.023L1060 696.973L1057.96 696.973Z" className="fill-slate-700 dark:fill-slate-300" />
            <path d="M1012 696.973L1012 693.023L1014.04 693.023L1014.04 696.973L1012 696.973Z" className="fill-slate-700 dark:fill-slate-300" />

            <rect x="615" y="1367" width="20" height="111" className="fill-slate-200 dark:fill-slate-800" />
            <path d="M743.789 1367H765L721.211 1478H700L743.789 1367Z" className="fill-slate-200 dark:fill-slate-800" />
            <path d="M773.789 1367H795L751.211 1478H730L773.789 1367Z" className="fill-slate-200 dark:fill-slate-800" />
            <rect x="671" y="1367" width="20" height="111" className="fill-slate-200 dark:fill-slate-800" />
            <path d="M803.789 1367H825L781.211 1478H760L803.789 1367Z" className="fill-slate-200 dark:fill-slate-800" />

            <g clipPath="url(#clip0_21898_215)">
              <rect width="595" height="111" transform="matrix(1,0,0,1,845,1367)" className="fill-slate-100 dark:fill-slate-800" />
              <path d="M869.5 1402.57V1442.4H1084.07V1402.57H869.5Z" stroke="currentColor" />
              <path d="M974.23 1421.71H979.335V1423.26H974.23V1421.71Z" fill="currentColor" />
              <path d="M922.866 1444.6H1030.7V1446.65H922.866V1444.6Z" fill="currentColor" />
              <path d="M922.866 1398.34H1030.7V1400.4H922.866V1398.34Z" fill="currentColor" />
              <path d="M1105.07 1402.57V1442.4H1152.1V1402.57H1105.07Z" stroke="currentColor" />
              <path d="M1126.03 1421.71H1131.13V1423.26H1126.03V1421.71Z" fill="currentColor" />
              <path d="M1116.65 1444.6H1140.62V1446.65H1116.65V1444.6Z" fill="currentColor" />
              <path d="M1116.65 1398.34H1140.62V1400.4H1116.65V1398.34Z" fill="currentColor" />
              <path d="M1173.2 1402.57V1442.4H1177.2V1402.57H1173.2Z" stroke="currentColor" />
              <path d="M1172.6 1421.71H1177.7V1423.26H1172.6V1421.71Z" fill="currentColor" />
              <path d="M1173.95 1444.6H1176.45V1446.65H1173.95V1444.6Z" fill="currentColor" />
              <path d="M1173.95 1398.34H1176.45V1400.4H1173.95V1398.34Z" fill="currentColor" />
              <path d="M1198.2 1402.57V1442.4H1206.16V1402.57H1198.2Z" stroke="currentColor" />
              <path d="M1199.68 1421.71H1204.79V1423.26H1199.68V1421.71Z" fill="currentColor" />
              <path d="M1200 1444.6H1204.48V1446.65H1200V1444.6Z" fill="currentColor" />
              <path d="M1200 1398.34H1204.48V1400.4H1200V1398.34Z" fill="currentColor" />
              <path d="M1227.16 1402.57V1442.4H1241.79V1402.57H1227.16Z" stroke="currentColor" />
              <path d="M1231.98 1421.71H1237.08V1423.26H1231.98V1421.71Z" fill="currentColor" />
              <path d="M1230.62 1444.6H1238.44V1446.65H1230.62V1444.6Z" fill="currentColor" />
              <path d="M1230.63 1398.34H1238.44V1400.4H1230.63V1398.34Z" fill="currentColor" />
              <path d="M1262.79 1402.57V1442.4H1274.19V1402.57H1262.79Z" stroke="currentColor" />
              <path d="M1265.94 1421.71H1271.04V1423.26H1265.94V1421.71Z" fill="currentColor" />
              <path d="M1265.31 1444.6H1271.57V1446.65H1265.31V1444.6Z" fill="currentColor" />
              <path d="M1265.31 1398.34H1271.57V1400.4H1265.31V1398.34Z" fill="currentColor" />
              <path d="M1295.19 1402.57V1442.4H1323.88V1402.57H1295.19Z" stroke="currentColor" />
              <path d="M1306.98 1421.71H1312.09V1423.26H1306.98V1421.71Z" fill="currentColor" />
              <path d="M1302.09 1444.6H1316.99V1446.65H1302.09V1444.6Z" fill="currentColor" />
              <path d="M1302.09 1398.34H1316.99V1400.4H1302.09V1398.34Z" fill="currentColor" />
              <path d="M1344.88 1402.57V1442.4H1363.16V1402.57H1344.88Z" stroke="currentColor" />
              <path d="M1351.47 1421.71H1356.57V1423.26H1351.47V1421.71Z" fill="currentColor" />
              <path d="M1349.28 1444.6H1358.87V1446.65H1349.28V1444.6Z" fill="currentColor" />
              <path d="M1349.28 1398.34H1358.87V1400.4H1349.28V1398.34Z" fill="currentColor" />
              <path d="M1384.16 1402.57V1442.4H1407.75V1402.57H1384.16Z" stroke="currentColor" />
              <path d="M1393.45 1421.71H1398.56V1423.26H1393.45V1421.71Z" fill="currentColor" />
              <path d="M1389.81 1444.6H1402.1V1446.65H1389.81V1444.6Z" fill="currentColor" />
              <path d="M1389.81 1398.34H1402.1V1400.4H1389.81V1398.34Z" fill="currentColor" />
              <path d="M1428.75 1402.57V1442.4H1459.84V1402.57H1428.75Z" stroke="currentColor" />
              <path d="M1436.27 1444.6H1452.32V1446.65H1436.27V1444.6Z" fill="currentColor" />
              <path d="M1436.27 1398.34H1452.32V1400.4H1436.27V1398.34Z" fill="currentColor" />
            </g>

            <g clipPath="url(#clip1_21898_215)">
              <rect width="595" height="111" transform="matrix(-1,0,0,1,595,1367)" className="fill-slate-100 dark:fill-slate-800" />
              <path d="M570.5 1402.57V1442.4H355.933V1402.57H570.5Z" stroke="currentColor" />
              <path d="M465.77 1421.71H460.665V1423.26H465.77V1421.71Z" fill="currentColor" />
              <path d="M517.134 1444.6H409.298V1446.65H517.134V1444.6Z" fill="currentColor" />
              <path d="M517.134 1398.34H409.298V1400.4H517.134V1398.34Z" fill="currentColor" />
              <path d="M334.933 1402.57V1442.4H287.901V1402.57H334.933Z" stroke="currentColor" />
              <path d="M313.971 1421.71H308.866V1423.26H313.971V1421.71Z" fill="currentColor" />
              <path d="M323.345 1444.6H299.382V1446.65H323.345V1444.6Z" fill="currentColor" />
              <path d="M323.347 1398.34H299.384V1400.4H323.347V1398.34Z" fill="currentColor" />
              <path d="M266.797 1402.57V1442.4H262.796V1402.57H266.797Z" stroke="currentColor" />
              <path d="M267.402 1421.71H262.296V1423.26H267.402V1421.71Z" fill="currentColor" />
              <path d="M266.047 1444.6H263.546V1446.65H266.047V1444.6Z" fill="currentColor" />
              <path d="M266.047 1398.34H263.546V1400.4H266.047V1398.34Z" fill="currentColor" />
              <path d="M241.795 1402.57V1442.4H233.835V1402.57H241.795Z" stroke="currentColor" />
              <path d="M240.318 1421.71H235.212V1423.26H240.318V1421.71Z" fill="currentColor" />
              <path d="M240.003 1444.6H235.523V1446.65H240.003V1444.6Z" fill="currentColor" />
              <path d="M240.003 1398.34H235.523V1400.4H240.003V1398.34Z" fill="currentColor" />
              <path d="M212.835 1402.57V1442.4H198.208V1402.57H212.835Z" stroke="currentColor" />
              <path d="M208.022 1421.71H202.917V1423.26H208.022V1421.71Z" fill="currentColor" />
              <path d="M209.377 1444.6H201.563V1446.65H209.377V1444.6Z" fill="currentColor" />
              <path d="M209.373 1398.34H201.559V1400.4H209.373V1398.34Z" fill="currentColor" />
              <path d="M177.208 1402.57V1442.4H165.809V1402.57H177.208Z" stroke="currentColor" />
              <path d="M174.063 1421.71H168.958V1423.26H174.063V1421.71Z" fill="currentColor" />
              <path d="M174.686 1444.6H168.434V1446.65H174.686V1444.6Z" fill="currentColor" />
              <path d="M174.686 1398.34H168.434V1400.4H174.686V1398.34Z" fill="currentColor" />
              <path d="M144.809 1402.57V1442.4H116.115V1402.57H144.809Z" stroke="currentColor" />
              <path d="M133.015 1421.71H127.91V1423.26H133.015V1421.71Z" fill="currentColor" />
              <path d="M137.911 1444.6H123.012V1446.65H137.911V1444.6Z" fill="currentColor" />
              <path d="M137.911 1398.34H123.012V1400.4H137.911V1398.34Z" fill="currentColor" />
              <path d="M95.1157 1402.57V1442.4H76.8403V1402.57H95.1157Z" stroke="currentColor" />
              <path d="M88.5316 1421.71H83.4263V1423.26H88.5316V1421.71Z" fill="currentColor" />
              <path d="M90.7169 1444.6H81.1313V1446.65H90.7169V1444.6Z" fill="currentColor" />
              <path d="M90.7169 1398.34H81.1313V1400.4H90.7169V1398.34Z" fill="currentColor" />
              <path d="M55.8403 1402.57V1442.4H32.2515V1402.57H55.8403Z" stroke="currentColor" />
              <path d="M46.5461 1421.71H41.4409V1423.26H46.5461V1421.71Z" fill="currentColor" />
              <path d="M50.1943 1444.6H37.8999V1446.65H50.1943V1444.6Z" fill="currentColor" />
              <path d="M50.1904 1398.34H37.896V1400.4H50.1904V1398.34Z" fill="currentColor" />
              <path d="M11.251 1402.57V1442.4H-19.8389V1402.57H11.251Z" stroke="currentColor" />
              <path d="M3.72964 1444.6H-12.3154V1446.65H3.72964V1444.6Z" fill="currentColor" />
              <path d="M3.72964 1398.34H-12.3154V1400.4H3.72964V1398.34Z" fill="currentColor" />
            </g>

            <rect x="140.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="128.5" y="98.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="180.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="210.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="240.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="171.5" y="42.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="308.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="284.5" y="45.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="296.5" y="86.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="344.5" y="13.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="353.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="380.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="392.5" y="70.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="428.5" y="14.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="460.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="490.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="460.5" y="86.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="520.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />

            {/* Bars with Animations */}
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="547.5" y="77.5" width="19" height="110" className="fill-emerald-400 stroke-slate-300" transform="matrix(-1,0,0,-1,1114,320.5)" />
            <rect x="497.5" y="0.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="580.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="588.5" y="42.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="620.5" y="35.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="643.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="678.5" y="75.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="700.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="689.5" y="67.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="731.5" y="91.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="818.5" y="35.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="780.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="752.5" y="5.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="812.5" y="67.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="840.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="880.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="897.5" y="12.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="944.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="980.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="976.5" y="45.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1040.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1028.5" y="68.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1080.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1090.5" y="45.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1140.5" y="35.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1117.5" y="62.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1180.5" y="65.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1212.5" y="14.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1220.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="1003" y="94" width="20" height="111" className="fill-rose-500" transform="matrix(-1,0,0,-1,2026,355.5)" />
            <rect x="1260.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <rect x="1297.5" y="55.5" width="19" height="110" className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="936.5" y="68.5" width="19" height="110" className="fill-emerald-400 stroke-slate-300" transform="matrix(-1,0,0,-1,1892.5,302.5)" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="420.5" y="55.5" width="19" height="110" className="fill-emerald-400 stroke-slate-300" transform="matrix(-1,0,0,-1,860,276.5)" />
            <motion.rect style={{ scaleY: barScale, transformOrigin: 'top' }} x="872.5" y="84.5" width="19" height="110" className="fill-emerald-400 stroke-slate-300" transform="matrix(-1,0,0,-1,1764,334.5)" />
          </svg>
        </div>
      </div>
    </section>
  );
}
