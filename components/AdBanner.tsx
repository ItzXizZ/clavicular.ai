'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdFormat = 
  | 'banner'           // Standard 320x100 or responsive horizontal
  | 'rectangle'        // 300x250 medium rectangle  
  | 'leaderboard'      // 728x90 wide banner
  | 'native'           // In-feed native style
  | 'sticky-bottom';   // Sticky footer ad

interface AdBannerProps {
  format?: AdFormat;
  slot: string;        // Your AdSense ad slot ID
  className?: string;
  testMode?: boolean;  // Show placeholder in development
}

// Minimal, non-intrusive ad styling that matches the dark theme
export default function AdBanner({ 
  format = 'banner', 
  slot,
  className = '',
  testMode = process.env.NODE_ENV === 'development'
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (testMode) return;
    
    try {
      // Push the ad to render
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [testMode]);

  // Format-specific dimensions and styles
  const formatStyles: Record<AdFormat, { minHeight: string; maxWidth?: string }> = {
    'banner': { minHeight: '100px', maxWidth: '728px' },
    'rectangle': { minHeight: '250px', maxWidth: '300px' },
    'leaderboard': { minHeight: '90px', maxWidth: '728px' },
    'native': { minHeight: '120px' },
    'sticky-bottom': { minHeight: '50px' },
  };

  const styles = formatStyles[format];

  // Test/Development placeholder
  if (testMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative overflow-hidden rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/30 ${className}`}
        style={{ minHeight: styles.minHeight, maxWidth: styles.maxWidth }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Ad Space</p>
            <p className="text-[9px] text-zinc-700">{format} • {slot || 'test-slot'}</p>
          </div>
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/5 to-transparent" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: adLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: styles.minHeight, maxWidth: styles.maxWidth }}
    >
      {/* Subtle "Sponsored" label */}
      <div className="absolute top-1 left-2 z-10">
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest">Sponsored</span>
      </div>
      
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
        }}
        data-ad-client="ca-pub-5633162123365401"
        data-ad-slot={slot}
        data-ad-format={format === 'native' ? 'fluid' : 'auto'}
        data-full-width-responsive={format !== 'rectangle' ? 'true' : 'false'}
      />
    </motion.div>
  );
}

// Native-style in-feed ad for leaderboard
export function NativeAdCard({ slot, className = '' }: { slot: string; className?: string }) {
  const testMode = process.env.NODE_ENV === 'development';

  if (testMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900/50 border border-dashed border-zinc-700/30 ${className}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Sponsored</span>
          <span className="text-[9px] text-zinc-700 mt-1">Native Ad</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900/30 border border-zinc-800 ${className}`}
    >
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[8px] text-zinc-500 bg-black/50 px-1.5 py-0.5 rounded uppercase tracking-widest">Ad</span>
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-5633162123365401"
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
    </motion.div>
  );
}

// Sticky bottom banner - less intrusive than popups
export function StickyBottomAd({ slot, onClose }: { slot: string; onClose?: () => void }) {
  const [visible, setVisible] = useState(true);
  const testMode = process.env.NODE_ENV === 'development';

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
    // Remember dismissal for this session
    sessionStorage.setItem('stickyAdDismissed', 'true');
  };

  // Check if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('stickyAdDismissed') === 'true') {
      setVisible(false);
    }
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-zinc-800 backdrop-blur-lg"
    >
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300"
          aria-label="Close ad"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ad content */}
        <div className="flex-1">
          {testMode ? (
            <div className="h-[50px] flex items-center justify-center border border-dashed border-zinc-700/50 rounded-lg">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Sticky Banner Ad</span>
            </div>
          ) : (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', height: '50px' }}
              data-ad-client="ca-pub-5633162123365401"
              data-ad-slot={slot}
              data-ad-format="horizontal"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

