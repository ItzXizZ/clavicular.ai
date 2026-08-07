'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { FeatureAnalysis } from '@/lib/types';
import { FEATURE_LANDMARK_MAP } from '@/lib/featureLandmarks';

interface FlawsListProps {
  features: FeatureAnalysis[];
}

const importanceOrder = { highest: 0, high: 1, medium: 2, low: 3 };

export default function FlawsList({ features }: FlawsListProps) {
  const { resultsView, selectedFeatureId, setSelectedFeatureId } = useAppStore();

  const filteredFeatures = features
    .filter((f) => (resultsView === 'strengths' ? f.isStrength : !f.isStrength))
    .sort((a, b) => {
      const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      if (impDiff !== 0) return impDiff;
      return Math.abs(b.deviation) - Math.abs(a.deviation);
    })
    .slice(0, 4);

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeatureId(selectedFeatureId === featureId ? null : featureId);
  };

  if (filteredFeatures.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-white/35 text-sm">
        No {resultsView} detected
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {filteredFeatures.map((feature, index) => {
        const isSelected = selectedFeatureId === feature.id;
        const hasLandmarkMapping = !!FEATURE_LANDMARK_MAP[feature.id];
        const pct = Math.min(100, Math.max(8, (feature.value / 10) * 100));
        const isFlaws = resultsView === 'flaws';

        return (
          <motion.button
            type="button"
            key={feature.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => hasLandmarkMapping && handleFeatureClick(feature.id)}
            disabled={!hasLandmarkMapping}
            className={`w-full text-left py-3.5 first:pt-1 last:pb-1 transition-colors ${
              hasLandmarkMapping ? 'cursor-pointer' : 'cursor-default'
            } ${isSelected ? 'bg-[#22c55e]/10' : 'hover:bg-white/[0.03]'}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isFlaws
                    ? 'bg-white/10 text-white/50'
                    : 'bg-[#22c55e]/15 text-[#22c55e]'
                }`}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {feature.name}
                  </p>
                  <span
                    className={`text-base font-bold tabular-nums shrink-0 ${
                      isFlaws ? 'text-white' : 'text-[#22c55e]'
                    }`}
                  >
                    {feature.value.toFixed(1)}
                  </span>
                </div>

                <p className="text-[11px] text-white/35 mt-0.5 truncate">
                  {isFlaws && index === 0
                    ? 'Biggest score limiter'
                    : `Ideal ${feature.ideal}`}
                </p>

                <div className="mt-2 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: index * 0.04 + 0.1, duration: 0.4 }}
                    className={`h-full rounded-full ${
                      isFlaws ? 'bg-white/45' : 'bg-[#22c55e]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
