'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'softmax' | 'hardmax' | 'physique' | 'fashion' | 'advisor';

const TABS: { id: Tab; label: string }[] = [
  { id: 'softmax', label: 'Softmax' },
  { id: 'hardmax', label: 'Hardmax' },
  { id: 'physique', label: 'Physique' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'advisor', label: 'Advisor' },
];

type ProtocolItem = {
  title: string;
  issue: string;
  action: string;
  impact: string;
};

type ProtocolCategory = {
  id: string;
  label: string;
  score: string;
  items: ProtocolItem[];
};

const SOFTMAX_CATEGORIES: ProtocolCategory[] = [
  {
    id: 'eyes',
    label: 'Eyes',
    score: '6.2',
    items: [
      {
        title: 'Canthal tilt makeup map',
        issue: 'Outer canthus reads flat; positive tilt under-expressed on camera',
        action: 'Soft lift liner + outer-third highlight; avoid heavy lower waterline',
        impact: '+0.25',
      },
      {
        title: 'Hunter-eye shadow training',
        issue: 'Upper lid exposure high; brow ridge depth under-reads',
        action: 'Matte contour in orbital hollow + brow gel upward set',
        impact: '+0.2',
      },
      {
        title: 'Under-eye correction stack',
        issue: 'Tear trough / pigmentation dragging Misc and Harmony',
        action: 'Caffeine serum AM, retinoid PM (peri-orbital safe), color-correct concealer',
        impact: '+0.3',
      },
      {
        title: 'Palpebral fissure framing',
        issue: 'Eye width vs midface balance slightly short of ideal ESR band',
        action: 'Inner-corner highlight + lash curl; glasses fit review if worn',
        impact: '+0.15',
      },
    ],
  },
  {
    id: 'nose',
    label: 'Nose',
    score: '6.5',
    items: [
      {
        title: 'Dorsal contour map',
        issue: 'Bridge width competes with eye separation on frontals',
        action: 'Matte contour along sidewalls; leave dorsum slim highlight line',
        impact: '+0.2',
      },
      {
        title: 'Tip definition routine',
        issue: 'Tip bulbosity softens lower-third harmony',
        action: 'Pore-refining toner + light tip powder; avoid shiny balms on tip',
        impact: '+0.15',
      },
      {
        title: 'Nasofrontal soft blend',
        issue: 'Glabella-to-bridge transition reads abrupt in side light',
        action: 'Sheer foundation blend through radix; brow grooming to open transition',
        impact: '+0.1',
      },
    ],
  },
  {
    id: 'jaw',
    label: 'Jaw & chin',
    score: '5.9',
    items: [
      {
        title: 'Mewing + tongue posture',
        issue: 'Soft jaw border; Angularity capped under masseter rest tone',
        action: 'Full-palate suction rest, nasal breathing, 10 min nightly drills',
        impact: '+0.35',
      },
      {
        title: 'Gonial chew protocol',
        issue: 'Bigonial width lagging vs bizygomatic (~ideal 75%)',
        action: 'Progressive resistance gum 15 min/day; stop if TMJ flares',
        impact: '+0.25',
      },
      {
        title: 'Chin / neck line stack',
        issue: 'Submental softness blurs mandible shadow',
        action: 'Lean cut + gua sha / lymphatic AM; high-collar avoidance in photos',
        impact: '+0.3',
      },
      {
        title: 'Ramus height cues',
        issue: 'Vertical jaw height under-reads vs facial thirds',
        action: 'Side-part hair + lower-third lighting; posture (ear over shoulder)',
        impact: '+0.15',
      },
    ],
  },
  {
    id: 'cheeks',
    label: 'Cheeks & midface',
    score: '6.4',
    items: [
      {
        title: 'Malar highlight geometry',
        issue: 'Cheekbone peak position soft; midface ratio slightly long',
        action: 'Highlight on zygomatic arch apex; matte under to fake hollow',
        impact: '+0.2',
      },
      {
        title: 'Buccal lean phase',
        issue: 'Residual buccal fullness limiting Dimorphism',
        action: 'Sub-12% cut window + sleep 7.5h; no crash diets',
        impact: '+0.4',
      },
      {
        title: 'FWHR framing',
        issue: 'Width-to-height ratio reads narrow vs ideal 1.8-2.0 band',
        action: 'Temple volume (hair) + lateral delt training for frame',
        impact: '+0.2',
      },
    ],
  },
  {
    id: 'skin',
    label: 'Skin',
    score: '6.8',
    items: [
      {
        title: 'Retinoid + barrier repair',
        issue: 'Texture / uneven tone capping Harmony',
        action: 'Adapalene or tret ramp + ceramide moisturizer; SPF 50 daily',
        impact: '+0.4',
      },
      {
        title: 'Pigment & redness control',
        issue: 'Mottling around nose and cheeks on flash photos',
        action: 'Azelaic acid AM, niacinamide; green tint only if needed',
        impact: '+0.25',
      },
      {
        title: 'Oil / pore management',
        issue: 'T-zone shine collapsing perceived skin quality',
        action: 'BHA 2-3x/week + blotting; matte primer for content days',
        impact: '+0.15',
      },
    ],
  },
  {
    id: 'hair',
    label: 'Hair & hairline',
    score: '7.0',
    items: [
      {
        title: 'Hairline density support',
        issue: 'Early temple recession risking upper-third balance',
        action: 'Minoxidil compliance + ketoconazole wash 2x/week; derm check',
        impact: '+0.3',
      },
      {
        title: 'Facial thirds via cut',
        issue: 'Upper third visually short vs mid/lower',
        action: 'Volume at crown / fringe length tuned to trichion position',
        impact: '+0.2',
      },
    ],
  },
  {
    id: 'lips',
    label: 'Lips & philtrum',
    score: '6.6',
    items: [
      {
        title: 'Philtrum optical shorten',
        issue: 'Philtrum above ideal 12-15mm band on frontals',
        action: 'Mustache shadow grooming / lip liner on vermilion border',
        impact: '+0.15',
      },
      {
        title: 'Cupid definition',
        issue: 'Upper lip border soft vs lower third',
        action: 'Hydrating balm + precise liner; avoid overfilling DIY',
        impact: '+0.1',
      },
    ],
  },
  {
    id: 'brows',
    label: 'Brows & brow ridge',
    score: '6.3',
    items: [
      {
        title: 'Ridge emphasis grooming',
        issue: 'Brow ridge projection under-reads for Dimorphism',
        action: 'Keep brow density; shape with flat top, soft arch only',
        impact: '+0.2',
      },
      {
        title: 'Glabella rest tone',
        issue: 'Chronic frown lines aging mid-upper face',
        action: 'Awareness drills + optional later Semimax path',
        impact: '+0.1',
      },
    ],
  },
];

