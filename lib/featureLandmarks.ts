import { LANDMARK_INDICES } from './mediapipe';

// Mapping of feature IDs to their relevant landmark indices and connections
export interface FeatureLandmarkConfig {
  landmarkIndices: number[];
  connections?: [number, number][];
  color?: string;
}

export const FEATURE_LANDMARK_MAP: Record<string, FeatureLandmarkConfig> = {
  // IPD - Interpupillary Distance (distance between pupil centers)
  ipd: {
    landmarkIndices: [
      LANDMARK_INDICES.leftPupil,
      LANDMARK_INDICES.rightPupil,
    ],
    connections: [
      [LANDMARK_INDICES.leftPupil, LANDMARK_INDICES.rightPupil],
    ],
    color: '#3b82f6', // Blue
  },

  // Canthal Tilt
  canthal_tilt: {
    landmarkIndices: [
      LANDMARK_INDICES.leftEyeInner,
      LANDMARK_INDICES.leftEyeOuter,
      LANDMARK_INDICES.rightEyeInner,
      LANDMARK_INDICES.rightEyeOuter,
    ],
    connections: [
      [LANDMARK_INDICES.leftEyeInner, LANDMARK_INDICES.leftEyeOuter],
      [LANDMARK_INDICES.rightEyeInner, LANDMARK_INDICES.rightEyeOuter],
    ],
    color: '#22c55e', // Green
  },

  // FWHR - Facial Width-to-Height Ratio
  fwhr: {
    landmarkIndices: [
      LANDMARK_INDICES.leftCheekbone,
      LANDMARK_INDICES.rightCheekbone,
      LANDMARK_INDICES.glabella,
      LANDMARK_INDICES.upperLipTop,
    ],
    connections: [
      [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.rightCheekbone],
      [LANDMARK_INDICES.glabella, LANDMARK_INDICES.upperLipTop],
    ],
    color: '#f59e0b', // Amber
  },

  // Gonial Angle
  gonial_angle: {
    landmarkIndices: [
      LANDMARK_INDICES.leftGonion,
      LANDMARK_INDICES.rightGonion,
      LANDMARK_INDICES.chin,
      LANDMARK_INDICES.leftRamus,
      LANDMARK_INDICES.rightRamus,
    ],
    connections: [
      [LANDMARK_INDICES.leftRamus, LANDMARK_INDICES.leftGonion],
      [LANDMARK_INDICES.leftGonion, LANDMARK_INDICES.chin],
      [LANDMARK_INDICES.rightRamus, LANDMARK_INDICES.rightGonion],
      [LANDMARK_INDICES.rightGonion, LANDMARK_INDICES.chin],
    ],
    color: '#ef4444', // Red
  },

  // Jaw Width
  jaw_width: {
    landmarkIndices: [
      LANDMARK_INDICES.leftGonion,
      LANDMARK_INDICES.rightGonion,
    ],
    connections: [
      [LANDMARK_INDICES.leftGonion, LANDMARK_INDICES.rightGonion],
    ],
    color: '#8b5cf6', // Purple
  },

  // Facial Thirds
  facial_thirds: {
    landmarkIndices: [
      LANDMARK_INDICES.forehead,
      LANDMARK_INDICES.nasion,
      LANDMARK_INDICES.noseBase,
      LANDMARK_INDICES.chin,
    ],
    connections: [
      [LANDMARK_INDICES.forehead, LANDMARK_INDICES.nasion],
      [LANDMARK_INDICES.nasion, LANDMARK_INDICES.noseBase],
      [LANDMARK_INDICES.noseBase, LANDMARK_INDICES.chin],
    ],
    color: '#06b6d4', // Cyan
  },

  // Eye Depth
  eye_depth: {
    landmarkIndices: [
      LANDMARK_INDICES.leftBrowInner,
      LANDMARK_INDICES.leftBrowOuter,
      LANDMARK_INDICES.rightBrowInner,
      LANDMARK_INDICES.rightBrowOuter,
      LANDMARK_INDICES.leftEyeUpper,
      LANDMARK_INDICES.rightEyeUpper,
    ],
    connections: [
      [LANDMARK_INDICES.leftBrowInner, LANDMARK_INDICES.leftBrowOuter],
      [LANDMARK_INDICES.rightBrowInner, LANDMARK_INDICES.rightBrowOuter],
    ],
    color: '#ec4899', // Pink
  },

  // Skin Quality (full face area)
  skin_quality: {
    landmarkIndices: [
      LANDMARK_INDICES.forehead,
      LANDMARK_INDICES.leftCheekbone,
      LANDMARK_INDICES.rightCheekbone,
      LANDMARK_INDICES.chin,
    ],
    connections: [
      [LANDMARK_INDICES.forehead, LANDMARK_INDICES.leftCheekbone],
      [LANDMARK_INDICES.forehead, LANDMARK_INDICES.rightCheekbone],
      [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.chin],
      [LANDMARK_INDICES.rightCheekbone, LANDMARK_INDICES.chin],
    ],
    color: '#14b8a6', // Teal
  },

  // Bizygomatic Width (cheekbone width)
  bizygomatic: {
    landmarkIndices: [
      LANDMARK_INDICES.leftCheekbone,
      LANDMARK_INDICES.rightCheekbone,
    ],
    connections: [
      [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.rightCheekbone],
    ],
    color: '#f97316', // Orange
  },

  // Philtrum Length (feature ID: 'philtrum')
  philtrum: {
    landmarkIndices: [
      LANDMARK_INDICES.noseBase,
      LANDMARK_INDICES.upperLipTop,
    ],
    connections: [
      [LANDMARK_INDICES.noseBase, LANDMARK_INDICES.upperLipTop],
    ],
    color: '#a855f7', // Purple
  },

  // Facial Symmetry (feature ID: 'symmetry')
  symmetry: {
    landmarkIndices: [
      LANDMARK_INDICES.leftEyeInner,
      LANDMARK_INDICES.rightEyeInner,
      LANDMARK_INDICES.leftCheekbone,
      LANDMARK_INDICES.rightCheekbone,
      LANDMARK_INDICES.leftGonion,
      LANDMARK_INDICES.rightGonion,
      LANDMARK_INDICES.noseTip,
    ],
    connections: [
      [LANDMARK_INDICES.leftEyeInner, LANDMARK_INDICES.noseTip],
      [LANDMARK_INDICES.rightEyeInner, LANDMARK_INDICES.noseTip],
      [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.noseTip],
      [LANDMARK_INDICES.rightCheekbone, LANDMARK_INDICES.noseTip],
    ],
    color: '#84cc16', // Lime
  },

  // Nasofrontal Angle (angle at nasion between glabella and nose tip)
  nasofrontal_angle: {
    landmarkIndices: [
      LANDMARK_INDICES.glabella,
      LANDMARK_INDICES.nasion,
      LANDMARK_INDICES.noseTip,
    ],
    connections: [
      [LANDMARK_INDICES.glabella, LANDMARK_INDICES.nasion],
      [LANDMARK_INDICES.nasion, LANDMARK_INDICES.noseTip],
    ],
    color: '#0ea5e9', // Sky blue
  },

  // Midface Ratio
  midface_ratio: {
    landmarkIndices: [
      LANDMARK_INDICES.leftEyeInner,
      LANDMARK_INDICES.leftEyeOuter,
      LANDMARK_INDICES.rightEyeInner,
      LANDMARK_INDICES.rightEyeOuter,
      LANDMARK_INDICES.mouthLeft,
      LANDMARK_INDICES.mouthRight,
    ],
    connections: [
      [LANDMARK_INDICES.leftEyeOuter, LANDMARK_INDICES.mouthLeft],
      [LANDMARK_INDICES.rightEyeOuter, LANDMARK_INDICES.mouthRight],
    ],
    color: '#d946ef', // Fuchsia
  },

  // Chin to Philtrum Ratio (feature ID: 'chin_philtrum')
  chin_philtrum: {
    landmarkIndices: [
      LANDMARK_INDICES.upperLipTop,
      LANDMARK_INDICES.lowerLipBottom,
      LANDMARK_INDICES.chin,
      LANDMARK_INDICES.noseBase,
    ],
    connections: [
      [LANDMARK_INDICES.noseBase, LANDMARK_INDICES.upperLipTop],
      [LANDMARK_INDICES.lowerLipBottom, LANDMARK_INDICES.chin],
    ],
    color: '#f43f5e', // Rose
  },

  // Bigonial Width (jaw width at angles)
  bigonial: {
    landmarkIndices: [
      LANDMARK_INDICES.leftGonion,
      LANDMARK_INDICES.rightGonion,
    ],
    connections: [
      [LANDMARK_INDICES.leftGonion, LANDMARK_INDICES.rightGonion],
    ],
    color: '#8b5cf6', // Purple
  },

  // ESR - Eye Separation Ratio (IPD relative to face width)
  esr: {
    landmarkIndices: [
      LANDMARK_INDICES.leftPupil,
      LANDMARK_INDICES.rightPupil,
      LANDMARK_INDICES.leftCheekbone,
      LANDMARK_INDICES.rightCheekbone,
    ],
    connections: [
      [LANDMARK_INDICES.leftPupil, LANDMARK_INDICES.rightPupil],
      [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.rightCheekbone],
    ],
    color: '#06b6d4', // Cyan
  },

  // PFL - Palpebral Fissure Length (horizontal eye aperture width)
  pfl: {
    landmarkIndices: [
      LANDMARK_INDICES.leftEyeInner,
      LANDMARK_INDICES.leftEyeOuter,
      LANDMARK_INDICES.rightEyeInner,
      LANDMARK_INDICES.rightEyeOuter,
    ],
    connections: [
      [LANDMARK_INDICES.leftEyeInner, LANDMARK_INDICES.leftEyeOuter],
      [LANDMARK_INDICES.rightEyeInner, LANDMARK_INDICES.rightEyeOuter],
    ],
    color: '#f472b6', // Pink
  },
};

