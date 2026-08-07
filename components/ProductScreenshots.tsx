'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Marketing “screenshots” of the Protocol hub — matches live product chrome. */

function Chrome({
  active,
  children,
}: {
  active: 'softmax' | 'fashion' | 'physique';
  children: ReactNode;
}) {
  const tabs = [
    { id: 'softmax', label: 'Softmax' },
    { id: 'hardmax', label: 'Hardmax' },
    { id: 'physique', label: 'Physique' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'advisor', label: 'Advisor' },
  ] as const;

  return (
    <div className="rounded-xl border border-white/15 bg-[#0c0c0f] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <p className="text-[11px] sm:text-xs font-semibold tracking-tight text-white/90">
          Clavicular <span className="text-[#22c55e]">Protocol</span>
        </p>
        <span className="text-[10px] text-white/25 w-10 text-right">AI</span>
      </div>
      <div className="flex gap-0.5 px-3 border-b border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`relative px-3 py-2 text-[11px] sm:text-xs whitespace-nowrap ${
              t.id === active ? 'text-white' : 'text-white/35'
            }`}
          >
            {t.label}
            {t.id === active && (
              <span className="absolute left-2 right-2 bottom-0 h-0.5 bg-[#22c55e]" />
            )}
          </div>
        ))}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function ProtocolShot() {
  const rows = [
    { title: 'Retinoid + barrier repair', issue: 'Uneven texture capping Harmony', impact: '+0.4' },
    { title: 'Mewing + tongue posture', issue: 'Soft jaw definition under Angularity', impact: '+0.3' },
    { title: 'Canthal tilt makeup map', issue: 'Eye area reads flatter on camera', impact: '+0.2' },
  ];

  return (
    <Chrome active="softmax">
      <div className="grid sm:grid-cols-[140px_1fr] gap-5">
        <aside className="space-y-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/35 mb-1">Overall</p>
            <p className="text-2xl font-semibold tabular-nums">
              <span className="text-[#22c55e]">6.8</span>
              <span className="text-white/30 text-sm font-normal"> / 10</span>
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">Above average</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/transformation.png"
              alt="Sample AI before and after transformation"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-[8px] font-semibold text-white/80">Before</span>
              <span className="text-[8px] font-bold text-[#22c55e]">AI After</span>
            </div>
          </div>
          <dl className="space-y-1.5 text-[11px]">
            {[
              ['Harmony', '7.1'],
              ['Angularity', '6.2'],
              ['Dimorphism', '6.9'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/5 pb-1">
                <dt className="text-white/40">{label}</dt>
                <dd className="tabular-nums text-white/80">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <div>
          <h3 className="text-sm sm:text-base font-semibold tracking-tight mb-1">Softmax protocol</h3>
          <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
            Non-invasive stack ranked by score impact, with products linked.
          </p>
          <ul className="space-y-0 divide-y divide-white/10">
            {rows.map((r) => (
              <li key={r.title} className="py-3 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs sm:text-sm font-medium text-white">{r.title}</p>
                  <span className="text-[10px] tabular-nums text-[#22c55e] shrink-0">{r.impact}</span>
                </div>
                <p className="text-[11px] text-white/40 mt-1">{r.issue}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Chrome>
  );
}

function FashionShot() {
  const items = [
    { name: 'Structured navy blazer', why: 'Sharpens shoulder line vs facial width', price: '$128' },
    { name: 'Warm-undertone knit', why: 'Matches detected olive / warm skin tone', price: '$54' },
    { name: 'Straight dark denim', why: 'Lengthens torso under camera angle', price: '$78' },
  ];

  return (
    <Chrome active="fashion">
      <div className="grid sm:grid-cols-[1fr_220px] gap-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold tracking-tight">Fashion</h3>
          <p className="text-[11px] text-white/40 mt-1 mb-4 leading-relaxed">
            Fit construction from full-body + wardrobe photos, skin-tone matched.
          </p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.name} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex justify-between gap-2">
                  <p className="text-xs sm:text-sm font-medium text-white">{item.name}</p>
                  <span className="text-[11px] text-[#22c55e] tabular-nums shrink-0">{item.price}</span>
                </div>
                <p className="text-[11px] text-white/40 mt-1">{item.why}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Fit previews</p>
          <div className="relative aspect-square overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/fashion-fits.png"
              alt="Sample navy and cream fit recommendations"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[10px] text-white/30">Detected undertone: warm / olive</p>
        </div>
      </div>
    </Chrome>
  );
}

function PhysiqueShot() {
  const tips = [
    { name: 'Clavicular / lateral raises', why: 'Wider delts frame the jaw on camera', tag: 'Train' },
    { name: 'Creatine monohydrate', why: 'Lean mass support tied to facial goals', tag: 'Stack' },
    { name: 'Sub-12% lean cut', why: 'Jaw and cheek definition unlock first', tag: 'Cut' },
  ];

  return (
    <Chrome active="physique">
      <div>
        <h3 className="text-sm sm:text-base font-semibold tracking-tight">Physique</h3>
        <p className="text-[11px] text-white/40 mt-1 mb-4 leading-relaxed max-w-md">
          Photo review that ties leanmaxxing and training to your face score, not generic gym
          tips.
        </p>
        <div className="grid sm:grid-cols-[1fr_1fr_1fr] gap-2 mb-4">
          <div className="relative aspect-[3/4] overflow-hidden border border-[#22c55e]/40 sm:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/physique-clavicular.webp"
              alt="Clavicular lean abs goal physique"
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute bottom-1 left-1 text-[8px] font-bold uppercase tracking-wide text-black bg-[#22c55e] px-1.5 py-0.5 rounded">
              Goal
            </span>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/physique-mogged.png"
              alt="Physique midriff goal"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/physique-lean.png"
              alt="Lean physique comparison"
              className="w-full h-full object-cover object-left"
            />
          </div>
        </div>
        <ul className="space-y-0 divide-y divide-white/10">
          {tips.map((t) => (
            <li key={t.name} className="py-3 first:pt-0 flex gap-3">
              <span className="text-[9px] uppercase tracking-wider text-[#22c55e] font-semibold w-10 shrink-0 pt-0.5">
                {t.tag}
              </span>
              <div>
                <p className="text-xs sm:text-sm font-medium text-white">{t.name}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{t.why}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Chrome>
  );
}

const SHOTS = [
  {
    id: 'protocol',
    label: 'Personalized protocol',
    caption: 'Softmax & Hardmax ranked by impact, with product links.',
    node: <ProtocolShot />,
  },
  {
    id: 'physique',
    label: 'Physique suggestions',
    caption: 'Clavicular lean abs first. Training and leanmaxxing for your face score.',
    node: <PhysiqueShot />,
  },
  {
    id: 'fashion',
    label: 'Fashion advice',
    caption: 'Wardrobe + full-body uploads → skin-tone fit recommendations.',
    node: <FashionShot />,
  },
] as const;

export default function ProductScreenshots() {
  return (
    <div className="space-y-14 sm:space-y-20">
      {SHOTS.map((shot, i) => (
        <motion.div
          key={shot.id}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
            i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          <div className="text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#22c55e] font-semibold mb-3">
              Inside the platform
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              {shot.label}
            </h3>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed max-w-md mx-auto lg:mx-0">
              {shot.caption}
            </p>
          </div>
          <div className={i % 2 === 1 ? 'lg:order-1' : ''}>{shot.node}</div>
        </motion.div>
      ))}
    </div>
  );
}
