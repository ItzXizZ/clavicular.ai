'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IPhoneMockup from '@/components/IPhoneMockup';
import CameraCapture from '@/components/CameraCapture';
import ToggleSwitch from '@/components/ToggleSwitch';
import ScoreDisplay from '@/components/ScoreDisplay';
import FlawsList from '@/components/FlawsList';
import ProtocolRecommendation from '@/components/ProtocolRecommendation';
import DisclaimerModal from '@/components/DisclaimerModal';
import FaceVisualization from '@/components/FaceVisualization';
import LeaderboardEntryModal from '@/components/LeaderboardEntryModal';
import Leaderboard from '@/components/Leaderboard';
import { useAppStore } from '@/lib/store';
import type { Landmark } from '@/lib/types';

export default function Home() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLeaderboardEntry, setShowLeaderboardEntry] = useState(false);
  const [isSubmittingToLeaderboard, setIsSubmittingToLeaderboard] = useState(false);
  const [leaderboardSuccess, setLeaderboardSuccess] = useState<{ rank: number } | null>(null);
  
  const {
    viewMode,
    profileMode,
    resultsView,
    protocolType,
    showProtocol,
    isAnalyzing,
    analysisResult,
    capturedImage,
    protocols,
    setViewMode,
    setProfileMode,
    setResultsView,
    setProtocolType,
    setShowProtocol,
    setIsAnalyzing,
    setAnalysisResult,
    setCapturedImage,
    setSelectedFeatureId,
    setProtocols,
  } = useAppStore();

  // Check localStorage for disclaimer acceptance
  useEffect(() => {
    const accepted = localStorage.getItem('clavicular-disclaimer-accepted');
    if (accepted === 'true') {
      setShowDisclaimer(false);
      setHasAcceptedDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('clavicular-disclaimer-accepted', 'true');
    setShowDisclaimer(false);
    setHasAcceptedDisclaimer(true);
  };

  // Handle image capture and analysis with real landmarks
  const handleCapture = useCallback(async (imageData: string, landmarks: Landmark[]) => {
    setIsAnalyzing(true);
    setCapturedImage(imageData);
    setAnalysisError(null);
    setFlashlightOn(false); // Turn off flashlight when capturing
    
    try {
      // Validate landmarks
      if (!landmarks || landmarks.length === 0) {
        throw new Error('No facial landmarks detected. Please ensure your face is clearly visible.');
      }
      
      if (landmarks.length !== 478) {
        console.warn(`[Analysis] Received ${landmarks.length} landmarks, expected 478`);
      }
      
      console.log(`[Analysis] Sending ${landmarks.length} real landmarks to API`);
      
      // Send to analysis API with real landmarks
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          profileMode,
          landmarks // Send real MediaPipe landmarks
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed. Please try again.');
      }
      
      const result = await response.json();
      
      // Add landmarks to analysis result for visualization
      result.analysis.landmarks = landmarks;
      
      setAnalysisResult(result.analysis);
      setProtocols(result.protocols);
      setViewMode('results');
      
      console.log(`[Analysis] Complete - Score: ${result.analysis.overallScore.toFixed(1)}/10`);
    } catch (error) {
      console.error('[Analysis] Error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      // Don't switch to results view on error
    } finally {
      setIsAnalyzing(false);
    }
  }, [profileMode, setAnalysisResult, setCapturedImage, setIsAnalyzing, setProtocols, setViewMode]);

  const handleBackToCamera = () => {
    setViewMode('camera');
    setShowProtocol(false);
    setAnalysisResult(null);
    setCapturedImage(null);
    setSelectedFeatureId(null);
    setAnalysisError(null);
    setFlashlightOn(false);
    setLeaderboardSuccess(null);
  };

  // Handle leaderboard entry submission
  const handleLeaderboardSubmit = async (name: string, age: number) => {
    if (!analysisResult || !capturedImage) return;

    setIsSubmittingToLeaderboard(true);
    try {
      // Get top features for the entry
      const topFeatures = analysisResult.features
        .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
        .slice(0, 6)
        .map(f => ({
          name: f.name,
          value: f.value,
          isStrength: f.isStrength,
          category: f.category,
        }));

      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age,
          imageData: capturedImage,
          overallScore: analysisResult.overallScore,
          harmScore: analysisResult.categoryScores.harm,
          miscScore: analysisResult.categoryScores.misc,
          anguScore: analysisResult.categoryScores.angu,
          dimoScore: analysisResult.categoryScores.dimo,
          rarity: analysisResult.rarity,
          features: topFeatures,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit to leaderboard');
      }

      const data = await response.json();
      setLeaderboardSuccess({ rank: data.rank });
      setShowLeaderboardEntry(false);
      // Automatically open the leaderboard after successful submission
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error submitting to leaderboard:', error);
      alert('Failed to submit to leaderboard. Please try again.');
    } finally {
      setIsSubmittingToLeaderboard(false);
    }
  };

  // Handle clicking leaderboard button - show entry form first if not submitted
  const handleOpenLeaderboard = () => {
    if (leaderboardSuccess) {
      // Already submitted, just show leaderboard
      setShowLeaderboard(true);
    } else {
      // Need to submit first - show entry form
      setShowLeaderboardEntry(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0c0f] flex flex-col lg:flex-row items-center justify-center gap-8 p-6 lg:p-12 relative overflow-hidden">
      {/* Flashlight glow ring effect */}
      <AnimatePresence>
        {flashlightOn && viewMode === 'camera' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {/* Outer glow ring */}
            <div 
              className="absolute w-[130vw] h-[130vh] rounded-[50%]"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.15) 55%, rgba(255,255,255,0.35) 65%, rgba(255,255,255,0.6) 75%, rgba(255,255,255,0.85) 85%, white 100%)',
                boxShadow: '0 0 200px 100px rgba(255,255,255,0.3), inset 0 0 200px 50px rgba(255,255,255,0.1)',
              }}
            />
            {/* Inner bright ring */}
            <div 
              className="absolute w-[115vw] h-[115vh] rounded-[50%]"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 55%, rgba(255,255,255,0.6) 80%, white 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onAccept={handleAcceptDisclaimer} 
      />

      {/* EXPANDED PROTOCOL VIEW - Full screen overlay */}
      <AnimatePresence>
        {showProtocol && viewMode === 'results' && analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0c0c0f]/95 backdrop-blur-xl"
          >
            <div className="h-full flex flex-col lg:flex-row">
              {/* Left side - Face preview (smaller on desktop) */}
              <div className="lg:w-[400px] flex-shrink-0 p-6 lg:p-8 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setShowProtocol(false)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back to Analysis</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-2xl font-bold"
                      style={{ 
                        color: analysisResult.overallScore >= 8 ? '#22c55e' : 
                               analysisResult.overallScore >= 6.5 ? '#84cc16' : 
                               analysisResult.overallScore >= 5 ? '#eab308' : '#ef4444'
                      }}
                    >
                      {analysisResult.overallScore.toFixed(1)}
                    </span>
                    <span className="text-zinc-500">/10</span>
                  </div>
                </div>

                {/* Face preview */}
                {capturedImage && (
                  <div className="relative flex-1 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 max-h-[300px] lg:max-h-none">
                    <img 
                      src={capturedImage} 
                      alt="Your face" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-semibold">Your Analysis</p>
                      <p className="text-zinc-400 text-sm">{analysisResult.rarity}</p>
                    </div>
                  </div>
                )}

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Harmony</p>
                    <p className="text-lg font-semibold text-white">{analysisResult.categoryScores.harm.toFixed(1)}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Angularity</p>
                    <p className="text-lg font-semibold text-white">{analysisResult.categoryScores.angu.toFixed(1)}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Dimorphism</p>
                    <p className="text-lg font-semibold text-white">{analysisResult.categoryScores.dimo.toFixed(1)}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Misc</p>
                    <p className="text-lg font-semibold text-white">{analysisResult.categoryScores.misc.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Right side - Protocols (expanded) */}
              <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {/* Protocol header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Improvement Protocol
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Personalized recommendations based on your analysis
                    </p>
                  </div>
                  <ToggleSwitch
                    leftLabel="Softmax"
                    rightLabel="Hardmax"
                    isRight={protocolType === 'hardmax'}
                    onChange={(isRight) => setProtocolType(isRight ? 'hardmax' : 'softmax')}
                  />
                </div>

                {/* Protocol content - much larger area */}
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-6 min-h-[500px]">
                  <ProtocolRecommendation protocols={protocols} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Branding (visible on larger screens) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:flex-1 lg:max-w-md"
      >
        <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">
          Welcome to <span className="text-[#22c55e]">Clavicular.AI</span>
        </h1>
        <p className="text-zinc-500 text-sm lg:text-base hidden lg:block">
          AI-powered facial analysis using MediaPipe Face Mesh with 478 landmark detection for precise, scientific measurements.
        </p>
      </motion.div>

      {/* iPhone with Camera/Results */}
      <div className="flex flex-col items-center gap-4">
        {/* Profile toggle (above phone) */}
        {viewMode === 'camera' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ToggleSwitch
              leftLabel="Front"
              rightLabel="Side"
              isRight={profileMode === 'side'}
              onChange={(isRight) => setProfileMode(isRight ? 'side' : 'front')}
            />
          </motion.div>
        )}

        {/* Error display */}
        <AnimatePresence>
          {analysisError && viewMode === 'camera' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 max-w-xs"
            >
              <p className="text-xs text-red-300 text-center">{analysisError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* iPhone */}
        <IPhoneMockup>
          <AnimatePresence mode="wait">
            {viewMode === 'camera' ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <CameraCapture 
                  onCapture={handleCapture} 
                  flashlightOn={flashlightOn}
                  onFlashlightToggle={() => setFlashlightOn(!flashlightOn)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col"
              >
                {/* Back button */}
                <button
                  onClick={handleBackToCamera}
                  className="absolute top-14 left-4 z-20 p-2 text-zinc-400 hover:text-white transition-colors bg-black/30 rounded-full backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Face visualization with real landmarks */}
                {capturedImage && analysisResult?.landmarks && (
                  <div className="relative flex-1 min-h-0">
                    <FaceVisualization 
                      imageData={capturedImage} 
                      landmarks={analysisResult.landmarks}
                    />
                  </div>
                )}

                {/* Score display overlay */}
                {analysisResult && (
                  <div className="absolute top-14 right-4 z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-zinc-800"
                    >
                      <div className="flex items-baseline gap-1">
                        <span 
                          className="text-3xl font-bold"
                          style={{ 
                            color: analysisResult.overallScore >= 8 ? '#22c55e' : 
                                   analysisResult.overallScore >= 6.5 ? '#84cc16' : 
                                   analysisResult.overallScore >= 5 ? '#eab308' : '#ef4444'
                          }}
                        >
                          {analysisResult.overallScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-zinc-500">/10</span>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* New analysis button */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <button
                    onClick={handleBackToCamera}
                    className="w-full py-2 px-4 bg-zinc-800/90 hover:bg-zinc-700 backdrop-blur-sm text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
                  >
                    New Analysis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </IPhoneMockup>
      </div>

      {/* Results Panel (right side on desktop) - only show when NOT in protocol view */}
      <AnimatePresence>
        {viewMode === 'results' && analysisResult && !showProtocol && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-[380px] lg:flex-shrink-0"
          >
            {/* Toggle between flaws/strengths + Leaderboard button */}
            <div className="flex items-center justify-between mb-4">
              <ToggleSwitch
                leftLabel="Flaws"
                rightLabel="Strengths"
                isRight={resultsView === 'strengths'}
                onChange={(isRight) => {
                  setResultsView(isRight ? 'strengths' : 'flaws');
                  setSelectedFeatureId(null); // Clear selection when switching views
                }}
              />
              
              {/* Leaderboard button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenLeaderboard}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all ${
                  leaderboardSuccess 
                    ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/50' 
                    : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/30'
                }`}
              >
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                </svg>
                <span className="text-sm font-medium text-amber-400">
                  {leaderboardSuccess ? `#${leaderboardSuccess.rank}` : 'Leaderboard'}
                </span>
              </motion.button>
            </div>

            {/* Content area */}
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              <FlawsList features={analysisResult.features} />
            </div>

            {/* Protocol button - opens expanded view */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProtocol(true)}
              className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
            >
              <span>View Improvement Protocol</span>
              <p className="text-green-200/70 text-xs mt-1">
                Personalized recommendations to boost your score
              </p>
            </motion.button>

            {/* Leaderboard rank badge - shown after submission */}
            {leaderboardSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-3 py-3 px-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                    </svg>
                    <span className="text-amber-400 font-semibold">
                      You&apos;re ranked #{leaderboardSuccess.rank}!
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="text-amber-500/80 text-sm hover:text-amber-400 transition-colors"
                  >
                    View →
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Entry Modal */}
      <LeaderboardEntryModal
        isOpen={showLeaderboardEntry}
        onClose={() => setShowLeaderboardEntry(false)}
        onSubmit={handleLeaderboardSubmit}
        isSubmitting={isSubmittingToLeaderboard}
      />

      {/* Leaderboard View */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </main>
  );
}
