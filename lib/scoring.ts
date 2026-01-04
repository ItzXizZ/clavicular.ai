import type { 
  FacialMeasurements, 
  CategoryScores, 
  AnalysisResult, 
  FeatureAnalysis 
} from './types';
import { 
  IDEAL_VALUES, 
  scoreMeasurement, 
  scoreFacialThirds 
} from './ratios';

// Category weights from research
const CATEGORY_WEIGHTS = {
  harm: 0.32, // Harmony - 32%
  misc: 0.26, // Miscellaneous - 26%
  angu: 0.22, // Angularity - 22%
  dimo: 0.20, // Dimorphism - 20%
};

// Feature importance weights
const IMPORTANCE_WEIGHTS = {
  highest: 1.5,
  high: 1.2,
  medium: 1.0,
  low: 0.7,
};

// Feature definitions with category mapping
interface FeatureDefinition {
  id: string;
  name: string;
  category: 'HARM' | 'MISC' | 'ANGU' | 'DIMO';
  importance: 'highest' | 'high' | 'medium' | 'low';
  measurementKey: keyof FacialMeasurements | 'facialThirds';
  idealDescription: string;
}

const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // HARMONY features
  {
    id: 'ipd',
    name: 'Interpupillary Distance',
    category: 'HARM',
    importance: 'high',
    measurementKey: 'ipd',
    idealDescription: '62-65mm, ESR 46-50%'
  },
  {
    id: 'facial_thirds',
    name: 'Facial Thirds',
    category: 'HARM',
    importance: 'high',
    measurementKey: 'facialThirds',
    idealDescription: '1:1:1 proportion'
  },
  {
    id: 'fwhr',
    name: 'Facial Width-to-Height Ratio',
    category: 'HARM',
    importance: 'high',
    measurementKey: 'fwhr',
    idealDescription: '1.8-2.0'
  },
  {
    id: 'canthal_tilt',
    name: 'Canthal Tilt',
    category: 'HARM',
    importance: 'high',
    measurementKey: 'canthalTilt',
    idealDescription: 'Positive 3-8 degrees'
  },
  {
    id: 'nasofrontal_angle',
    name: 'Nasofrontal Angle',
    category: 'HARM',
    importance: 'medium',
    measurementKey: 'nasofrontalAngle',
    idealDescription: '125-135 degrees'
  },
  {
    id: 'chin_philtrum',
    name: 'Chin to Philtrum Ratio',
    category: 'HARM',
    importance: 'medium',
    measurementKey: 'chinPhiltrumRatio',
    idealDescription: '~1:2 (short philtrum)'
  },
  {
    id: 'bizygomatic',
    name: 'Bizygomatic Width',
    category: 'HARM',
    importance: 'medium',
    measurementKey: 'bizygomatic',
    idealDescription: '140-150mm'
  },
  
  // ANGULARITY features
  {
    id: 'gonial_angle',
    name: 'Gonial Angle',
    category: 'ANGU',
    importance: 'high',
    measurementKey: 'gonialAngle',
    idealDescription: '~120 degrees'
  },
  {
    id: 'bigonial',
    name: 'Bigonial Width',
    category: 'ANGU',
    importance: 'high',
    measurementKey: 'bigonial',
    idealDescription: 'Wide mandible with defined angles'
  },
  
  // DIMORPHISM features
  {
    id: 'midface_ratio',
    name: 'Midface Ratio',
    category: 'DIMO',
    importance: 'medium',
    measurementKey: 'midfaceRatio',
    idealDescription: '47-50mm'
  },
  
  // MISCELLANEOUS features
  {
    id: 'symmetry',
    name: 'Facial Symmetry',
    category: 'MISC',
    importance: 'high',
    measurementKey: 'symmetryScore',
    idealDescription: 'High bilateral symmetry'
  },
  {
    id: 'pfl',
    name: 'Palpebral Fissure Length',
    category: 'MISC',
    importance: 'medium',
    measurementKey: 'pfl',
    idealDescription: '27mm+ (iris method)'
  },
  {
    id: 'philtrum',
    name: 'Philtrum Length',
    category: 'MISC',
    importance: 'medium',
    measurementKey: 'philtrumLength',
    idealDescription: 'Short (12-15mm)'
  },
  {
    id: 'esr',
    name: 'Eye Separation Ratio',
    category: 'MISC',
    importance: 'medium',
    measurementKey: 'esr',
    idealDescription: '46-50%'
  },
];

/**
 * Score a single feature and return analysis
 */