// Get all primary landmarks for the base face mesh visualization
export const PRIMARY_LANDMARKS = [
  // Eyes
  LANDMARK_INDICES.leftEyeInner,
  LANDMARK_INDICES.leftEyeOuter,
  LANDMARK_INDICES.rightEyeInner,
  LANDMARK_INDICES.rightEyeOuter,
  LANDMARK_INDICES.leftEyeUpper,
  LANDMARK_INDICES.leftEyeLower,
  LANDMARK_INDICES.rightEyeUpper,
  LANDMARK_INDICES.rightEyeLower,
  
  // Eyebrows
  LANDMARK_INDICES.leftBrowInner,
  LANDMARK_INDICES.leftBrowOuter,
  LANDMARK_INDICES.rightBrowInner,
  LANDMARK_INDICES.rightBrowOuter,
  
  // Nose
  LANDMARK_INDICES.noseTip,
  LANDMARK_INDICES.noseBase,
  LANDMARK_INDICES.nasion,
  LANDMARK_INDICES.leftNostril,
  LANDMARK_INDICES.rightNostril,
  
  // Face outline
  LANDMARK_INDICES.leftCheekbone,
  LANDMARK_INDICES.rightCheekbone,
  LANDMARK_INDICES.leftGonion,
  LANDMARK_INDICES.rightGonion,
  LANDMARK_INDICES.chin,
  
  // Forehead
  LANDMARK_INDICES.forehead,
  LANDMARK_INDICES.glabella,
  
  // Mouth
  LANDMARK_INDICES.upperLipTop,
  LANDMARK_INDICES.upperLipBottom,
  LANDMARK_INDICES.lowerLipTop,
  LANDMARK_INDICES.lowerLipBottom,
  LANDMARK_INDICES.mouthLeft,
  LANDMARK_INDICES.mouthRight,
];

