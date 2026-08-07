'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/apiClient';
import { loadSavedAdvice, peekSavedAdvice, persistAdvice } from '@/lib/saveAdvice';
import type { FeatureAnalysis } from '@/lib/types';

interface FashionStudioProps {
  faceImage: string | null;
  features?: FeatureAnalysis[];
  overallScore?: number;
}

interface ClothingItem {
  id: string;
  dataUrl: string;
  label: string;
}

interface ItemRec {
  name: string;
  why: string;
  url?: string;
  price?: string;
}

interface FashionPayload {
  advice?: string;
  links?: { title: string; url: string }[];
  recommendations?: ItemRec[];
  fitImages?: string[];
  skinTone?: string;
  fullBodyImage?: string | null;
}

export default function FashionStudio({
  faceImage,
  features,
  overallScore,
}: FashionStudioProps) {
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const wardrobeInputRef = useRef<HTMLInputElement>(null);
  const local = peekSavedAdvice<FashionPayload>('fashion');
  const [fullBodyImage, setFullBodyImage] = useState<string | null>(local?.fullBodyImage || null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [advice, setAdvice] = useState<string | null>(local?.advice || null);
  const [links, setLinks] = useState<{ title: string; url: string }[]>(local?.links || []);
  const [recommendations, setRecommendations] = useState<ItemRec[]>(local?.recommendations || []);
  const [fitImages, setFitImages] = useState<string[]>(local?.fitImages || []);
  const [skinTone, setSkinTone] = useState<string | null>(local?.skinTone || null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [loadingFit, setLoadingFit] = useState(false);
  const [hydrating, setHydrating] = useState(!local?.advice && !(local?.fitImages?.length));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadSavedAdvice<FashionPayload>('fashion');
        if (cancelled || !saved) return;
        if (saved.advice) setAdvice(saved.advice);
        if (saved.links) setLinks(saved.links);
        if (saved.recommendations) setRecommendations(saved.recommendations);
        if (saved.fitImages) setFitImages(saved.fitImages);
        if (saved.skinTone) setSkinTone(saved.skinTone);
        if (saved.fullBodyImage) setFullBodyImage(saved.fullBodyImage);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveFashion = async (payload: FashionPayload) => {
    await persistAdvice('fashion', {
      ...payload,
      savedAt: new Date().toISOString(),
    });
  };

  const onBodyFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFullBodyImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - items.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
          setItems((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${file.name}`,
              dataUrl: reader.result as string,
              label: file.name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Item',
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
  };

  const featurePayload = features
    ?.slice(0, 6)
    .map((f) => ({ name: f.name, isStrength: f.isStrength, value: f.value }));

  const getAdvice = async () => {
    if (loadingAdvice) return;
    if (!fullBodyImage && !faceImage) {
      setError('Add a full-body photo so we can read skin tone and proportions.');
      return;
    }
    if (advice) {
      const ok = window.confirm(
        'Replace your saved fashion guidance with a new write-up? This cannot be undone.'
      );
      if (!ok) return;
    }
    setLoadingAdvice(true);
    setError(null);
    try {
      const res = await authFetch('/api/fashion-advice', {
        method: 'POST',
        body: JSON.stringify({
          faceImage,
          fullBodyImage,
          clothingImages: items.map((i) => i.dataUrl),
          overallScore,
          features: featurePayload,
          generateFit: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get fashion advice');
      setAdvice(data.advice);
      setLinks(data.links || []);
      setRecommendations(data.recommendations || []);
      setSkinTone(data.skinTone || null);
      const bodyUrl = data.fullBodyImageUrl || fullBodyImage;
      if (data.fullBodyImageUrl) setFullBodyImage(data.fullBodyImageUrl);
      await saveFashion({
        advice: data.advice,
        links: data.links || [],
        recommendations: data.recommendations || [],
        fitImages,
        skinTone: data.skinTone,
        fullBodyImage: bodyUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const constructFits = async () => {
    if (!fullBodyImage) {
      setError('A full-body photo is required to generate fit combinations.');
      return;
    }
    if (loadingFit) return;
    if (fitImages.length > 0) {
      const ok = window.confirm(
        'Replace your saved fit combinations with new ones? This cannot be undone.'
      );
      if (!ok) return;
    }
    setLoadingFit(true);
    setError(null);
    try {
      const res = await authFetch('/api/fashion-advice', {
        method: 'POST',
        body: JSON.stringify({
          faceImage,
          fullBodyImage,
          clothingImages: items.map((i) => i.dataUrl),
          overallScore,
          features: featurePayload,
          generateFit: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to construct fits');
      if (data.advice) setAdvice(data.advice);
      if (data.links) setLinks(data.links);
      if (data.recommendations) setRecommendations(data.recommendations);
      if (data.skinTone) setSkinTone(data.skinTone);
      const bodyUrl = data.fullBodyImageUrl || fullBodyImage;
      if (data.fullBodyImageUrl) setFullBodyImage(data.fullBodyImageUrl);
      const images: string[] = data.fitImages?.length
        ? data.fitImages
        : data.fitImageUrl
          ? [data.fitImageUrl]
          : [];
      setFitImages(images);
      await saveFashion({
        advice: data.advice,
        links: data.links || [],
        recommendations: data.recommendations || [],
        fitImages: images,
        skinTone: data.skinTone,
        fullBodyImage: bodyUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingFit(false);
    }
  };

  if (hydrating) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/40">Loading saved fashion notes…</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-10">
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Fashion</h2>
          <p className="text-sm text-white/45 mt-2 leading-relaxed max-w-xl">
            Upload a full-body photo first. We use it for fit combinations, then recommend pieces
            that match your skin tone and whatever is already in your wardrobe.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Full body</p>
            <button
              type="button"
              onClick={() => bodyInputRef.current?.click()}
              className="text-xs text-[#22c55e] hover:text-white transition-colors"
            >
              {fullBodyImage ? 'Replace photo' : 'Add full-body photo'}
            </button>
          </div>
          <input
            ref={bodyInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onBodyFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => bodyInputRef.current?.click()}
            className="w-full max-w-xs aspect-[3/4] border border-dashed border-white/20 hover:border-[#22c55e]/50 bg-white/[0.02] overflow-hidden relative transition-colors"
          >
            {fullBodyImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fullBodyImage} alt="Full body" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                <span className="text-sm text-white/70">Required for fit gen</span>
                <span className="text-xs text-white/35">Head to toe, natural light</span>
              </div>
            )}
          </button>
          {skinTone && (
            <p className="mt-2 text-xs text-white/40">
              Detected undertone / skin tone: <span className="text-white/70">{skinTone}</span>
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
              Wardrobe ({items.length}/4)
            </p>
            <button
              type="button"
              onClick={() => wardrobeInputRef.current?.click()}
              disabled={items.length >= 4}
              className="text-xs text-[#22c55e] hover:text-white disabled:opacity-30 transition-colors"
            >
              Add clothing photo
            </button>
          </div>
          <input
            ref={wardrobeInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          {items.length === 0 ? (
            <p className="text-sm text-white/40 leading-relaxed">
              Optional: add shirts, jackets, pants, or shoes you already own so recommendations
              build around them.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <li key={item.id} className="relative group">
                  <div className="aspect-square overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.dataUrl} alt={item.label} className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 bg-black/80 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={getAdvice}
            disabled={loadingAdvice || (!fullBodyImage && !faceImage)}
            className="px-4 py-2 text-sm font-medium border border-white/20 text-white hover:border-[#22c55e] hover:text-[#22c55e] disabled:opacity-35 transition-colors"
          >
            {loadingAdvice ? 'Matching skin tone…' : 'Get style recommendations'}
          </button>
          <button
            type="button"
            onClick={constructFits}
            disabled={!fullBodyImage || loadingFit}
            className="px-4 py-2 text-sm font-medium bg-[#22c55e] text-black hover:bg-white disabled:opacity-35 transition-colors"
          >
            {loadingFit ? 'Generating fits…' : 'Generate fit combinations'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-white/70 border-l-2 border-[#22c55e] pl-3">{error}</p>
        )}

        {advice && (
          <div className="space-y-4 max-w-2xl">
            {advice.split(/\n\n+/).map((para, i) => (
              <p key={i} className="text-sm sm:text-[15px] text-white/75 leading-[1.75]">
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
              Recommended for your skin tone and wardrobe
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
            {links.length > 0 && (
              <p className="text-sm text-white/50 leading-relaxed pt-2 border-t border-white/10">
                More options:{' '}
                {links.map((link, i) => (
                  <span key={link.url + i}>
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

      <aside className="space-y-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Fit combinations</p>
        {loadingFit ? (
          <div className="aspect-[3/4] border border-white/10 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/40">Building looks</span>
          </div>
        ) : fitImages.length > 0 ? (
          <div className="space-y-3">
            {fitImages.map((src, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Fit combination ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[3/4] border border-white/10 bg-white/[0.02] flex items-center justify-center px-4 text-center">
            <p className="text-xs text-white/35 leading-relaxed">
              {fullBodyImage
                ? 'Generated outfits from your full-body photo appear here.'
                : 'Add a full-body photo to unlock fit generation.'}
            </p>
          </div>
        )}
        <p className="text-xs text-white/35 leading-relaxed">
          Fits keep your identity and build looks around your wardrobe plus skin-tone-friendly
          colors. Illustrative only.
        </p>
      </aside>
    </div>
  );
}