function scoreFeature(
  definition: FeatureDefinition,
  measurements: FacialMeasurements
): FeatureAnalysis {
  let score: number;
  let deviation: number;
  let value: number;

  if (definition.measurementKey === 'facialThirds') {
    const result = scoreFacialThirds(measurements.facialThirds);
    score = result.score;
    deviation = result.deviation;
    // Use the largest deviation as the "value" for display
    value = Math.max(
      measurements.facialThirds.upper,
      measurements.facialThirds.middle,
      measurements.facialThirds.lower
    ) * 30; // Scale to roughly 0-10 range
  } else {
    const measurementValue = measurements[definition.measurementKey];
    value = typeof measurementValue === 'number' ? measurementValue : 0;
    
    // Get ideal config based on measurement type
    const idealKey = definition.measurementKey as keyof typeof IDEAL_VALUES;
    const idealConfig = IDEAL_VALUES[idealKey];
    
    if (idealConfig) {
      const result = scoreMeasurement(value, idealConfig);
      score = result.score;
      deviation = result.deviation;
    } else {
      score = 5;
      deviation = 0;
    }
  }

  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    value: score, // Show score as the value
    ideal: definition.idealDescription,
    deviation,
    importance: definition.importance,
    isStrength: deviation >= -0.15 && score >= 6.5,
  };
}

/**
 * Calculate category scores from feature analyses
 */
function calculateCategoryScores(features: FeatureAnalysis[]): CategoryScores {
  const categories = {
    harm: { total: 0, weight: 0 },
    misc: { total: 0, weight: 0 },
    angu: { total: 0, weight: 0 },
    dimo: { total: 0, weight: 0 },
  };

  for (const feature of features) {
    const categoryKey = feature.category.toLowerCase() as keyof typeof categories;
    const importanceWeight = IMPORTANCE_WEIGHTS[feature.importance];
    
    categories[categoryKey].total += feature.value * importanceWeight;
    categories[categoryKey].weight += importanceWeight;
  }

  return {
    harm: categories.harm.weight > 0 
      ? categories.harm.total / categories.harm.weight 
      : 5,
    misc: categories.misc.weight > 0 
      ? categories.misc.total / categories.misc.weight 
      : 5,
    angu: categories.angu.weight > 0 
      ? categories.angu.total / categories.angu.weight 
      : 5,
    dimo: categories.dimo.weight > 0 
      ? categories.dimo.total / categories.dimo.weight 
      : 5,
  };
}

/**
 * Calculate overall score from category scores
 */
function calculateOverallScore(categoryScores: CategoryScores): number {
  return (
    categoryScores.harm * CATEGORY_WEIGHTS.harm +
    categoryScores.misc * CATEGORY_WEIGHTS.misc +
    categoryScores.angu * CATEGORY_WEIGHTS.angu +
    categoryScores.dimo * CATEGORY_WEIGHTS.dimo
  );
}

/**
 * Get rarity description based on score
 */
function getRarity(score: number): string {
  if (score >= 9.1) return '1 in 1.2M+';
  if (score >= 9) return '1 in 1.2M';
  if (score >= 8.5) return '1 in 58K';
  if (score >= 8) return '1 in 4.1K';
  if (score >= 7.5) return '1 in 440';
  if (score >= 7) return '1 in 68';
  if (score >= 6.5) return '1 in 16';
  if (score >= 6) return '1 in 5.4';
  if (score >= 5.5) return '1 in 2.7';
  if (score >= 5) return '1 in 2';
  if (score >= 4.5) return '1 in 2.16';
  if (score >= 4) return '1 in 3.69';
  if (score >= 3.5) return '1 in 9.7';
  if (score >= 3) return '1 in 39.2';
  return '1 in 243+';
}

/**
 * Main scoring function - takes measurements and returns full analysis
 */
export function analyzeFace(measurements: FacialMeasurements): AnalysisResult {
  // Score each feature
  const features: FeatureAnalysis[] = FEATURE_DEFINITIONS.map(def => 
    scoreFeature(def, measurements)
  );

  // Calculate category scores
  const categoryScores = calculateCategoryScores(features);

  // Calculate overall score
  const overallScore = calculateOverallScore(categoryScores);

  // Get rarity
  const rarity = getRarity(overallScore);

  return {
    overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
    rarity,
    categoryScores: {
      harm: Math.round(categoryScores.harm * 10) / 10,
      misc: Math.round(categoryScores.misc * 10) / 10,
      angu: Math.round(categoryScores.angu * 10) / 10,
      dimo: Math.round(categoryScores.dimo * 10) / 10,
    },
    features,
    measurements,
  };
}

/**
 * Map detected flaws to improvement recommendations
 */
export function getImprovementRecommendations(features: FeatureAnalysis[]) {
  const flaws = features
    .filter(f => !f.isStrength && f.deviation < -0.2)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  return flaws.map(flaw => ({
    featureId: flaw.id,
    featureName: flaw.name,
    category: flaw.category,
    severity: Math.abs(flaw.deviation),
    currentScore: flaw.value,
    potentialImprovement: Math.min(2, Math.abs(flaw.deviation) * 3),
  }));
}

