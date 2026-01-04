import type { Landmark, FacialMeasurements } from './types';
import {
  LANDMARK_INDICES,
  landmarkDistance2D,
  landmarkAngle,
  calculateCanthalTilt,
  getMidpoint
} from './mediapipe';

// Reference values for normalization based on anthropometric studies
// Farkas LG. Anthropometry of the Head and Face (1994)
const REFERENCE_FACE_WIDTH_MM = 140; // Average bizygomatic width in mm
const AVERAGE_IRIS_DIAMETER_MM = 11.7; // Used for calibration when iris landmarks available

/**
 * Calculate 3D distance between landmarks (uses z-depth for accuracy)
 */
function landmarkDistance3D(a: Landmark, b: Landmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = (b.z || 0) - (a.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate nasofrontal angle using 3D coordinates
 * Since this is a profile measurement, we use Y and Z dimensions
 * (Y = vertical, Z = depth/forward)
 */
function calculateNasofrontalAngle3D(glabella: Landmark, nasion: Landmark, noseTip: Landmark): number {
  // Vector from nasion to glabella (forehead direction) - use Y and Z
  const toGlabella = {
    y: glabella.y - nasion.y,
    z: (glabella.z || 0) - (nasion.z || 0)
  };
  
  // Vector from nasion to nose tip (nasal dorsum direction) - use Y and Z
  const toNoseTip = {
    y: noseTip.y - nasion.y,
    z: (noseTip.z || 0) - (nasion.z || 0)
  };
  
  // Calculate angle using dot product in Y-Z plane (profile view)
  const dotProduct = toGlabella.y * toNoseTip.y + toGlabella.z * toNoseTip.z;
  const magGlabella = Math.sqrt(toGlabella.y * toGlabella.y + toGlabella.z * toGlabella.z);
  const magNoseTip = Math.sqrt(toNoseTip.y * toNoseTip.y + toNoseTip.z * toNoseTip.z);
  
  if (magGlabella < 0.001 || magNoseTip < 0.001) {
    return 130; // Default to ideal if landmarks are too close
  }
  
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magGlabella * magNoseTip)));
  const angleRad = Math.acos(cosAngle);
  const angleDeg = angleRad * (180 / Math.PI);
  
  // The nasofrontal angle should typically be between 115-145 degrees
  // If we get a very different value, the z-depth data might be unreliable
  // In that case, estimate based on typical proportions
  if (angleDeg < 90 || angleDeg > 170) {
    // Z-depth likely unreliable, estimate based on typical face proportions
    // Use a slight estimate based on how prominent the nose appears
    const noseProminence = Math.abs((noseTip.z || 0) - (nasion.z || 0));
    const foreheadSlope = Math.abs((glabella.z || 0) - (nasion.z || 0));
    
    // More prominent nose = sharper angle
    if (noseProminence > 0.01) {
      return 125 + (noseProminence - foreheadSlope) * 200; // Estimate in reasonable range
    }
    return 130; // Default to ideal
  }
  
  return angleDeg;
}

/**
 * Calculate the centroid of multiple landmarks
 */
function getCentroid(landmarks: Landmark[]): Landmark {
  const n = landmarks.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };
  
  const sum = landmarks.reduce(
    (acc, lm) => ({
      x: acc.x + lm.x,
      y: acc.y + lm.y,
      z: acc.z + (lm.z || 0)
    }),
    { x: 0, y: 0, z: 0 }
  );
  
  return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
}

/**
 * Calculate all facial measurements from MediaPipe landmarks
 * Using rigorous anthropometric methodology
 * 
 * References:
 * - Farkas LG. Anthropometry of the Head and Face (1994)
 * - Facial Attractiveness: Evolutionary, Cognitive, and Social Perspectives (2011)
 * - Perrett et al. Facial attractiveness judgements (1998)
 */
