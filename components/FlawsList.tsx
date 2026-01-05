'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { FeatureAnalysis } from '@/lib/types';
import { FEATURE_LANDMARK_MAP } from '@/lib/featureLandmarks';

interface FlawsListProps {
  features: FeatureAnalysis[];
}

// Get color based on score value - consistent coloring
const getScoreColor = (value: number, isStrength: boolean) => {
  if (isStrength) return '#22c55e'; // Green for strengths
  if (value >= 5) return '#f59e0b'; // Amber for moderate flaws
  return '#ef4444'; // Red for significant flaws
};

const importanceOrder = { highest: 0, high: 1, medium: 2, low: 3 };

export default function FlawsList({ features }: FlawsListProps) {
  const { resultsView, selectedFeatureId, setSelectedFeatureId } = useAppStore();
  
  // Filter and sort features based on view mode
  const filteredFeatures = features
    .filter(f => resultsView === 'strengths' ? f.isStrength : !f.isStrength)
    .sort((a, b) => {
      // Sort by importance, then by deviation magnitude
      const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      if (impDiff !== 0) return impDiff;
      return Math.abs(b.deviation) - Math.abs(a.deviation);
    })
    .slice(0, 6); // Show top 6

  const handleFeatureClick = (featureId: string) => {
    // Toggle selection - click again to deselect
    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(null);
    } else {
      setSelectedFeatureId(featureId);
    }
  };

  if (filteredFeatures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No {resultsView} detected
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-1">
      {filteredFeatures.map((feature, index) => {
        const isSelected = selectedFeatureId === feature.id;
        const hasLandmarkMapping = !!FEATURE_LANDMARK_MAP[feature.id];
        const scoreColor = getScoreColor(feature.value, feature.isStrength);
        const highlightColor = FEATURE_LANDMARK_MAP[feature.id]?.color || scoreColor;
        
        return (
          <motion.div
            key={feature.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => hasLandmarkMapping && handleFeatureClick(feature.id)}
            className={`feature-card rounded-lg p-3 transition-all duration-200 ${
              hasLandmarkMapping ? 'cursor-pointer' : ''
            } ${isSelected ? 'ring-2' : ''}`}
            style={{
              ringColor: isSelected ? highlightColor : undefined,
              backgroundColor: isSelected ? `${highlightColor}15` : '#000000',
            }}
            whileHover={hasLandmarkMapping ? { scale: 1.01 } : undefined}
            whileTap={hasLandmarkMapping ? { scale: 0.99 } : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Feature name */}
                <div className="flex items-center gap-2">
                  <motion.span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? highlightColor : scoreColor }}
                    animate={isSelected ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />
                  <h4 className={`text-sm font-medium truncate transition-colors ${
                    isSelected ? 'text-white' : 'text-white'
                  }`}>
                    {feature.name}
                  </h4>
                  {/* Indicator for clickable features */}
                  {hasLandmarkMapping && !isSelected && (
                    <svg 
                      className="w-3 h-3 text-zinc-600 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70"
                    >
                      VIEWING
                    </motion.span>
                  )}
                </div>
                
                {/* Ideal value */}
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  Ideal: {feature.ideal}
                </p>
              </div>
              
              {/* Score indicator */}
              <div className="flex flex-col items-end">
                <span 
                  className="text-lg font-semibold"
                  style={{ color: isSelected ? highlightColor : scoreColor }}
                >
                  {feature.value.toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-600 uppercase">
                  {feature.category}
                </span>
              </div>
            </div>
            
            {/* Deviation bar */}
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (feature.value / 10) * 100)}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: isSelected ? highlightColor : scoreColor }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

