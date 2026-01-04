import type { Landmark } from './types';

// MediaPipe Face Mesh landmark indices for key facial points
export const LANDMARK_INDICES = {
  // Eyes
  leftPupil: 468, // Left iris center (requires iris model)
  rightPupil: 473, // Right iris center (requires iris model)
  leftEyeInner: 133, // Left medial canthus
  leftEyeOuter: 33, // Left lateral canthus
  rightEyeInner: 362, // Right medial canthus
  rightEyeOuter: 263, // Right lateral canthus
  leftEyeUpper: 159,
  leftEyeLower: 145,
  rightEyeUpper: 386,
  rightEyeLower: 374,
  
  // Eyebrows
  leftBrowInner: 107,
  leftBrowOuter: 70,
  rightBrowInner: 336,
  rightBrowOuter: 300,
  
  // Nose
  noseTip: 1,
  noseBase: 2,
  nasion: 168, // Bridge of nose (between eyes)
  leftNostril: 129,
  rightNostril: 358,
  
  // Face outline / Cheekbones
  leftCheekbone: 234, // Left zygion
  rightCheekbone: 454, // Right zygion
  
  // Jaw
  leftGonion: 172, // Left jaw angle
  rightGonion: 397, // Right jaw angle
  leftJaw: 136, // Lower jawline point
  rightJaw: 365,
  // Ramus landmarks (near ear, going up from gonion for gonial angle)
  leftRamus: 127, // Left side upper jaw near ear
  rightRamus: 356, // Right side upper jaw near ear
  chin: 152, // Gnathion / Menton
  
  // Forehead / Top
  forehead: 10, // Trichion approximation
  glabella: 9, // Between eyebrows
  
  // Lips / Mouth
  upperLipTop: 0, // Subnasale point (Cupid's bow center)
  upperLipBottom: 13,
  lowerLipTop: 14,
  lowerLipBottom: 17,
  mouthLeft: 61,
  mouthRight: 291,
  // Philtrum - using more reliable landmarks
  philtrumTop: 2, // Subnasale (base of nose)
  philtrumBottom: 0, // Upper lip vermillion border
  
  // Face height reference
  faceTop: 10,
  faceBottom: 152,
} as const;

// Side profile landmarks (approximate, best with proper side angle)
export const SIDE_PROFILE_INDICES = {
  glabella: 9,
  nasion: 168,
  noseTip: 1,
  subnasale: 2,
  upperLip: 0,
  lowerLip: 17,
  pogonion: 152, // Chin tip
  gonion: 172, // Jaw angle (use left for left profile)
} as const;

// Face Mesh result type
export interface FaceMeshResult {
  landmarks: Landmark[];
  faceInView: boolean;
  confidence: number;
}

// Initialize MediaPipe Face Mesh
export async function initFaceMesh(): Promise<{
  detect: (video: HTMLVideoElement) => Promise<FaceMeshResult | null>;
  close: () => void;
}> {
  // Dynamic import for client-side only
  const vision = await import('@mediapipe/tasks-vision');
  
  const { FaceLandmarker, FilesetResolver } = vision;
  
  // Load the WASM files
  const wasmFileset = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  
  // Create face landmarker
  const faceLandmarker = await FaceLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'IMAGE',
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false
  });

  return {
    detect: async (video: HTMLVideoElement): Promise<FaceMeshResult | null> => {
      try {
        const result = faceLandmarker.detect(video);
        
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0].map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z
          }));
          
          return {
            landmarks,
            faceInView: true,
            confidence: 0.9 // MediaPipe doesn't expose per-detection confidence easily
          };
        }
        
        return null;
      } catch (error) {
        console.error('Face detection error:', error);
        return null;
      }
    },
    close: () => {
      faceLandmarker.close();
    }
  };
}

// Calculate distance between two landmarks (normalized coordinates)
export function landmarkDistance(a: Landmark, b: Landmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Calculate 2D distance (ignoring z)
export function landmarkDistance2D(a: Landmark, b: Landmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate angle between three points (angle at point b)
export function landmarkAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  
  const dotProduct = ba.x * bc.x + ba.y * bc.y;
  const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  return angleRad * (180 / Math.PI); // Convert to degrees
}

// Calculate canthal tilt (angle of eye axis from horizontal)
export function calculateCanthalTilt(landmarks: Landmark[]): number {
  const leftInner = landmarks[LANDMARK_INDICES.leftEyeInner];
  const leftOuter = landmarks[LANDMARK_INDICES.leftEyeOuter];
  const rightInner = landmarks[LANDMARK_INDICES.rightEyeInner];
  const rightOuter = landmarks[LANDMARK_INDICES.rightEyeOuter];
  
  // Calculate tilt for each eye (positive = outer corner higher = attractive)
  const leftTilt = Math.atan2(leftOuter.y - leftInner.y, leftOuter.x - leftInner.x) * (180 / Math.PI);
  const rightTilt = Math.atan2(rightInner.y - rightOuter.y, rightInner.x - rightOuter.x) * (180 / Math.PI);
  
  // Average and negate (because y increases downward in image coordinates)
  return -((leftTilt + rightTilt) / 2);
}

// Get midpoint between two landmarks
export function getMidpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2
  };
}