const HARDMAX_CATEGORIES: ProtocolCategory[] = [
  {
    id: 'eyes',
    label: 'Eyes',
    score: '6.2',
    items: [
      {
        title: 'Canthoplasty consult path',
        issue: 'Negative / neutral tilt capping eye Dimorphism',
        action: 'Board-certified oculoplastic mapping; RealSelf research first',
        impact: '+0.55',
      },
      {
        title: 'Lower blepharoplasty / fat reposition',
        issue: 'Tear trough hollowness not fixable with Softmax alone',
        action: 'Fat transposition vs filler decision with specialist',
        impact: '+0.4',
      },
      {
        title: 'Orbital rim / hunter-eye options',
        issue: 'Eye depth and upper lid exposure off ideal',
        action: 'Custom implant or brow bone discussion after Softmax plateau',
        impact: '+0.45',
      },
    ],
  },
  {
    id: 'nose',
    label: 'Nose',
    score: '6.5',
    items: [
      {
        title: 'Rhino refinement path',
        issue: 'Dorsal / tip balance vs Harmony and side profile',
        action: 'Preservation rhino consult; morph session before commit',
        impact: '+0.5',
      },
      {
        title: 'Alar base / width adjust',
        issue: 'Nasal width vs IPD competing on frontals',
        action: 'Weir / sill techniques only if morph justifies',
        impact: '+0.3',
      },
    ],
  },
  {
    id: 'jaw',
    label: 'Jaw & chin',
    score: '5.9',
    items: [
      {
        title: 'Custom jaw implant consult',
        issue: 'Bigonial / ramus lag vs Dimorphism targets',
        action: '3D CT planning; staged after lean body composition',
        impact: '+0.7',
      },
      {
        title: 'Genioplasty / chin implant',
        issue: 'Chin-to-philtrum and pogonion projection short',
        action: 'Sliding genio vs implant; avoid over-projecting',
        impact: '+0.45',
      },
      {
        title: 'Bimax / orthognathic research',
        issue: 'Occlusion + lower-third structural limit',
        action: 'Ortho + OMFS joint eval; Softmax while planning',
        impact: '+0.9',
      },
    ],
  },
  {
    id: 'cheeks',
    label: 'Cheeks & midface',
    score: '6.4',
    items: [
      {
        title: 'Buccal fat / cheek contour',
        issue: 'Midface fullness limiting Angularity after lean phase',
        action: 'Only post sub-12% maintenance; conservative resection',
        impact: '+0.6',
      },
      {
        title: 'Malar / cheek implant path',
        issue: 'Zygomatic projection short of width goals',
        action: 'Custom malar vs filler trial period first',
        impact: '+0.5',
      },
    ],
  },
  {
    id: 'skin',
    label: 'Skin',
    score: '6.8',
    items: [
      {
        title: 'Fractional CO2 resurfacing',
        issue: 'Texture / acne scarring residual after retinoid max',
        action: 'Board-certified laser plan; downtime budgeted',
        impact: '+0.4',
      },
      {
        title: 'Deep peel / microneedling RF',
        issue: 'Crepey under-eye / cheek texture',
        action: 'Staged sessions; photos every 6 weeks',
        impact: '+0.25',
      },
    ],
  },
  {
    id: 'hair',
    label: 'Hair & hairline',
    score: '7.0',
    items: [
      {
        title: 'FUE hair transplant research',
        issue: 'Temple / hairline recession past Softmax response',
        action: 'Graft math + donor check; RealSelf surgeon shortlist',
        impact: '+0.5',
      },
    ],
  },
  {
    id: 'lips',
    label: 'Lips & philtrum',
    score: '6.6',
    items: [
      {
        title: 'Lip lift surgery path',
        issue: 'Philtrum length structurally above Softmax fix',
        action: 'Bullhorn lift consult; scar placement review',
        impact: '+0.4',
      },
    ],
  },
  {
    id: 'brows',
    label: 'Brows & brow ridge',
    score: '6.3',
    items: [
      {
        title: 'Brow bone / supraorbital options',
        issue: 'Ridge projection far below Dimorphism band',
        action: 'Custom implant research after Softmax + photos',
        impact: '+0.45',
      },
      {
        title: 'Semimax: neuromodulator map',
        issue: 'Glabella / crow lines aging eye frame',
        action: 'Conservative units with injector who understands hunter-eye goals',
        impact: '+0.2',
      },
    ],
  },
];

