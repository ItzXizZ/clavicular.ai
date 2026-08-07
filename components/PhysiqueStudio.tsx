'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/apiClient';
import { loadSavedAdvice, peekSavedAdvice, persistAdvice } from '@/lib/saveAdvice';
import type { CategoryScores, FeatureAnalysis } from '@/lib/types';

interface PhysiqueStudioProps {
  faceImage: string | null;
  overallScore: number;
  categoryScores: CategoryScores;
  features: FeatureAnalysis[];
}

interface ItemRec {
  name: string;
  why: string;
  url?: string;
  price?: string;
}

interface PhysiquePayload {
  advice?: string;
  summary?: string | null;
  links?: { title: string; url: string }[];
  recommendations?: ItemRec[];
  physiqueImage?: string | null;
}

export default function PhysiqueStudio({
  faceImage,
  overallScore,
  categoryScores,
  features,
}: PhysiqueStudioProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const local = peekSavedAdvice<PhysiquePayload>('physique');
  const [physiqueImage, setPhysiqueImage] = useState<string | null>(local?.physiqueImage || null);
  const [advice, setAdvice] = useState<string | null>(local?.advice || null);
  const [summary, setSummary] = useState<string | null>(local?.summary || null);
  const [links, setLinks] = useState<{ title: string; url: string }[]>(local?.links || []);
  const [recommendations, setRecommendations] = useState<ItemRec[]>(local?.recommendations || []);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(!local?.advice);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadSavedAdvice<PhysiquePayload>('physique');
        if (cancelled || !saved) return;
        if (saved.advice) setAdvice(saved.advice);
        if (saved.summary) setSummary(saved.summary);
        if (saved.links) setLinks(saved.links);
        if (saved.recommendations) setRecommendations(saved.recommendations);
        if (saved.physiqueImage) setPhysiqueImage(saved.physiqueImage);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhysiqueImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!physiqueImage || loading) return;
    if (advice) {
      const ok = window.confirm(
        'Replace your saved physique guidance with a new write-up? This cannot be undone.'
      );
      if (!ok) return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/physique-advice', {
        method: 'POST',
        body: JSON.stringify({
          physiqueImage,
          faceImage,
          overallScore,
          categoryScores,
          features: features.slice(0, 8).map((f) => ({
            name: f.name,
            isStrength: f.isStrength,
            value: f.value,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze physique');

      const imageToSave = data.physiqueImageUrl || physiqueImage;
      setAdvice(data.advice);
      setSummary(data.summary || null);
      setLinks(data.links || []);
      setRecommendations(data.recommendations || []);
      if (data.physiqueImageUrl) setPhysiqueImage(data.physiqueImageUrl);

      await persistAdvice('physique', {
        advice: data.advice,
        summary: data.summary || null,
        links: data.links || [],
        recommendations: data.recommendations || [],
        physiqueImage: imageToSave,
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (hydrating) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/40">Loading saved physique guidance…</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-10">
      <aside className="space-y-4 flex flex-col items-center text-center lg:items-start lg:text-left">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Physique</h2>
          <p className="text-sm text-white/45 mt-2 leading-relaxed max-w-md mx-auto lg:mx-0">
            Upload a torso or full-body photo. Guidance covers training, creatine, shoulders/arms,
            and how your frame supports your face score.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-[180px] aspect-[3/4] border border-dashed border-white/20 hover:border-[#22c55e]/60 bg-white/[0.02] transition-colors overflow-hidden relative"
        >
          {physiqueImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={physiqueImage} alt="Physique" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
              <span className="text-sm text-white/70">Add photo</span>
              <span className="text-xs text-white/35">Front or 3/4</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={analyze}
          disabled={!physiqueImage || loading}
          className="w-full max-w-[180px] py-2.5 text-sm font-medium bg-[#22c55e] text-black hover:bg-white disabled:opacity-35 transition-colors"
        >
          {loading ? 'Reviewing…' : advice ? 'Regenerate…' : 'Get physique guidance'}
        </button>

        {advice && (
          <p className="text-[11px] text-white/30 max-w-[180px] leading-relaxed">
            Photo and guidance are saved to your account until you regenerate.
          </p>
        )}
      </aside>

      <section className="min-h-[280px]">
        {error && (
          <p className="text-sm text-white/70 border-l-2 border-[#22c55e] pl-3 mb-6">{error}</p>
        )}

        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/40">Assessing physique and writing your plan…</p>
          </div>
        )}

        {!advice && !loading && (
          <p className="text-sm text-white/40 leading-relaxed max-w-lg">
            You will get a read on your current physique, a shoulder/arm-first training emphasis,
            creatine and other specifics, plus notes on leanmaxxing, tanning, and optional
            peptide research topics.
          </p>
        )}

        {advice && !loading && (
          <div className="space-y-5 max-w-2xl">
            {summary && (
              <p className="text-sm text-[#22c55e]/90 leading-relaxed">{summary}</p>
            )}

            {advice.split(/\n\n+/).map((para, i) => (
              <p key={i} className="text-sm sm:text-[15px] text-white/75 leading-[1.75]">
                {para.trim()}
              </p>
            ))}

            {recommendations.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Recommended specifics
                </p>
                {recommendations.map((rec, i) => (
                  <p key={i} className="text-sm text-white/70 leading-relaxed">
                    {rec.url ? (
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#22c55e] underline underline-offset-2 decoration-white/20 hover:decoration-[#22c55e]"
                      >
                        {rec.name}
                        {rec.price ? ` (${rec.price})` : ''}
                      </a>
                    ) : (
                      <span className="text-[#22c55e]">
                        {rec.name}
                        {rec.price ? ` (${rec.price})` : ''}
                      </span>
                    )}
                    <span className="text-white/55">. {rec.why}</span>
                  </p>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <p className="text-sm text-white/55 leading-relaxed pt-2 border-t border-white/10">
                Further reading:{' '}
                {links.map((link, i) => (
                  <span key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#22c55e] underline underline-offset-2 decoration-white/20 hover:decoration-[#22c55e]"
                    >
                      {link.title}
                    </a>
                    {i < links.length - 2 ? ', ' : i === links.length - 2 ? ', and ' : '.'}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
