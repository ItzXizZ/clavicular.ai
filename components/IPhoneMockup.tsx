'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
      {/* iPhone frame container */}
      <div className="relative w-[280px] h-[570px]">
        {/* iPhone PNG frame */}
        <Image
          src="/iPhone 17.png"
          alt="iPhone frame"
          width={280}
          height={570}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          priority
        />
        
        {/* Screen content area - positioned to match the PNG's screen */}
        <div 
          className="absolute bg-black overflow-hidden"
          style={{
            top: '1.6%',
            left: '4.3%',
            right: '4.3%',
            bottom: '1.6%',
            borderRadius: '40px',
          }}
        >
          {/* Content wrapper with padding for dynamic island */}
          <div className="relative w-full h-full pt-8 pb-4 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