export function calculateMeasurements(
  landmarks: Landmark[],
  imageWidth: number = 640,
  imageHeight: number = 480
): FacialMeasurements {
  // === PRIMARY LANDMARK EXTRACTION ===
  
  // Eye landmarks (using multiple points for accuracy)
  const leftEyeInner = landmarks[LANDMARK_INDICES.leftEyeInner];   // Endocanthion (en)
  const leftEyeOuter = landmarks[LANDMARK_INDICES.leftEyeOuter];   // Exocanthion (ex)
  const rightEyeInner = landmarks[LANDMARK_INDICES.rightEyeInner];
  const rightEyeOuter = landmarks[LANDMARK_INDICES.rightEyeOuter];
  const leftEyeUpper = landmarks[LANDMARK_INDICES.leftEyeUpper];
  const leftEyeLower = landmarks[LANDMARK_INDICES.leftEyeLower];
  const rightEyeUpper = landmarks[LANDMARK_INDICES.rightEyeUpper];
  const rightEyeLower = landmarks[LANDMARK_INDICES.rightEyeLower];
  
  // Calculate eye centers using all 4 corners for precision
  const leftEyeCenter = getCentroid([leftEyeInner, leftEyeOuter, leftEyeUpper, leftEyeLower]);
  const rightEyeCenter = getCentroid([rightEyeInner, rightEyeOuter, rightEyeUpper, rightEyeLower]);
  
  // Eyebrow landmarks
  const leftBrowInner = landmarks[LANDMARK_INDICES.leftBrowInner];
  const leftBrowOuter = landmarks[LANDMARK_INDICES.leftBrowOuter];
  const rightBrowInner = landmarks[LANDMARK_INDICES.rightBrowInner];
  const rightBrowOuter = landmarks[LANDMARK_INDICES.rightBrowOuter];
  
  // Nose landmarks
  const nasion = landmarks[LANDMARK_INDICES.nasion];           // Sellion (se) - deepest point of nasal root
  const noseTip = landmarks[LANDMARK_INDICES.noseTip];         // Pronasale (prn)
  const noseBase = landmarks[LANDMARK_INDICES.noseBase];       // Subnasale (sn)
  const leftNostril = landmarks[LANDMARK_INDICES.leftNostril]; // Alare (al)
  const rightNostril = landmarks[LANDMARK_INDICES.rightNostril];
  
  // Face width landmarks
  const leftCheekbone = landmarks[LANDMARK_INDICES.leftCheekbone];   // Zygion (zy)
  const rightCheekbone = landmarks[LANDMARK_INDICES.rightCheekbone];
  
  // Jaw landmarks
  const leftGonion = landmarks[LANDMARK_INDICES.leftGonion];   // Gonion (go) - jaw angle
  const rightGonion = landmarks[LANDMARK_INDICES.rightGonion];
  const leftJaw = landmarks[LANDMARK_INDICES.leftJaw];
  const rightJaw = landmarks[LANDMARK_INDICES.rightJaw];
  const chin = landmarks[LANDMARK_INDICES.chin];               // Gnathion (gn) / Menton (me)
  
  // Vertical reference landmarks
  const forehead = landmarks[LANDMARK_INDICES.forehead];       // Trichion (tr) approximation
  const glabella = landmarks[LANDMARK_INDICES.glabella];       // Glabella (g)
  
  // Lip landmarks
  const upperLipTop = landmarks[LANDMARK_INDICES.upperLipTop];     // Labiale superius (ls)
  const upperLipBottom = landmarks[LANDMARK_INDICES.upperLipBottom];
  const lowerLipTop = landmarks[LANDMARK_INDICES.lowerLipTop];
  const lowerLipBottom = landmarks[LANDMARK_INDICES.lowerLipBottom]; // Labiale inferius (li)
  const mouthLeft = landmarks[LANDMARK_INDICES.mouthLeft];         // Cheilion (ch)
  const mouthRight = landmarks[LANDMARK_INDICES.mouthRight];
  const philtrumTop = landmarks[LANDMARK_INDICES.philtrumTop] || noseBase;
  const philtrumBottom = landmarks[LANDMARK_INDICES.philtrumBottom] || upperLipTop;
  
  // === SCALE CALIBRATION ===
  // Use bizygomatic width as reference (most stable facial measurement)
  const bizygomaticNorm = landmarkDistance2D(leftCheekbone, rightCheekbone);
  const scaleFactor = REFERENCE_FACE_WIDTH_MM / bizygomaticNorm;
  
  // === INTERPUPILLARY DISTANCE (IPD) ===
  // Distance between pupil centers - fundamental facial proportion
  // Normal range: 54-68mm (Farkas), attractive range: 62-65mm
  const ipdNorm = landmarkDistance2D(leftEyeCenter, rightEyeCenter);
  const ipd = ipdNorm * scaleFactor;
  
  // === EYE SEPARATION RATIO (ESR) ===
  // IPD as percentage of bizygomatic width
  // Ideal: 46-50% (golden ratio approximation)
  const esr = (ipdNorm / bizygomaticNorm) * 100;
  
  // === PALPEBRAL FISSURE LENGTH (PFL) ===
  // Horizontal eye aperture width (endocanthion to exocanthion)
  // Normal: 27-32mm, measured bilaterally and averaged
  const leftPFLNorm = landmarkDistance2D(leftEyeInner, leftEyeOuter);
  const rightPFLNorm = landmarkDistance2D(rightEyeInner, rightEyeOuter);
  const pfl = ((leftPFLNorm + rightPFLNorm) / 2) * scaleFactor;
  
  // === PALPEBRAL FISSURE HEIGHT (PFH) ===
  // Vertical eye aperture - important for eye shape assessment
  const leftPFH = landmarkDistance2D(leftEyeUpper, leftEyeLower);
  const rightPFH = landmarkDistance2D(rightEyeUpper, rightEyeLower);
  const avgPFH = ((leftPFH + rightPFH) / 2) * scaleFactor;
  
  // === EYE ASPECT RATIO ===
  // PFL/PFH - determines eye shape (almond vs round)
  // Attractive range: 2.5-3.5 (slightly almond-shaped)
  const eyeAspectRatio = (leftPFLNorm / leftPFH + rightPFLNorm / rightPFH) / 2;
  
  // === CANTHAL TILT ===
  // Angle of palpebral fissure axis from horizontal
  // Positive = lateral canthus higher (attractive)
  // Ideal: +4 to +8 degrees
  const canthalTilt = calculateCanthalTilt(landmarks);
  
  // === INTERCANTHAL WIDTH ===
  // Distance between inner eye corners (endocanthion to endocanthion)
  // Should approximately equal PFL (en-en ≈ PFL)
  const intercanthalWidth = landmarkDistance2D(leftEyeInner, rightEyeInner) * scaleFactor;
  
  // === FACIAL WIDTH-TO-HEIGHT RATIO (fWHR) ===
  // Bizygomatic width / Upper face height (brow to upper lip)
  // Research shows fWHR correlates with perceived dominance/attractiveness
  // Ideal male: 1.8-2.0, Ideal female: 1.75-1.9
  const upperFaceHeightNorm = landmarkDistance2D(glabella, upperLipTop);
  const fwhr = bizygomaticNorm / upperFaceHeightNorm;
  
  // === FACIAL INDEX ===
  // Total face height / Bizygomatic width × 100
  // Classifies face shape: Euryprosopic (<84), Mesoprosopic (84-88), Leptoprosopic (>88)
  const totalFaceHeightNorm = landmarkDistance2D(forehead, chin);
  const facialIndex = (totalFaceHeightNorm / bizygomaticNorm) * 100;
  
  // === FACIAL THIRDS ===
  // Neoclassical canon: face divided into equal thirds
  // Upper: Trichion to Glabella, Middle: Glabella to Subnasale, Lower: Subnasale to Gnathion
  const upperThirdNorm = landmarkDistance2D(forehead, nasion);
  const middleThirdNorm = landmarkDistance2D(nasion, noseBase);
  const lowerThirdNorm = landmarkDistance2D(noseBase, chin);
  
  const facialThirds = {
    upper: upperThirdNorm / totalFaceHeightNorm,
    middle: middleThirdNorm / totalFaceHeightNorm,
    lower: lowerThirdNorm / totalFaceHeightNorm
  };
  
  // === LOWER FACE PROPORTIONS ===
  // Lower third should be subdivided: 1/3 upper lip, 2/3 chin
  const upperLipHeight = landmarkDistance2D(noseBase, upperLipBottom) * scaleFactor;
  const lowerLipToChin = landmarkDistance2D(lowerLipBottom, chin) * scaleFactor;
  
  // === PHILTRUM LENGTH ===
  // Distance from subnasale to labiale superius
  // Shorter philtrum (12-14mm) is generally more attractive
  const philtrumLength = landmarkDistance2D(philtrumTop, philtrumBottom) * scaleFactor;
  
  // === CHIN TO PHILTRUM RATIO ===
  // Chin height / Philtrum length
  // Ideal: ~2.0 (chin should be roughly twice philtrum length)
  const chinHeight = landmarkDistance2D(lowerLipBottom, chin) * scaleFactor;
  const chinPhiltrumRatio = philtrumLength > 0 ? chinHeight / philtrumLength : 2.0;
  
  // === MIDFACE RATIO ===
  // Vertical distance from pupil level to mouth commissure
  // Important for assessing midface length (long vs short midface)
  const eyeMidpoint = getMidpoint(leftEyeCenter, rightEyeCenter);
  const mouthMidpoint = getMidpoint(mouthLeft, mouthRight);
  const midfaceRatio = landmarkDistance2D(eyeMidpoint, mouthMidpoint) * scaleFactor;
  
  // === MOUTH WIDTH ===
  // Cheilion to cheilion distance
  // Ideal: roughly 1.5x nose width (alar width)
  const mouthWidth = landmarkDistance2D(mouthLeft, mouthRight) * scaleFactor;
  
  // === NASAL WIDTH (ALAR WIDTH) ===
  // Distance between alare points
  // Should approximately equal intercanthal width
  const nasalWidth = landmarkDistance2D(leftNostril, rightNostril) * scaleFactor;
  
  // === NASAL INDEX ===
  // (Nasal width / Nasal height) × 100
  const nasalHeight = landmarkDistance2D(nasion, noseBase) * scaleFactor;
  const nasalIndex = nasalHeight > 0 ? (nasalWidth / nasalHeight) * 100 : 70;
  
  // === GONIAL ANGLE ===
  // Angle at mandibular angle (gonion)
  // Measured between mandibular body (towards chin) and ramus (towards ear)
  // Ideal: 115-125° (sharper = more defined jaw)
  // Use average of both sides
  // Use ramus landmarks for the upward vector towards the ear
  const leftRamus = landmarks[LANDMARK_INDICES.leftRamus];
  const rightRamus = landmarks[LANDMARK_INDICES.rightRamus];
  
  // Gonial angle: angle at gonion between chin direction and ramus direction
  const leftGonialAngle = landmarkAngle(chin, leftGonion, leftRamus);
  const rightGonialAngle = landmarkAngle(chin, rightGonion, rightRamus);
  const gonialAngle = (leftGonialAngle + rightGonialAngle) / 2;
  
  // === NASOFRONTAL ANGLE ===
  // Angle between forehead slope and nasal dorsum at nasion
  // Ideal: 125-135° (deeper nasion = more defined)
  // This is a profile measurement - use z-depth for 3D calculation
  const nasofrontalAngle = calculateNasofrontalAngle3D(glabella, nasion, noseTip);
  
  // === NASOLABIAL ANGLE ===
  // Angle between columella and upper lip
  // Ideal male: 90-95°, Ideal female: 95-110°
  const nasolabialAngle = landmarkAngle(noseTip, noseBase, upperLipTop);
  
  // === BIGONIAL WIDTH ===
  // Distance between left and right gonion points
  // Determines jaw width perception
  const bigonialNorm = landmarkDistance2D(leftGonion, rightGonion);
  const bigonial = bigonialNorm * scaleFactor;
  
  // === BIGONIAL-BIZYGOMATIC RATIO ===
  // Jaw width relative to cheekbone width
  // Ideal: 0.75-0.85 (tapered face shape)
  const jawToFaceRatio = bigonialNorm / bizygomaticNorm;
  
  // === BROW POSITION ===
  // Vertical distance from brow to eye
  // Affects perceived expression and attractiveness
  const leftBrowEyeDist = landmarkDistance2D(
    getMidpoint(leftBrowInner, leftBrowOuter),
    leftEyeCenter
  ) * scaleFactor;
  const rightBrowEyeDist = landmarkDistance2D(
    getMidpoint(rightBrowInner, rightBrowOuter),
    rightEyeCenter
  ) * scaleFactor;
  const avgBrowHeight = (leftBrowEyeDist + rightBrowEyeDist) / 2;
  
  // === COMPREHENSIVE SYMMETRY SCORE ===
  const symmetryScore = calculateComprehensiveSymmetry(landmarks);
  
  // === GOLDEN RATIO ADHERENCE ===
  // Calculate how closely facial proportions adhere to phi (1.618)
  const goldenRatioScore = calculateGoldenRatioAdherence(
    bizygomaticNorm,
    totalFaceHeightNorm,
    ipdNorm,
    leftPFLNorm,
    rightPFLNorm,
    upperFaceHeightNorm
  );
  
  return {
    ipd,
    esr,
    pfl,
    canthalTilt,
    fwhr,
    facialThirds,
    philtrumLength,
    midfaceRatio,
    gonialAngle,
    nasofrontalAngle,
    chinPhiltrumRatio,
    bizygomatic: bizygomaticNorm * scaleFactor,
    bigonial,
    symmetryScore,
    // Extended measurements (stored in base object for now)
    // These can be used for more detailed analysis
  };
}