// Base face mesh connections for always-visible lines
export const BASE_CONNECTIONS: [number, number][] = [
  // Eye outlines
  [LANDMARK_INDICES.leftEyeInner, LANDMARK_INDICES.leftEyeUpper],
  [LANDMARK_INDICES.leftEyeUpper, LANDMARK_INDICES.leftEyeOuter],
  [LANDMARK_INDICES.leftEyeOuter, LANDMARK_INDICES.leftEyeLower],
  [LANDMARK_INDICES.leftEyeLower, LANDMARK_INDICES.leftEyeInner],
  
  [LANDMARK_INDICES.rightEyeInner, LANDMARK_INDICES.rightEyeUpper],
  [LANDMARK_INDICES.rightEyeUpper, LANDMARK_INDICES.rightEyeOuter],
  [LANDMARK_INDICES.rightEyeOuter, LANDMARK_INDICES.rightEyeLower],
  [LANDMARK_INDICES.rightEyeLower, LANDMARK_INDICES.rightEyeInner],
  
  // Eyebrows
  [LANDMARK_INDICES.leftBrowInner, LANDMARK_INDICES.leftBrowOuter],
  [LANDMARK_INDICES.rightBrowInner, LANDMARK_INDICES.rightBrowOuter],
  
  // Nose
  [LANDMARK_INDICES.nasion, LANDMARK_INDICES.noseTip],
  [LANDMARK_INDICES.noseTip, LANDMARK_INDICES.leftNostril],
  [LANDMARK_INDICES.noseTip, LANDMARK_INDICES.rightNostril],
  [LANDMARK_INDICES.leftNostril, LANDMARK_INDICES.noseBase],
  [LANDMARK_INDICES.rightNostril, LANDMARK_INDICES.noseBase],
  
  // Mouth
  [LANDMARK_INDICES.mouthLeft, LANDMARK_INDICES.upperLipTop],
  [LANDMARK_INDICES.upperLipTop, LANDMARK_INDICES.mouthRight],
  [LANDMARK_INDICES.mouthLeft, LANDMARK_INDICES.lowerLipBottom],
  [LANDMARK_INDICES.lowerLipBottom, LANDMARK_INDICES.mouthRight],
  
  // Jaw outline
  [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.leftGonion],
  [LANDMARK_INDICES.leftGonion, LANDMARK_INDICES.chin],
  [LANDMARK_INDICES.chin, LANDMARK_INDICES.rightGonion],
  [LANDMARK_INDICES.rightGonion, LANDMARK_INDICES.rightCheekbone],
  
  // Face outline top
  [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.forehead],
  [LANDMARK_INDICES.forehead, LANDMARK_INDICES.rightCheekbone],
];

