'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BeforeAfterReveal from '@/components/BeforeAfterReveal';
import ProtocolRecommendation from '@/components/ProtocolRecommendation';
import BeautyBot from '@/components/BeautyBot';
import PhysiqueStudio from '@/components/PhysiqueStudio';
import FashionStudio from '@/components/FashionStudio';
import { authFetch } from '@/lib/apiClient';
import {
  loadAllSavedAdvice,
  peekSavedAdvice,
  persistAdvice,
} from '@/lib/saveAdvice';
import type { AnalysisResult, ProtocolRecommendation as ProtocolType } from '@/lib/types';

type Section = 'softmax' | 'hardmax' | 'physique' | 'fashion' | 'advisor';

interface ProtocolPlatformProps {
  analysisResult: AnalysisResult;
  capturedImage: string | null;
  afterImageUrl: string | null;
  isGeneratingAfter: boolean;
  onClose: () => void;
  onAfterGenerated: (url: string) => void;
}

interface ProtocolPayload {
  protocols: ProtocolType[];
  generatedAt?: string;
}

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'softmax', label: 'Softmax' },
  { id: 'hardmax', label: 'Hardmax' },
  { id: 'physique', label: 'Physique' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'advisor', label: 'Advisor' },
];

export default function ProtocolPlatform({
  analysisResult,
  capturedImage,
  afterImageUrl,
  isGeneratingAfter,
  onClose,
  onAfterGenerated,
}: ProtocolPlatformProps) {
  const [section, setSection] = useState<Section>('softmax');
  const [softmaxProtocols, setSoftmaxProtocols] = useState<ProtocolType[]>(
    () => peekSavedAdvice<ProtocolPayload>('softmax')?.protocols || []
  );
  const [hardmaxProtocols, setHardmaxProtocols] = useState<ProtocolType[]>(
    () => peekSavedAdvice<ProtocolPayload>('hardmax')?.protocols || []
  );
  const [loadingSoftmax, setLoadingSoftmax] = useState(false);
  const [loadingHardmax, setLoadingHardmax] = useState(false);
  const [softmaxError, setSoftmaxError] = useState<string | null>(null);
  const [hardmaxError, setHardmaxError] = useState<string | null>(null);
  const [softmaxReady, setSoftmaxReady] = useState(
    () => Boolean(peekSavedAdvice<ProtocolPayload>('softmax')?.protocols?.length)
  );
  const [hardmaxReady, setHardmaxReady] = useState(
    () => Boolean(peekSavedAdvice<ProtocolPayload>('hardmax')?.protocols?.length)
  );
  const hydratedRef = useRef(false);
  const analysisRef = useRef(analysisResult);
  analysisRef.current = analysisResult;

  // Sync from server once; never wipe local content if server is empty after a glitch
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      const all = await loadAllSavedAdvice();
      const soft = all.softmax as ProtocolPayload | undefined;
      const hard = all.hardmax as ProtocolPayload | undefined;

      if (soft?.protocols?.length) {
        setSoftmaxProtocols(soft.protocols);
        setSoftmaxReady(true);
      }
      if (hard?.protocols?.length) {
        setHardmaxProtocols(hard.protocols);
        setHardmaxReady(true);
      }

      const after = all.after_image as { url?: string } | undefined;
      if (after?.url && !afterImageUrl) {
        onAfterGenerated(after.url);
      }
    })();
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateProtocols = useCallback(async (type: 'softmax' | 'hardmax') => {
    const setLoading = type === 'softmax' ? setLoadingSoftmax : setLoadingHardmax;
    const setError = type === 'softmax' ? setSoftmaxError : setHardmaxError;
    const setProtocols = type === 'softmax' ? setSoftmaxProtocols : setHardmaxProtocols;
    const setReady = type === 'softmax' ? setSoftmaxReady : setHardmaxReady;
    const result = analysisRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/ai-protocol', {
        method: 'POST',
        body: JSON.stringify({
          features: result.features,
          overallScore: result.overallScore,
          categoryScores: result.categoryScores,
          protocolType: type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      const protocols: ProtocolType[] = data.protocols || [];
      if (!protocols.length) {
        throw new Error('No recommendations returned');
      }

      setProtocols(protocols);
      setReady(true);
      const saved = await persistAdvice(type, {
        protocols,
        generatedAt: new Date().toISOString(),
        overallScore: result.overallScore,
      });
      if (!saved) {
        setError('Guidance is shown, but account save failed. It is still cached on this device.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // First visit only: generate if nothing is saved. Never auto-overwrite saved guidance.
  useEffect(() => {
    if (section === 'softmax' && !softmaxReady && !loadingSoftmax && softmaxProtocols.length === 0) {
      void generateProtocols('softmax');
    }
    if (section === 'hardmax' && !hardmaxReady && !loadingHardmax && hardmaxProtocols.length === 0) {
      void generateProtocols('hardmax');
    }
  }, [
    section,
    softmaxReady,
    hardmaxReady,
    loadingSoftmax,
    loadingHardmax,
    softmaxProtocols.length,
    hardmaxProtocols.length,
    generateProtocols,
  ]);

  const handleRefresh = (type: 'softmax' | 'hardmax') => {
    const ok = window.confirm(
      `Replace your saved ${type === 'softmax' ? 'Softmax' : 'Hardmax'} guidance with a new write-up? This cannot be undone.`
    );
    if (!ok) return;
    if (type === 'softmax') {
      setSoftmaxProtocols([]);
      setSoftmaxReady(false);
    } else {
      setHardmaxProtocols([]);
      setHardmaxReady(false);
    }
    void generateProtocols(type);
  };

  const renderFaceSection = (type: 'softmax' | 'hardmax') => {
    const protocols = type === 'softmax' ? softmaxProtocols : hardmaxProtocols;
    const loading = type === 'softmax' ? loadingSoftmax : loadingHardmax;
    const error = type === 'softmax' ? softmaxError : hardmaxError;
    const ready = type === 'softmax' ? softmaxReady : hardmaxReady;
    const title = type === 'softmax' ? 'Softmax protocol' : 'Hardmax protocol';
    const subtitle =
      type === 'softmax'
        ? 'Non-invasive guidance only. Skincare, grooming, and habits that move your score without needles or surgery.'
        : 'Full-spectrum options including injectables and surgical paths, prioritized by expected impact.';

    const showLoader = loading || (!ready && protocols.length === 0);

    return (
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="grid lg:grid-cols-[220px_1fr] gap-10"
      >
        <aside className="space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-1">Overall</p>
            <p className="text-3xl font-semibold tabular-nums">
              <span className="text-[#22c55e]">{analysisResult.overallScore.toFixed(1)}</span>
              <span className="text-white/30 text-lg font-normal"> / 10</span>
            </p>
            <p className="text-sm text-white/45 mt-1">{analysisResult.rarity}</p>
          </div>

          <BeforeAfterReveal
            beforeImage={capturedImage}
            afterImage={afterImageUrl}
            isLocked={false}
            isLoading={isGeneratingAfter}
            onUnlock={() => {}}
            compact
            hideCta
            platform
          />

          <dl className="space-y-2 text-sm">
            {(
              [
                ['Harmony', analysisResult.categoryScores.harm],
                ['Angularity', analysisResult.categoryScores.angu],
                ['Dimorphism', analysisResult.categoryScores.dimo],
                ['Misc', analysisResult.categoryScores.misc],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-white/40">{label}</dt>
                <dd className="tabular-nums text-white/85">{value.toFixed(1)}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-white/45 mt-1 max-w-xl leading-relaxed">{subtitle}</p>
              {protocols.length > 0 && (
                <p className="text-[11px] text-white/30 mt-2">
                  Saved to your account. Only changes if you regenerate.
                </p>
              )}
            </div>
            <button
              onClick={() => handleRefresh(type)}
              disabled={loading}
              className="self-start sm:self-auto px-4 py-2 text-sm font-medium border border-white/20 text-white hover:border-[#22c55e] hover:text-[#22c55e] disabled:opacity-40 transition-colors"
            >
              {loading
                ? 'Writing…'
                : protocols.length > 0
                  ? 'Regenerate…'
                  : 'Generate guidance'}
            </button>
          </div>

          {error && (
            <p className="text-sm text-white/70 mb-4 border-l-2 border-[#22c55e] pl-3">{error}</p>
          )}

          {showLoader ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-5 h-5 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white/40">
                {type === 'softmax' ? 'Writing Softmax guidance…' : 'Writing Hardmax guidance…'}
              </p>
            </div>
          ) : (
            <ProtocolRecommendation protocols={protocols} mode={type} />
          )}
        </section>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black text-white"
    >
      <div className="h-full flex flex-col">
        <header className="flex-shrink-0 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              ← Analysis
            </button>

            <div className="text-center min-w-0">
              <p className="text-sm sm:text-base font-semibold tracking-tight">
                Clavicular <span className="text-[#22c55e]">Protocol</span>
              </p>
              <p className="text-[11px] text-white/40 hidden sm:block">
                Face, physique, and style in one place
              </p>
            </div>

            <div className="w-16" aria-hidden />
          </div>

          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  section === s.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {s.label}
                {section === s.id && (
                  <motion.span
                    layoutId="protocol-tab"
                    className="absolute left-2 right-2 bottom-0 h-0.5 bg-[#22c55e]"
                  />
                )}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <AnimatePresence mode="wait">
              {section === 'softmax' && renderFaceSection('softmax')}
              {section === 'hardmax' && renderFaceSection('hardmax')}

              {section === 'physique' && (
                <motion.div
                  key="physique"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <PhysiqueStudio
                    faceImage={capturedImage}
                    overallScore={analysisResult.overallScore}
                    categoryScores={analysisResult.categoryScores}
                    features={analysisResult.features}
                  />
                </motion.div>
              )}

              {section === 'fashion' && (
                <motion.div
                  key="fashion"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <FashionStudio
                    faceImage={capturedImage}
                    features={analysisResult.features}
                    overallScore={analysisResult.overallScore}
                  />
                </motion.div>
              )}

              {section === 'advisor' && (
                <motion.div
                  key="advisor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl"
                >
                  <h2 className="text-2xl font-semibold tracking-tight mb-2">Advisor</h2>
                  <p className="text-sm text-white/45 mb-6 leading-relaxed">
                    Ask follow-ups about Softmax routines, Hardmax options, products, or request a
                    new after photo. Keep questions specific for better answers.
                  </p>
                  <BeautyBot
                    image={capturedImage}
                    features={analysisResult.features}
                    overallScore={analysisResult.overallScore}
                    onAfterGenerated={onAfterGenerated}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