/**
 * Comprehensive facial symmetry calculation
 * Uses multiple landmark pairs and weighting based on perceptual importance
 */
function calculateComprehensiveSymmetry(landmarks: Landmark[]): number {
  // Define facial midline using the average x-coordinate of center landmarks
  // This gives us a proper vertical midline, not a centroid
  const nasion = landmarks[LANDMARK_INDICES.nasion];
  const noseTip = landmarks[LANDMARK_INDICES.noseTip];
  const noseBase = landmarks[LANDMARK_INDICES.noseBase];
  const chin = landmarks[LANDMARK_INDICES.chin];
  const glabella = landmarks[LANDMARK_INDICES.glabella];
  
  // Calculate midline x-coordinate as average of central face landmarks
  const midlineX = (nasion.x + noseTip.x + noseBase.x + chin.x + glabella.x) / 5;
  
  // Landmark pairs with perceptual weights
  // Higher weight = more noticeable asymmetry
  const weightedPairs: [number, number, number][] = [
    // [leftIndex, rightIndex, weight]
    [LANDMARK_INDICES.leftEyeInner, LANDMARK_INDICES.rightEyeInner, 1.5],    // Eyes highly noticeable
    [LANDMARK_INDICES.leftEyeOuter, LANDMARK_INDICES.rightEyeOuter, 1.5],
    [LANDMARK_INDICES.leftEyeUpper, LANDMARK_INDICES.rightEyeUpper, 1.2],
    [LANDMARK_INDICES.leftEyeLower, LANDMARK_INDICES.rightEyeLower, 1.2],
    [LANDMARK_INDICES.leftBrowInner, LANDMARK_INDICES.rightBrowInner, 1.3],
    [LANDMARK_INDICES.leftBrowOuter, LANDMARK_INDICES.rightBrowOuter, 1.3],
    [LANDMARK_INDICES.leftCheekbone, LANDMARK_INDICES.rightCheekbone, 1.0],
    [LANDMARK_INDICES.leftGonion, LANDMARK_INDICES.rightGonion, 1.1],       // Jaw asymmetry noticeable
    [LANDMARK_INDICES.leftNostril, LANDMARK_INDICES.rightNostril, 0.9],
    [LANDMARK_INDICES.mouthLeft, LANDMARK_INDICES.mouthRight, 1.2],
    [LANDMARK_INDICES.leftJaw, LANDMARK_INDICES.rightJaw, 1.0],
  ];
  
  let totalWeightedDiff = 0;
  let totalWeight = 0;
  
  for (const [leftIdx, rightIdx, weight] of weightedPairs) {
    const leftLandmark = landmarks[leftIdx];
    const rightLandmark = landmarks[rightIdx];
    
    if (!leftLandmark || !rightLandmark) continue;
    
    // Calculate distance from midline for each side
    const leftDistX = Math.abs(leftLandmark.x - midlineX);
    const rightDistX = Math.abs(rightLandmark.x - midlineX);
    
    // Also compare vertical positions (should be similar for paired landmarks)
    const verticalDiff = Math.abs(leftLandmark.y - rightLandmark.y);
    
    // Combined asymmetry metric
    const horizontalAsymmetry = Math.abs(leftDistX - rightDistX);
    const avgHorizontalDist = (leftDistX + rightDistX) / 2;
    
    if (avgHorizontalDist > 0.01) { // Avoid division by very small numbers
      // Normalize by average distance from midline
      const normalizedHorizAsym = horizontalAsymmetry / avgHorizontalDist;
      // Vertical asymmetry normalized by face width reference
      const normalizedVertAsym = verticalDiff / 0.15; // ~15% of normalized face width
      
      // Weight horizontal asymmetry more heavily as it's more noticeable
      const combinedAsym = normalizedHorizAsym * 0.7 + normalizedVertAsym * 0.3;
      
      totalWeightedDiff += combinedAsym * weight;
      totalWeight += weight;
    }
  }
  
  // Convert to 0-1 score where 1 is perfect symmetry
  const avgWeightedDiff = totalWeight > 0 ? totalWeightedDiff / totalWeight : 0;
  
  // Use exponential decay for more intuitive scoring
  // avgWeightedDiff of 0 = score of 1.0 (perfect)
  // avgWeightedDiff of 0.5 = score of ~0.78
  // avgWeightedDiff of 1.0 = score of ~0.61
  const symmetryScore = Math.exp(-avgWeightedDiff * 0.5);
  
  return Math.max(0, Math.min(1, symmetryScore));
}

