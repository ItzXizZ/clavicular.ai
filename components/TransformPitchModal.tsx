'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SUBSCRIPTION_PRICING } from '@/lib/subscription';

interface TransformPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCta: () => void;
  /** Softer dismiss label when used as a recurring leaderboard pitch */
  dismissLabel?: string;
}

const POINTS = [
  'AI before/after of your future face',
  'Softmax + Hardmax protocol built for your scan',
  'Fashion, physique, skincare & Beauty Bot',
];

export default function TransformPitchModal({
  isOpen,
  onClose,
  onCta,
  dismissLabel = 'Not now',
}: TransformPitchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-md bg-black border border-white/15 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <span className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/transformation.png"
                alt="Before and after facial transformation"
                className="w-full aspect-[16/10] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/15 text-white/80 hover:text-white flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <span className="px-2 py-1 rounded bg-black/70 text-[10px] font-semibold text-white uppercase tracking-wide">
                  Before
                </span>
                <span className="px-2 py-1 rounded bg-[#22c55e] text-[10px] font-bold text-black uppercase tracking-wide ml-auto">
                  After · Premium
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#22c55e] font-semibold mb-1.5">
                  Clavicular Premium
                </p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Completely transform yourself
                </h3>
                <p className="text-sm text-white/55 mt-2 leading-snug">
                  Softmax, Hardmax, fashion, physique, and AI future-self — the full protocol after
                  your free scan.
                </p>
              </div>

              <ul className="space-y-2">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[13px] text-white/80">
                    <span className="text-[#22c55e] font-bold mt-0.5 shrink-0">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onCta}
                className="w-full py-3.5 bg-[#22c55e] hover:bg-white text-black text-sm font-bold rounded-xl transition-colors"
              >
                Start {SUBSCRIPTION_PRICING.trialDays}-day free trial
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-[12px] text-white/40 hover:text-white/70 transition-colors"
              >
                {dismissLabel}
              </button>
              <p className="text-center text-[11px] text-white/40 pb-1">
                Yearly includes trial · then {SUBSCRIPTION_PRICING.yearly.label} · or{' '}
                {SUBSCRIPTION_PRICING.monthly.label}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