const PHYSQUE_TIPS = [
  { tag: 'Train', name: 'Clavicular / lateral raises', why: 'Wider delts frame the jaw and shorten perceived face width' },
  { tag: 'Train', name: 'Upper chest incline focus', why: 'Builds the clavicular shelf that photographs under the face' },
  { tag: 'Train', name: 'Neck / trap balance', why: 'Thick neck supports jawline; avoid trap dominance that shortens neck' },
  { tag: 'Stack', name: 'Creatine monohydrate', why: 'Lean mass support tied to facial angularity goals' },
  { tag: 'Stack', name: 'Protein 1.6-2.2g/kg', why: 'Preserves mass while cutting toward sub-12%' },
  { tag: 'Cut', name: 'Sub-12% lean cut', why: 'Jaw, cheek, and under-eye definition unlock first' },
  { tag: 'Cut', name: 'Water + sodium timing', why: 'Morning face photos; reduce evening bloat before scans' },
  { tag: 'Recov', name: 'Sleep 7.5-9h', why: 'Cortisol face puff and under-eye darkness drop with consistency' },
];

const FASHION_SECTIONS = [
  {
    id: 'color',
    label: 'Color analysis',
    blurb: 'Undertone + contrast from your scan drive every piece below.',
    items: [
      { name: 'Warm olive base', why: 'Detected undertone favors camel, rust, forest, cream over pure cool gray', tag: 'Tone' },
      { name: 'Medium contrast palette', why: 'Avoid stark black/white blocks that widen midface on camera', tag: 'Contrast' },
      { name: 'Metal: yellow gold / bronze', why: 'Matches warm undertone for watches and frames', tag: 'Metal' },
    ],
  },
  {
    id: 'fit',
    label: 'Fit construction',
    blurb: 'Full-body + wardrobe uploads → silhouette matched to facial width.',
    items: [
      { name: 'Structured navy blazer', why: 'Sharpens shoulder line vs facial width (FWHR support)', tag: '$128' },
      { name: 'Soft-shoulder knit polo', why: 'Clean collar frames jaw without adding bulk at neck', tag: '$54' },
      { name: 'Straight dark denim', why: 'Lengthens torso; keeps visual weight off lower face', tag: '$78' },
      { name: 'Trouser break: slight', why: 'Elongates leg line so face stays the focal point', tag: 'Fit' },
    ],
  },
  {
    id: 'wardrobe',
    label: 'Wardrobe system',
    blurb: 'Upload what you own. We build outfits, not a random cart.',
    items: [
      { name: 'Capsule: 3 tops × 2 bottoms', why: 'Highest wear rate from pieces already in your closet', tag: 'Plan' },
      { name: 'Outerwear priority', why: 'One structured jacket beats five soft hoodies for score optics', tag: 'Buy' },
      { name: 'Shoe: clean low profile', why: 'Chunky soles shorten stature and widen frame on full-body shots', tag: 'Buy' },
    ],
  },
  {
    id: 'groom',
    label: 'Grooming × style',
    blurb: 'Hair, facial hair, and glasses treated as part of the fit.',
    items: [
      { name: 'Glasses geometry', why: 'Frame width ≈ bizygomatic; avoid oversized that shrink eyes', tag: 'Optic' },
      { name: 'Stubble map', why: 'Short boxed beard to fake gonial width if clean-shaven soft', tag: 'Hair' },
      { name: 'Watch + belt match', why: 'Warm metal + leather keeps contrast intentional', tag: 'Detail' },
    ],
  },
];