/**
 * Calculate adherence to golden ratio (phi = 1.618) in facial proportions
 */
function calculateGoldenRatioAdherence(
  faceWidth: number,
  faceHeight: number,
  ipd: number,
  leftPFL: number,
  rightPFL: number,
  upperFaceHeight: number
): number {
  const phi = 1.618033988749895;
  
  const ratios = [
    faceHeight / faceWidth,                    // Face height to width
    faceWidth / upperFaceHeight,               // Face width to upper face height
    ipd / ((leftPFL + rightPFL) / 2),          // IPD to eye width
  ];
  
  let totalDeviation = 0;
  for (const ratio of ratios) {
    // Check how close to phi or 1/phi
    const deviationFromPhi = Math.abs(ratio - phi) / phi;
    const deviationFromInvPhi = Math.abs(ratio - 1/phi) / (1/phi);
    totalDeviation += Math.min(deviationFromPhi, deviationFromInvPhi);
  }
  
  const avgDeviation = totalDeviation / ratios.length;
  return Math.max(0, 1 - avgDeviation);
}

// Ideal values based on anthropometric research and attractiveness studies
export const IDEAL_VALUES = {
  // Farkas (1994), Perrett et al. (1998), Rhodes et al. (2001)
  ipd: { min: 58, max: 68, ideal: 63.5 },              // Normal range wider, ideal centered
  esr: { min: 44, max: 52, ideal: 47 },                // Golden ratio approximation
  pfl: { min: 26, max: 34, ideal: 30 },                // Palpebral fissure length
  canthalTilt: { min: 2, max: 10, ideal: 5 },          // Positive tilt attractive
  fwhr: { min: 1.7, max: 2.1, ideal: 1.9 },            // Width-height ratio
  facialThirds: { ideal: 0.333 },                       // Equal thirds
  philtrumLength: { min: 10, max: 18, ideal: 13 },     // Shorter preferred
  midfaceRatio: { min: 42, max: 54, ideal: 48 },       // Midface length
  gonialAngle: { min: 110, max: 130, ideal: 120 },     // Jaw angle
  nasofrontalAngle: { min: 115, max: 140, ideal: 130 }, // Nose-forehead angle
  chinPhiltrumRatio: { min: 1.6, max: 2.4, ideal: 2.0 }, // Chin to philtrum
  bizygomatic: { min: 130, max: 155, ideal: 142 },     // Face width
  bigonial: { min: 95, max: 125, ideal: 108 },         // Jaw width
  symmetryScore: { min: 0.80, max: 1.0, ideal: 0.95 }  // Bilateral symmetry
};

