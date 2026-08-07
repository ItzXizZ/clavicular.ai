'use client';

import { motion } from 'framer-motion';

interface BeforeAfterRevealProps {
  beforeImage: string | null;
  afterImage: string | null;
  isLocked: boolean;
  isLoading?: boolean;
  onUnlock: () => void;
  ctaLabel?: string;
  compact?: boolean;
  hideCta?: boolean;
  /** Cleaner platform styling: no heavy card chrome, smaller frames */
  platform?: boolean;
}

export default function BeforeAfterReveal({
  beforeImage,
  afterImage,
  isLocked,
  isLoading = false,
  onUnlock,
  ctaLabel = 'TO COMPLETELY TRANSFORM YOUR FACE',
  compact = false,
  hideCta = false,
  platform = false,
}: BeforeAfterRevealProps) {
  if (platform) {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-3">
          Transformation
        </p>
        <div className="grid grid-cols-2 gap-2">
          <figure className="relative aspect-[3/4] overflow-hidden bg-white/5">
            {beforeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                Before
              </div>
            )}
            <figcaption className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white/80">
              Before
            </figcaption>
          </figure>

          <figure className="relative aspect-[3/4] overflow-hidden bg-white/5">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="w-4 h-4 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-white/40">Generating</span>
              </div>
            ) : afterImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={afterImage}
                alt="After"
                className={`w-full h-full object-cover ${isLocked ? 'blur-xl scale-105' : ''}`}
              />
            ) : beforeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={beforeImage}
                alt="After preview"
                className="w-full h-full object-cover blur-xl brightness-75 scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                After
              </div>
            )}
            <figcaption className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-[#22c55e]">
              After
            </figcaption>
            {isLocked && (
              <button
                type="button"
                onClick={onUnlock}
                className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] font-medium text-white hover:bg-black/65"
              >
                Unlock
              </button>
            )}
          </figure>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-white/15 bg-black overflow-hidden ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>
          Your Transformation
        </p>
        {isLocked && (
          <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium">
            Locked
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div
          className={`relative overflow-hidden bg-black border border-white/10 ${
            compact ? 'aspect-square' : 'aspect-[3/4]'
          }`}
        >
          {beforeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
              Before
            </div>
          )}
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 text-[9px] text-white font-medium">
            BEFORE
          </span>
        </div>

        <div
          className={`relative overflow-hidden bg-black border border-white/10 ${
            compact ? 'aspect-square' : 'aspect-[3/4]'
          }`}
        >
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-white/50">Generating...</span>
            </div>
          ) : afterImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={afterImage}
              alt="After"
              className={`w-full h-full object-cover ${isLocked ? 'blur-xl scale-105' : ''}`}
            />
          ) : beforeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={beforeImage}
              alt="After preview"
              className="w-full h-full object-cover blur-xl brightness-75 scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
              After
            </div>
          )}
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#22c55e] text-[9px] text-black font-semibold">
            AFTER
          </span>
          {isLocked && (
            <button
              type="button"
              onClick={onUnlock}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 hover:bg-black/60 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-[9px] font-semibold text-white/90 uppercase tracking-wide">
                Unlock after
              </span>
            </button>
          )}
        </div>
      </div>

      {isLocked && !hideCta && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUnlock}
          className={`w-full mt-2.5 font-bold uppercase tracking-wide bg-[#22c55e] hover:bg-white text-black transition-colors ${
            compact ? 'py-2 text-[10px]' : 'py-2.5 text-xs'
          }`}
        >
          {ctaLabel}
        </motion.button>
      )}
    </div>
  );
}
