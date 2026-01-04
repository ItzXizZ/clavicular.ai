// Facial landmark coordinates
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Extracted facial measurements
export interface FacialMeasurements {
  ipd: number; // Interpupillary Distance
  esr: number; // Eye Separation Ratio
  pfl: number; // Palpebral Fissure Length
  canthalTilt: number; // Canthal Tilt Angle (degrees)
  fwhr: number; // Facial Width-to-Height Ratio
  facialThirds: {
    upper: number;
    middle: number;
    lower: number;
  };
  philtrumLength: number;
  midfaceRatio: number;
  gonialAngle: number;
  nasofrontalAngle: number;
  chinPhiltrumRatio: number;
  bizygomatic: number;
  bigonial: number;
  symmetryScore: number;
}

// Category scores
export interface CategoryScores {
  harm: number; // Harmony
  misc: number; // Miscellaneous
  angu: number; // Angularity
  dimo: number; // Dimorphism
}

// Feature analysis result
export interface FeatureAnalysis {
  id: string;
  name: string;
  category: 'HARM' | 'MISC' | 'ANGU' | 'DIMO';
  value: number;
  ideal: string;
  deviation: number; // -1 to 1, negative = below ideal, positive = above
  importance: 'highest' | 'high' | 'medium' | 'low';
  isStrength: boolean;
}

// Full analysis result
export interface AnalysisResult {
  overallScore: number;
  rarity: string;
  categoryScores: CategoryScores;
  features: FeatureAnalysis[];
  measurements: FacialMeasurements;
  landmarks?: Landmark[]; // Store landmarks for visualization
}

// Feature to landmark mapping for highlighting
export interface FeatureLandmarkMapping {
  featureId: string;
  landmarkIndices: number[];
  // Optional line connections between landmarks
  connections?: [number, number][];
}

// Improvement method types
export type ImprovementType = 'SOFT' | 'SEMI' | 'HARD';

// Product recommendation
export interface Product {
  id: string;
  name: string;
  price: string;
  url?: string;
  imageUrl?: string;
  brand?: string;
}

// Improvement method
export interface ImprovementMethod {
  name: string;
  description: string;
  timeline: string;
  effectiveness: string;
  cost?: string;
  products?: Product[];
}

// Improvement recommendation
export interface Improvement {
  id: string;
  issueId: string;
  issueName: string;
  type: ImprovementType;
  methods: ImprovementMethod[];
}

// Protocol recommendation
export interface ProtocolRecommendation {
  issue: string;
  fix: {
    title: string;
    explanation: string;
    products: Product[];
  };
  impactScore: number; // How much this will improve overall score
}

// App view state
export type ViewMode = 'camera' | 'results';
export type ProfileMode = 'front' | 'side';
export type ResultsView = 'flaws' | 'strengths';
export type ProtocolType = 'softmax' | 'hardmax';

