import type { Landmark } from './types';

// MediaPipe Face Landmarker singleton
let faceLandmarker: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export interface FaceDetectionResult {
  landmarks: Landmark[];
  confidence: number;
  faceDetected: boolean;
}

/**
 * Initialize MediaPipe Face Landmarker (singleton pattern)
 */
export async function initializeFaceLandmarker(): Promise<any> {
  // Return existing instance if available
  if (faceLandmarker) return faceLandmarker;
  
  // Return existing promise if currently initializing
  if (initPromise) return initPromise;
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      // Dynamic import for client-side only
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;
      
      // Load the WASM files - use the bundled version from the npm package
      const wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      
      // Create face landmarker with optimized settings
      faceLandmarker = await FaceLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU' // Use CPU for better compatibility, GPU can have issues in browsers
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });
      
      console.log('[FaceDetection] MediaPipe Face Landmarker initialized successfully');
      return faceLandmarker;
    } catch (error) {
      console.error('[FaceDetection] Failed to initialize Face Landmarker:', error);
      faceLandmarker = null;
      initPromise = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
}

/**
 * Detect face landmarks from a base64 image data URL
 */
export async function detectFaceFromImage(imageDataUrl: string): Promise<FaceDetectionResult> {
  // Ensure Face Landmarker is initialized
  const landmarker = await initializeFaceLandmarker();
  
  // Create image element from data URL
  const image = await loadImage(imageDataUrl);
  
  try {
    const result = landmarker.detect(image);
    
    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      // Convert MediaPipe landmarks to our format
      const landmarks: Landmark[] = result.faceLandmarks[0].map((lm: any) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      }));
      
      // Calculate confidence based on landmark count and distribution
      const confidence = calculateConfidence(landmarks);
      
      console.log(`[FaceDetection] Detected ${landmarks.length} landmarks with ${(confidence * 100).toFixed(1)}% confidence`);
      
      return {
        landmarks,
        confidence,
        faceDetected: true
      };
    }
    
    console.warn('[FaceDetection] No face detected in image');
    return {
      landmarks: [],
      confidence: 0,
      faceDetected: false
    };
  } catch (error) {
    console.error('[FaceDetection] Error during face detection:', error);
    throw new Error('Face detection failed. Please ensure your face is clearly visible.');
  }
}

/**
 * Detect face landmarks from a video element (for live preview)
 */
export async function detectFaceFromVideo(video: HTMLVideoElement): Promise<FaceDetectionResult> {
  // Ensure Face Landmarker is initialized
  const landmarker = await initializeFaceLandmarker();
  
  try {
    const result = landmarker.detect(video);
    
    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      const landmarks: Landmark[] = result.faceLandmarks[0].map((lm: any) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0
      }));
      
      return {
        landmarks,
        confidence: calculateConfidence(landmarks),
        faceDetected: true
      };
    }
    
    return {
      landmarks: [],
      confidence: 0,
      faceDetected: false
    };
  } catch (error) {
    console.error('[FaceDetection] Video detection error:', error);
    return {
      landmarks: [],
      confidence: 0,
      faceDetected: false
    };
  }
}

/**
 * Load an image from a data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = dataUrl;
  });
}

/**
 * Calculate confidence score based on landmark quality
 */
function calculateConfidence(landmarks: Landmark[]): number {
  if (landmarks.length !== 478) {
    return 0.5; // Lower confidence if not all landmarks detected
  }
  
  // Check if landmarks are within reasonable bounds
  let validLandmarks = 0;
  for (const lm of landmarks) {
    if (lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1) {
      validLandmarks++;
    }
  }
  
  // Calculate spread of landmarks (face should cover a reasonable portion of image)
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  
  // Face should cover at least 15% of the image dimension
  const spreadScore = Math.min(1, (xSpread + ySpread) / 0.6);
  
  // Combine scores
  const validityScore = validLandmarks / 478;
  
  return (validityScore * 0.7 + spreadScore * 0.3);
}

/**
 * Cleanup function to release resources
 */
export function closeFaceLandmarker() {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
    initPromise = null;
  }
}

/**
 * Check if face landmarker is ready
 */
export function isLandmarkerReady(): boolean {
  return faceLandmarker !== null && !isInitializing;
}

