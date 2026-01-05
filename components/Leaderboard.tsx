'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/apiClient';

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
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-10">
        <span className="text-sm font-bold text-white">1</span>
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
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-zinc-500 to-zinc-600 rounded-full flex items-center justify-center shadow-lg z-10">
        <span className="text-sm font-bold text-zinc-200">3</span>
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
  if (score >= 6.5) return '#22c55e';
  if (score >= 5) return '#ffffff';
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
      // Use authenticated fetch
      const response = await authFetch('/api/leaderboard');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch leaderboard');
      }
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
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
          className="fixed inset-0 z-50 bg-black overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-black via-black to-transparent pb-8">
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

              {/* Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
                <p className="text-zinc-500 text-sm">Top faces ranked by analysis score</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-6 pb-12 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pt-3 px-1">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                {error.includes('authentication') || error.includes('token') ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-zinc-400 text-lg mb-2">Log in to see leaderboard</p>
                    <p className="text-zinc-600 text-sm">Sign in to view and compete on the leaderboard</p>
                  </>
                ) : (
                  <>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={fetchLeaderboard}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-lg mb-2">No entries yet</p>
                <p className="text-zinc-600 text-sm">Be the first to join the leaderboard!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pt-3 px-1">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEntry(entry)}
                    className="relative group cursor-pointer overflow-visible"
                  >
                    {getRankBadge(index + 1)}
                    <div className={`aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-300 ${
                      index === 0 ? 'border-[#22c55e]/50 shadow-lg shadow-green-500/10' :
                      index === 1 ? 'border-slate-400/30' :
                      index === 2 ? 'border-zinc-500/30' :
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
                  className="w-full max-w-lg bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
                >
                  {/* Image section */}
                  <div className="relative aspect-square bg-black">
                    <img
                      src={selectedEntry.imageUrl}
                      alt={selectedEntry.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
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
                          <p className="text-[#22c55e] text-sm">{selectedEntry.rarity}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats section */}
                  <div className="p-6">
                    {/* Category scores */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="text-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Harmony</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.harmScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Angular</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.anguScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Dimorphism</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.dimoScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500 mb-1">Misc</p>
                        <p className="text-lg font-semibold text-white">{selectedEntry.miscScore.toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Top features */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Top Features</h4>
                      <div className="space-y-2">
                        {parseFeatures(selectedEntry.features).sort((a: { value: number }, b: { value: number }) => b.value - a.value).slice(0, 4).map((feature: { name: string; value: number; isStrength: boolean }, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <span className="text-sm text-zinc-300">{feature.name}</span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: feature.value >= 5 ? '#22c55e' : '#ef4444' }}
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