const ADVISOR_THREAD = [
  {
    role: 'user' as const,
    text: 'Break down my eyes vs jaw. What do I fix first this month?',
  },
  {
    role: 'bot' as const,
    text: 'Eyes are closer to ceiling than jaw (6.2 vs 5.9). Month 1: under-eye stack + canthal makeup map (cheap, visible on camera). Parallel: mewing + lateral raises so jaw catches up. Do not book Hardmax until Softmax holds 90 days.',
  },
  {
    role: 'user' as const,
    text: 'Show me products for under-eyes and link a rhino research page for later.',
  },
  {
    role: 'bot' as const,
    text: 'Softmax now: caffeine serum, peri-orbital retinoid, SPF 50. Hardmax later: RealSelf rhino shortlist only after morph + Softmax plateau. I can generate a new AI after photo with stronger eye depth when you say “visualize.”',
  },
  {
    role: 'user' as const,
    text: 'What about fashion if I only upload a closet photo?',
  },
  {
    role: 'bot' as const,
    text: 'Upload wardrobe + one full-body. I’ll tag undertone, build a 3×2 capsule from what you own, then suggest one structured jacket that improves FWHR framing. No random haul.',
  },
];

const ADVISOR_PROMPTS = [
  'Prioritize my weakest facial third',
  'Softmax plan for eyes this week',
  'Hardmax research list for jaw',
  'Build outfits from my wardrobe',
  'Visualize after photo: lean + jaw',
  'Skincare stack under $80',
];

