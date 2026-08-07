'use client';

import { motion } from 'framer-motion';
import ProductScreenshots from '@/components/ProductScreenshots';
import HeroLeaderboard from '@/components/HeroLeaderboard';
import { SUBSCRIPTION_PRICING } from '@/lib/subscription';

interface MarketingLandingProps {
  onStartScan: () => void;
  onStartTrial: () => void;
}

const FEATURES = [
  {
    title: 'AI face rating',
    body: '478-point landmark scan. Harmony, angularity, dimorphism, and where you rank.',
  },
  {
    title: 'Softmax & Hardmax',
    body: 'Skincare, grooming, and higher-impact paths prioritized by what moves your score.',
  },
  {
    title: 'Fashion advice',
    body: 'Full-body and wardrobe photos → fits and pieces matched to your skin tone.',
  },
  {
    title: 'Physique suggestions',
    body: 'Leanmaxxing and training that frame the face, not copy-paste gym advice.',
  },
  {
    title: 'AI before / after',
    body: 'See the future-self transform before you commit to the protocol.',
  },
  {
    title: 'Beauty Bot',
    body: 'Ask follow-ups, get product links, request a new look on demand.',
  },
] as const;

export default function MarketingLanding({ onStartScan, onStartTrial }: MarketingLandingProps) {
  return (
    <div className="w-full">
      {/* Hero — brand over dimmed scrollable top-100 leaderboard */}
      <section className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden bg-black">
        <HeroLeaderboard />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-20 pt-28 text-center pointer-events-none">
          <div className="pointer-events-auto">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-4"
          >
            Clavicular<span className="text-[#22c55e]">.AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto leading-relaxed mb-8"
          >
            Face rating, fashion, physique, and a protocol built to close the gap.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={onStartScan}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#22c55e] hover:bg-white text-black text-sm font-bold rounded-xl transition-colors"
            >
              Rate your face free
            </button>
            <button
              type="button"
              onClick={onStartTrial}
              className="w-full sm:w-auto px-8 py-3.5 border border-white/25 hover:border-[#22c55e] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Start {SUBSCRIPTION_PRICING.trialDays}-day free trial
            </button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-5 text-[11px] text-white/35"
          >
            Free scan · no card required · Premium unlocks the full protocol
          </motion.p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-white/10 bg-black">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.08), transparent)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
            className="max-w-xl mb-12 mx-auto text-center sm:mx-0 sm:text-left"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Everything that moves the score
            </h2>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed">
              One platform from first scan to Softmax, Hardmax, style, and physique, so users
              stay and convert.
            </p>
          </motion.div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="text-center sm:text-left"
              >
                <p className="text-[#22c55e] text-[11px] font-semibold tabular-nums mb-2">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product screenshots */}
      <section className="border-t border-white/10 bg-[#0c0c0f]">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              The view that sells the upgrade
            </h2>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed">
              Recommendations, fashion, and physique: what Premium looks like after the free
              scan.
            </p>
          </motion.div>
          <ProductScreenshots />
        </div>
      </section>

      {/* Transform sample + CTA */}
      <section className="border-t border-white/10 bg-black">
        <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-white/15"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/transformation.png"
                alt="Sample before and after facial transformation result"
                className="w-full aspect-[16/10] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 bg-black/60 px-2 py-0.5 rounded">
                  Before
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-black bg-[#22c55e] px-2 py-0.5 rounded">
                  After · sample
                </span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                See the after. Then earn it.
              </h2>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-8 mx-auto lg:mx-0 max-w-md">
                Free scan shows where you stand. Premium unlocks AI future-self, fashion, physique,
                and the full protocol. {SUBSCRIPTION_PRICING.trialDays}-day trial on yearly.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={onStartScan}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#22c55e] hover:bg-white text-black text-sm font-bold rounded-xl transition-colors"
                >
                  Get your free rating
                </button>
                <button
                  type="button"
                  onClick={onStartTrial}
                  className="w-full sm:w-auto px-7 py-3.5 border border-white/25 hover:border-white/50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Unlock Premium trial
                </button>
              </div>
              <p className="mt-4 text-[11px] text-white/30">
                Yearly {SUBSCRIPTION_PRICING.yearly.label} after trial · or{' '}
                {SUBSCRIPTION_PRICING.monthly.label} · cancel anytime
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bridge into live scan */}
      <div className="border-t border-white/10 bg-black px-6 pt-16 pb-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#22c55e] font-semibold mb-3">
          Start here
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Point the camera. Get the number.
        </h2>
        <p className="text-sm text-white/45 max-w-md mx-auto">
          Your face rated in seconds. Then unlock fashion, physique, and the protocol.
        </p>
      </div>
    </div>
  );
}
