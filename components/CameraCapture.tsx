'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { 
  detectFaceFromImage, 
  initializeFaceLandmarker,
  isLandmarkerReady 
} from '@/lib/faceDetection';
import type { Landmark } from '@/lib/types';

interface CameraCaptureProps {
  onCapture: (imageData: string, landmarks: Landmark[]) => void;
  flashlightOn?: boolean;
  onFlashlightToggle?: () => void;
  onShareClick?: () => void;
  hasResults?: boolean;
}

export default function CameraCapture({ onCapture, flashlightOn = false, onFlashlightToggle, onShareClick, hasResults = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'success' | 'failed'>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const { profileMode, isAnalyzing } = useAppStore();

  // Initialize MediaPipe Face Landmarker on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadModel = async () => {
      try {
        await initializeFaceLandmarker();
        if (isMounted) {
          setModelReady(true);
          console.log('[CameraCapture] Face detection model loaded');
        }
      } catch (err) {
        console.error('[CameraCapture] Failed to load face detection model:', err);
        if (isMounted) {
          setError('Failed to load face detection model. Please refresh.');
        }
      }
    };
    
    loadModel();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize camera
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Try different constraint options in order of preference
    const constraintOptions = [
      {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      {
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      {
        video: {
          facingMode: facing
        }
      },
      {
        video: true
      }
    ];

    for (const constraints of constraintOptions) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsReady(true);
          };
        }
        setHasCamera(true);
        setError(null);
        return; // Success, exit the loop
      } catch (err) {
        console.error('Camera attempt failed:', err);
        // Continue to next constraint option
      }
    }

    // All attempts failed
    setError('Camera in use by another app. Close other apps using your camera and refresh.');
    setHasCamera(false);
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, startCamera]);


  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    if (!modelReady) {
      setError('Face detection model still loading. Please wait...');
      return;
    }

    setDetectionStatus('detecting');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image only for front-facing camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    try {
      // Detect face landmarks using MediaPipe
      const result = await detectFaceFromImage(imageData);
      
      if (!result.faceDetected || result.landmarks.length === 0) {
        setDetectionStatus('failed');
        setError('No face detected. Please ensure your face is clearly visible and well-lit.');
        setTimeout(() => {
          setDetectionStatus('idle');
          setError(null);
        }, 3000);
        return;
      }
      
      if (result.confidence < 0.6) {
        setDetectionStatus('failed');
        setError('Face detection confidence too low. Please center your face and ensure good lighting.');
        setTimeout(() => {
          setDetectionStatus('idle');
          setError(null);
        }, 3000);
        return;
      }
      
      setDetectionStatus('success');
      console.log(`[CameraCapture] Face detected with ${result.landmarks.length} landmarks, confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
      // Pass both image and landmarks to parent
      onCapture(imageData, result.landmarks);
    } catch (err) {
      console.error('[CameraCapture] Detection error:', err);
      setDetectionStatus('failed');
      setError('Face detection failed. Please try again.');
      setTimeout(() => {
        setDetectionStatus('idle');
        setError(null);
      }, 3000);
    }
  }, [isReady, modelReady, onCapture, facingMode]);

  const isButtonDisabled = !isReady || !modelReady || isAnalyzing || detectionStatus === 'detecting';

  return (
    <div className="relative w-full h-full">
      {/* Camera view area - full height */}
      <div className="absolute inset-0">
        {/* Video feed - always rendered so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            display: hasCamera ? 'block' : 'none',
          }}
        />
        
        {hasCamera ? (
          <>
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                {/* Face oval guide */}
                <div 
                  className={`face-oval w-[140px] h-[190px] rounded-full transition-all duration-300 ${
                    profileMode === 'side' ? 'rotate-[-15deg]' : ''
                  } ${detectionStatus === 'success' ? 'border-green-500' : ''} ${detectionStatus === 'failed' ? 'border-red-500' : ''}`}
                />
                
                {/* Guide text */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 whitespace-nowrap text-center leading-tight"
                >
                  {detectionStatus === 'detecting' ? 'Detecting face...' :
                   detectionStatus === 'failed' ? 'Try again' :
                   profileMode === 'front' ? (
                    <>Center your face and<br />take a picture to be rated</>
                   ) : 'Turn to the side'}
                </motion.p>
              </motion.div>
            </div>

            {/* Model loading indicator */}
            {!modelReady && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#22c55e] border-t-transparent rounded-full"
                  />
                  <span className="text-xs text-zinc-300">Loading face detection model...</span>
                </div>
              </div>
            )}

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-4 left-4 right-4 z-10"
                >
                  <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-xs text-red-300">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyzing overlay */}
            <AnimatePresence>
              {(isAnalyzing || detectionStatus === 'detecting') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full"
                    />
                    <p className="text-sm text-zinc-300">
                      {detectionStatus === 'detecting' ? 'Detecting facial landmarks...' : 'Analyzing...'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* No camera / placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="face-oval w-[140px] h-[190px] rounded-full flex items-center justify-center">
              {error ? (
                <svg className="w-10 h-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-full h-full shimmer rounded-full"
                />
              )}
            </div>
            {error && (
              <p className="text-xs text-zinc-500 text-center max-w-[200px]">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera controls row - floating over camera */}
      <div className="absolute bottom-0 left-0 right-0 py-4 flex justify-center items-center gap-6 z-20">
        {/* Flash button - Left */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onFlashlightToggle}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm bg-black/40 hover:bg-black/60"
          title="Toggle flash"
        >
          <svg 
            className={`w-5 h-5 transition-colors duration-200 ${flashlightOn ? 'text-yellow-400' : 'text-zinc-400'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.button>

        {/* Capture button - Center */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={captureImage}
          disabled={isButtonDisabled}
          className="relative w-16 h-16 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-white/90" />
          {/* Inner button */}
          <motion.div 
            className={`absolute inset-[5px] rounded-full transition-colors duration-200 ${
              isButtonDisabled ? 'bg-zinc-500' : 'bg-white hover:bg-zinc-100'
            }`}
            animate={detectionStatus === 'detecting' ? { scale: [1, 0.95, 1] } : {}}
            transition={{ duration: 0.5, repeat: detectionStatus === 'detecting' ? Infinity : 0 }}
          />
          {/* Loading spinner overlay */}
          {detectionStatus === 'detecting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-7 h-7 border-2 border-zinc-400 border-t-zinc-700 rounded-full"
              />
            </div>
          )}
        </motion.button>

        {/* Share button - Right (disabled until results available) */}
        <motion.button
          whileHover={hasResults ? { scale: 1.1 } : {}}
          whileTap={hasResults ? { scale: 0.9 } : {}}
          onClick={hasResults ? onShareClick : undefined}
          disabled={!hasResults}
          className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
            hasResults 
              ? 'bg-black/40 hover:bg-black/60 cursor-pointer' 
              : 'bg-black/20 cursor-not-allowed opacity-40'
          }`}
          title={hasResults ? "Share results" : "Take a photo first to share"}
        >
          <svg 
            className={`w-5 h-5 ${hasResults ? 'text-[#22c55e]' : 'text-zinc-500'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
