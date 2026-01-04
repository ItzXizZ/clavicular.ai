'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  id: string;
  name: string;
  age: number;
  imageUrl: string;
  overallScore: number;
  harmScore: number;
  miscScore: number;
  anguScore: number;
  dimoScore: number;
  rarity: string;
  features: string;
  createdAt: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRankBadge = (rank: number) => {
  if (rank === 1) {
    return (
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 z-10">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
        </svg>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg z-10">
        <span className="text-sm font-bold text-slate-700">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center shadow-lg z-10">
        <span className="text-sm font-bold text-amber-100">3</span>
      </div>
    );
  }
  return (
    <div className="absolute -top-1 -left-1 w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center z-10">
      <span className="text-xs font-medium text-zinc-300">{rank}</span>
    </div>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 8) return '#22c55e';
  if (score >= 6.5) return '#84cc16';
  if (score >= 5) return '#eab308';
  return '#ef4444';
};

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseFeatures = (featuresJson: string) => {
    try {
      return JSON.parse(featuresJson);
    } catch {
      return [];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#0c0c0f]/98 backdrop-blur-xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0c0c0f] via-[#0c0c0f] to-transparent pb-8">
            <div className="max-w-6xl mx-auto px-6 pt-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Back</span>
                </button>
                <button
                  onClick={fetchLeaderboard}
                  disabled={loading}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">Refresh</span>
                </button>
              </div>

              {/* Title with gradient */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                </div>
                <p className="text-zinc-500 text-sm">Top faces ranked by analysis score</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-6 pb-12 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchLeaderboard}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-lg mb-2">No entries yet</p>
                <p className="text-zinc-600 text-sm">Be the first to join the leaderboard!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEntry(entry)}
                    className="relative group cursor-pointer"
                  >
                    {getRankBadge(index + 1)}
                    <div className={`aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-300 ${
                      index === 0 ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' :
                      index === 1 ? 'border-slate-400/30' :
                      index === 2 ? 'border-amber-600/30' :
                      'border-zinc-800 group-hover:border-zinc-600'
                    }`}>
                      {/* Image */}
                      <div className="relative w-full h-full">
                        <img
                          src={entry.imageUrl}
                          alt={entry.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{entry.name}</p>
                              <p className="text-zinc-400 text-xs">{entry.age} years</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span
                                className="text-lg font-bold"
                                style={{ color: getScoreColor(entry.overallScore) }}
                              >
                                {entry.overallScore.toFixed(1)}
                              </span>
                              <span className="text-zinc-500 text-xs block">/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Entry detail modal */}
          <AnimatePresence>
            {selectedEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelectedEntry(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
                >
                  {/* Image section */}
                  <div className="relative aspect-square bg-zinc-950">
                    <img
                      src={selectedEntry.imageUrl}
                      alt={selectedEntry.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                    
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Score overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{selectedEntry.name}</h3>
                          <p className="text-zinc-400">{selectedEntry.age} years old</p>
                        </div>
                        <div className="text-right">
                          <span
                            className="text-4xl font-bold"
                            style={{ color: getScoreColor(selectedEntry.overallScore) }}
                          >
                            {selectedEntry.overallScore.toFixed(1)}
                          </span>
                          <span className="text-zinc-500 text-lg">/10</span>
                          <p className="text-zinc-500 text-sm">{selectedEntry.rarity}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats section */}
                  <div className="p-6">
                    {/* Category scores */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Harmony</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.harmScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Angular</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.anguScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Dimorphism</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.dimoScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Misc</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.miscScore.toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Top features */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Top Features</h4>
                      <div className="space-y-2">
                        {parseFeatures(selectedEntry.features).slice(0, 4).map((feature: { name: string; value: number; isStrength: boolean }, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                            <span className="text-sm text-zinc-300">{feature.name}</span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: feature.isStrength ? '#22c55e' : '#ef4444' }}
                            >
                              {feature.value.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

