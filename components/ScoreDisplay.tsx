'use client';

import { motion } from 'framer-motion';
import type { AnalysisResult } from '@/lib/types';

interface ScoreDisplayProps {
  result: AnalysisResult;
}

// Rating scale reference for rarity
const getRarityInfo = (score: number): { rarity: string; description: string } => {
  if (score >= 9.1) return { rarity: '1 in 1.2M+', description: 'Near perfect' };
  if (score >= 9) return { rarity: '1 in 1.2M', description: 'Strikingly attractive' };
  if (score >= 8.5) return { rarity: '1 in 58K', description: 'Exceptionally attractive' };
  if (score >= 8) return { rarity: '1 in 4.1K', description: 'Surpassingly attractive' };
  if (score >= 7.5) return { rarity: '1 in 440', description: 'Highly attractive' };
  if (score >= 7) return { rarity: '1 in 68', description: 'Considerably attractive' };
  if (score >= 6.5) return { rarity: '1 in 16', description: 'Noticeably attractive' };
  if (score >= 6) return { rarity: '1 in 5.4', description: 'Decently attractive' };
  if (score >= 5.5) return { rarity: '1 in 2.7', description: 'Moderately attractive' };
  if (score >= 5) return { rarity: '1 in 2', description: 'Average' };
  if (score >= 4.5) return { rarity: '1 in 2.16', description: 'Slightly below average' };
  if (score >= 4) return { rarity: '1 in 3.69', description: 'Below average' };
  if (score >= 3.5) return { rarity: '1 in 9.7', description: 'Unattractive' };
  if (score >= 3) return { rarity: '1 in 39.2', description: 'Very unattractive' };
  return { rarity: '1 in 243+', description: 'Extremely rare' };
};

// Get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 8) return '#22c55e'; // Green
  if (score >= 6.5) return '#84cc16'; // Lime
  if (score >= 5) return '#eab308'; // Yellow
  if (score >= 4) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const { overallScore, categoryScores } = result;
  const rarityInfo = getRarityInfo(overallScore);
  const scoreColor = getScoreColor(overallScore);

  const categories = [
    { key: 'harm', label: 'HARM', weight: '32%', score: categoryScores.harm },
    { key: 'misc', label: 'MISC', weight: '26%', score: categoryScores.misc },
    { key: 'angu', label: 'ANGU', weight: '22%', score: categoryScores.angu },
    { key: 'dimo', label: 'DIMO', weight: '20%', score: categoryScores.dimo },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-4"
    >
      {/* Main score */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-2xl opacity-30 rounded-full"
          style={{ backgroundColor: scoreColor }}
        />
        
        {/* Score number */}
        <div className="relative flex items-baseline gap-1">
          <span 
            className="text-6xl font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {overallScore.toFixed(1)}
          </span>
          <span className="text-xl text-zinc-500">/10</span>
        </div>
      </motion.div>

      {/* Rarity badge */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-xs text-zinc-400">{rarityInfo.description}</span>
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${scoreColor}20`,
            color: scoreColor
          }}
        >
          {rarityInfo.rarity}
        </span>
      </motion.div>

      {/* Category breakdown */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full px-4 mt-2"
      >
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex flex-col items-center p-2 rounded-lg bg-zinc-900/50"
            >
              <span className="text-[10px] text-zinc-500">{cat.label}</span>
              <span className="text-sm font-semibold text-white">{cat.score.toFixed(1)}</span>
              <span className="text-[9px] text-zinc-600">{cat.weight}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

