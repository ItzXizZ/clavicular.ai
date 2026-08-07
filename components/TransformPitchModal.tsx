'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TransformPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCta: () => void;
}

const POINTS = [
  'AI visions of your future face before you commit to anything',
  'Personalized Softmax + Hardmax protocol, style & makeup picks',
  'Top surgical recommendations matched to your exact face shape',
];

export default function TransformPitchModal({
  isOpen,
  onClose,
  onCta,
}: TransformPitchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-md bg-black border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
          >
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
                  After
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Completely transform yourself
                </h3>
                <p className="text-sm text-white/55 mt-2 leading-snug">
                  The world&apos;s most comprehensive full protocol. Softmax, Hardmax,
                  fashion, physique, skincare, and AI before/after in one system.
                </p>
              </div>

              <ul className="space-y-2">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[13px] text-white/80">
                    <span className="text-[#22c55e] font-bold mt-0.5">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onCta}
                className="w-full py-3.5 bg-[#22c55e] hover:bg-white text-black text-sm font-bold rounded-xl transition-colors"
              >
                Start 7-day free trial
              </button>
              <p className="text-center text-[11px] text-white/40">
                Yearly includes trial · then $399/yr · or $50/mo
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
