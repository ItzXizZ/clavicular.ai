'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface IPhoneMockupProps {
  children: ReactNode;
}

export default function IPhoneMockup({ children }: IPhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* iPhone frame */}
      <div className="iphone-frame relative w-[280px] h-[570px] rounded-[45px] p-[10px] overflow-hidden">
        {/* Inner bezel */}
        <div className="absolute inset-[10px] rounded-[38px] bg-black overflow-hidden">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="notch w-[90px] h-[28px] flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-3 h-3 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            </div>
          </div>
          
          {/* Screen content */}
          <div className="relative w-full h-full bg-black pt-12 pb-6 overflow-hidden">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="w-[100px] h-[4px] bg-zinc-600 rounded-full" />
          </div>
        </div>
        
        {/* Side buttons */}
        <div className="absolute -left-[2px] top-[100px] w-[3px] h-[25px] bg-zinc-700 rounded-l-sm" />
        <div className="absolute -left-[2px] top-[145px] w-[3px] h-[45px] bg-zinc-700 rounded-l-sm" />
        <div className="absolute -left-[2px] top-[200px] w-[3px] h-[45px] bg-zinc-700 rounded-l-sm" />
        <div className="absolute -right-[2px] top-[160px] w-[3px] h-[70px] bg-zinc-700 rounded-r-sm" />
      </div>
    </motion.div>
  );
}