/**
 * Score a single measurement against its ideal range
 * Uses Gaussian-like falloff for more nuanced scoring
 */
export function scoreMeasurement(
  value: number,
  idealConfig: { min?: number; max?: number; ideal: number }
): { score: number; deviation: number } {
  const { min, max, ideal } = idealConfig;
  
  // Calculate range
  const range = (max !== undefined && min !== undefined) 
    ? max - min 
    : ideal * 0.3;
  
  // Calculate signed deviation
  const rawDeviation = (value - ideal) / (range / 2);
  const clampedDeviation = Math.max(-1.5, Math.min(1.5, rawDeviation));
  
  // Use Gaussian-like scoring for smooth falloff
  // Score = 10 * exp(-deviation^2 / 2σ^2), where σ = 0.7
  const sigma = 0.7;
  const gaussianScore = 10 * Math.exp(-(clampedDeviation * clampedDeviation) / (2 * sigma * sigma));
  
  // Ensure score is in valid range
  const score = Math.max(1, Math.min(10, gaussianScore));
  
  return {
    score,
    deviation: Math.max(-1, Math.min(1, rawDeviation))
  };
}

/**
 * Score facial thirds balance
 * Perfect thirds = 10, larger deviations reduce score
 */
export function scoreFacialThirds(
  thirds: { upper: number; middle: number; lower: number }
): { score: number; deviation: number } {
  const ideal = 1/3;
  
  // Calculate deviation for each third
  const upperDev = (thirds.upper - ideal) / ideal;
  const middleDev = (thirds.middle - ideal) / ideal;
  const lowerDev = (thirds.lower - ideal) / ideal;
  
  // RMS deviation for overall imbalance
  const rmsDeviation = Math.sqrt(
    (upperDev * upperDev + middleDev * middleDev + lowerDev * lowerDev) / 3
  );
  
  // Convert to score (0.1 = 10% deviation each = ~7.5 score)
  const score = 10 * Math.exp(-(rmsDeviation * rmsDeviation) / 0.02);
  
  // Primary deviation is the largest
  const maxDev = Math.max(Math.abs(upperDev), Math.abs(middleDev), Math.abs(lowerDev));
  const signedDev = upperDev !== 0 ? upperDev / Math.abs(upperDev) * maxDev : maxDev;
  
  return {
    score: Math.max(1, Math.min(10, score)),
    deviation: Math.max(-1, Math.min(1, signedDev))
  };
}