interface PremiumPreviewProps {
  onUserEngage?: () => void;
}

export default function PremiumPreview({ onUserEngage }: PremiumPreviewProps) {
  const [tab, setTab] = useState<Tab>('softmax');
  const [softCat, setSoftCat] = useState(SOFTMAX_CATEGORIES[0].id);
  const [hardCat, setHardCat] = useState(HARDMAX_CATEGORIES[0].id);
  const [fashionSec, setFashionSec] = useState(FASHION_SECTIONS[0].id);

  const engage = (next: () => void) => {
    onUserEngage?.();
    next();
  };

  const soft = SOFTMAX_CATEGORIES.find((c) => c.id === softCat) ?? SOFTMAX_CATEGORIES[0];
  const hard = HARDMAX_CATEGORIES.find((c) => c.id === hardCat) ?? HARDMAX_CATEGORIES[0];
  const fashion = FASHION_SECTIONS.find((s) => s.id === fashionSec) ?? FASHION_SECTIONS[0];
  const categories = tab === 'softmax' ? SOFTMAX_CATEGORIES : HARDMAX_CATEGORIES;
  const activeCat = tab === 'softmax' ? soft : hard;
  const setCat = tab === 'softmax' ? setSoftCat : setHardCat;

  return (
    <div className="h-full flex flex-col min-h-0 rounded-2xl border border-white/15 bg-[#0c0c0f] overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-1 sm:gap-3 shrink-0">
        <p className="text-sm font-semibold tracking-tight text-white">
          Clavicular <span className="text-[#22c55e]">Protocol</span>
        </p>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">What you unlock</span>
      </div>

      <nav className="flex gap-0.5 px-2 sm:px-3 border-b border-white/10 overflow-x-auto shrink-0 justify-start sm:justify-center lg:justify-start">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => engage(() => setTab(t.id))}
            className={`relative px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap transition-colors ${
              tab === t.id ? 'text-white' : 'text-white/35 hover:text-white/70'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="premium-preview-tab"
                className="absolute left-2 right-2 bottom-0 h-0.5 bg-[#22c55e]"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
        <AnimatePresence mode="wait">
          {(tab === 'softmax' || tab === 'hardmax') && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-[120px_1fr] gap-4">
                <aside className="space-y-3 text-center sm:text-left">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/35 mb-1">Overall</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      <span className="text-[#22c55e]">6.8</span>
                      <span className="text-white/30 text-sm font-normal"> / 10</span>
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">Feature-by-feature plan</p>
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden border border-white/10 mx-auto sm:mx-0 max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/transformation.png"
                      alt="AI before and after sample"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-[8px] font-semibold text-white/80">Before</span>
                      <span className="text-[8px] font-bold text-[#22c55e]">AI After</span>
                    </div>
                  </div>
                </aside>
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-semibold tracking-tight mb-1">
                    {tab === 'softmax' ? 'Softmax by feature' : 'Hardmax by feature'}
                  </h3>
                  <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
                    {tab === 'softmax'
                      ? 'Non-invasive protocols for every facial region, ranked by score impact with product paths.'
                      : 'Surgical and Semimax paths per region. Research links and consult framing, never pressure.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3 justify-center sm:justify-start">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => engage(() => setCat(c.id))}
                        className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                          activeCat.id === c.id
                            ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
                            : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                        }`}
                      >
                        {c.label}
                        <span className="ml-1.5 tabular-nums opacity-70">{c.score}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl p-3 sm:p-4 bg-white/[0.02]">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-white">{activeCat.label} protocol</h4>
                  <p className="text-[11px] text-white/35 tabular-nums">
                    Region score <span className="text-[#22c55e]">{activeCat.score}</span>/10
                  </p>
                </div>
                <ul className="space-y-0 divide-y divide-white/10">
                  {activeCat.items.map((r) => (
                    <li key={r.title} className="py-3 first:pt-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs sm:text-sm font-medium text-white">{r.title}</p>
                        <span className="text-[10px] tabular-nums text-[#22c55e] shrink-0">{r.impact}</span>
                      </div>
                      <p className="text-[11px] text-white/45 mt-1">{r.issue}</p>
                      <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">
                        <span className="text-white/50">Do: </span>
                        {r.action}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {tab === 'physique' && (
            <motion.div
              key="physique"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-semibold tracking-tight">Physique for face score</h3>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Leanmaxxing and training that frame the face. Goal physiques included.
                </p>
              </div>

              <div className="relative aspect-[3/4] max-h-[280px] w-full max-w-xs mx-auto sm:max-w-none sm:mx-0 overflow-hidden border border-[#22c55e]/35">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/physique-clavicular.webp"
                  alt="Clavicular physique goal: lean abs"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#22c55e] font-semibold">
                    Goal physique
                  </p>
                  <p className="text-xs text-white/80">Clavicular lean · abs prioritized</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative aspect-[3/4] overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/marketing/physique-mogged.png"
                    alt="Physique goal midriff"
                    className="w-full h-full object-cover object-center"
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
                {PHYSQUE_TIPS.map((t) => (
                  <li key={t.name} className="py-2.5 first:pt-0 flex gap-3">
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
            </motion.div>
          )}

          {tab === 'fashion' && (
            <motion.div
              key="fashion"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-semibold tracking-tight">Fashion system</h3>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Color analysis, fit construction, wardrobe uploads, and grooming treated as one score-aware system.
                </p>
              </div>

              <div className="relative aspect-[16/10] sm:aspect-square max-h-[220px] overflow-hidden border border-white/10 mx-auto sm:mx-0 max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/fashion-fits.png"
                  alt="Sample fashion fit recommendations"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {FASHION_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => engage(() => setFashionSec(s.id))}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      fashion.id === s.id
                        ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
                        : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="border border-white/10 rounded-xl p-3 sm:p-4 bg-white/[0.02]">
                <h4 className="text-sm font-semibold text-white mb-1">{fashion.label}</h4>
                <p className="text-[11px] text-white/40 mb-3 leading-relaxed">{fashion.blurb}</p>
                <ul className="space-y-0 divide-y divide-white/10">
                  {fashion.items.map((item) => (
                    <li key={item.name} className="py-2.5 first:pt-0">
                      <div className="flex justify-between gap-2">
                        <p className="text-xs sm:text-sm font-medium text-white">{item.name}</p>
                        <span
                          className={`text-[11px] shrink-0 ${
                            item.tag.startsWith('$')
                              ? 'text-[#22c55e] tabular-nums'
                              : 'text-white/35 uppercase tracking-wider text-[9px] pt-0.5'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">{item.why}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-center">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Premium unlocks full-body + wardrobe photo uploads for skin-tone matched fit construction.
                </p>
              </div>
            </motion.div>
          )}

          {tab === 'advisor' && (
            <motion.div
              key="advisor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Beauty Bot</h3>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Multi-turn advisor with your scores loaded. Softmax, Hardmax research, fashion, physique, product links, and on-demand after photos.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {ADVISOR_THREAD.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-3 py-2.5 ${
                      m.role === 'user'
                        ? 'border border-white/10 bg-white/[0.03] max-w-[92%]'
                        : 'border border-[#22c55e]/30 bg-[#22c55e]/5 ml-auto max-w-[92%]'
                    }`}
                  >
                    <p className={`text-[10px] mb-1 ${m.role === 'user' ? 'text-white/35' : 'text-[#22c55e]'}`}>
                      {m.role === 'user' ? 'You' : 'Advisor'}
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mb-2">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {ADVISOR_PROMPTS.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 text-[11px] rounded-full border border-white/10 text-white/50 bg-white/[0.02]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 flex items-center gap-2 opacity-60">
                <span className="text-xs text-white/40 flex-1">Message Beauty Bot…</span>
                <span className="text-[10px] font-semibold text-[#22c55e]">Premium</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
