'use client';

import { useEffect, useState } from 'react';

interface Entry {
  id: string;
  name: string;
  imageUrl: string;
  overallScore: number;
  rarity: string;
  rank: number;
}

export default function HeroLeaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/leaderboard/public');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      } catch {
        // stay empty — hero still works with overlay
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Scrollable top-100 wall — dimmed but readable */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain opacity-45 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
        <div className="min-h-full px-2 sm:px-4 pt-14 pb-56">
          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/60 mb-3 sticky top-0 z-[1] py-1 bg-black/40 backdrop-blur-sm">
            Top 100
          </p>
          {entries.length === 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 max-w-6xl mx-auto">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-md bg-white/[0.07] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 max-w-6xl mx-auto">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="relative aspect-[3/4] rounded-md overflow-hidden border border-white/10 bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                    <div className="flex items-baseline justify-between gap-0.5">
                      <span className="text-[8px] text-white/65 tabular-nums">#{e.rank}</span>
                      <span className="text-[9px] font-semibold text-[#22c55e] tabular-nums">
                        {e.overallScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Soft vignette — keep faces visible in the middle, darken only for CTA legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #000 0%, rgba(0,0,0,0.92) 16%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% 100%, rgba(34,197,94,0.14), transparent 55%)',
        }}
      />
    </div>
  );
}
