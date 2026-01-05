'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IPhoneMockup from '@/components/IPhoneMockup';
import CameraCapture from '@/components/CameraCapture';
import ToggleSwitch from '@/components/ToggleSwitch';
import ScoreDisplay from '@/components/ScoreDisplay';
import FlawsList from '@/components/FlawsList';
import ProtocolRecommendation from '@/components/ProtocolRecommendation';
import FaceVisualization from '@/components/FaceVisualization';
import LeaderboardEntryModal from '@/components/LeaderboardEntryModal';
import Leaderboard from '@/components/Leaderboard';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';
import ShareModal from '@/components/ShareModal';
import PaymentModal from '@/components/PaymentModal';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/useAuth';
import { authFetch } from '@/lib/apiClient';
import type { Landmark, ProtocolRecommendation as ProtocolRecommendationType } from '@/lib/types';

export default function Home() {
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  
  // Auth state
  const { isAuthenticated, isLoading: authLoading, dbUser, user, refreshDbUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFeature, setAuthFeature] = useState<'leaderboard' | 'protocol' | 'flaws'>('leaderboard');
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLeaderboardEntry, setShowLeaderboardEntry] = useState(false);
  const [isSubmittingToLeaderboard, setIsSubmittingToLeaderboard] = useState(false);
  const [leaderboardSuccess, setLeaderboardSuccess] = useState<{ rank: number } | null>(null);
  const [isNewUserFlow, setIsNewUserFlow] = useState(false); // Track if leaderboard modal is for new user
  
  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
  // Premium/payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFeature, setPaymentFeature] = useState<'flaws' | 'protocol' | 'premium'>('premium');
  const isPremium = dbUser?.accessTier === 'PREMIUM' || dbUser?.accessTier === 'premium';
  
  // AI Protocol state
  const [aiProtocols, setAiProtocols] = useState<ProtocolRecommendationType[]>([]);
  const [isLoadingAiProtocols, setIsLoadingAiProtocols] = useState(false);
  const [aiProtocolError, setAiProtocolError] = useState<string | null>(null);
  
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

  // Handle pending action after OAuth redirect and auto-join leaderboard for new users
  useEffect(() => {
    if (isAuthenticated && !authLoading && dbUser) {
      const pendingAction = sessionStorage.getItem('auth_pending_action');
      const hasProcessedNewUser = sessionStorage.getItem('processed_new_user');
      
      if (pendingAction) {
        sessionStorage.removeItem('auth_pending_action');
        
        // Execute the pending action
        if (pendingAction === 'flaws') {
          setResultsView('flaws');
          setSelectedFeatureId(null);
        } else if (pendingAction === 'leaderboard') {
          setShowLeaderboard(true);
        } else if (pendingAction === 'protocol') {
          setShowProtocol(true);
        }
      }
      
      // Auto-prompt new users to join leaderboard if they have analysis results
      // Only do this once per session
      if (!hasProcessedNewUser && !dbUser.leaderboardEntry && analysisResult && capturedImage) {
        sessionStorage.setItem('processed_new_user', 'true');
        // Show leaderboard entry modal for new users with welcome message
        setIsNewUserFlow(true);
        setShowLeaderboardEntry(true);
      }
    }
  }, [isAuthenticated, authLoading, dbUser, analysisResult, capturedImage, setResultsView, setSelectedFeatureId, setShowProtocol]);

  // Show share tooltip for new users when they view results
  useEffect(() => {
    if (viewMode === 'results' && analysisResult) {
      const hasSeenShareTooltip = localStorage.getItem('hasSeenShareTooltip');
      if (!hasSeenShareTooltip) {
        // Small delay so the UI settles first
        const timer = setTimeout(() => setShowShareTooltip(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [viewMode, analysisResult]);

  const dismissShareTooltip = () => {
    setShowShareTooltip(false);
    localStorage.setItem('hasSeenShareTooltip', 'true');
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

  // Handle gated actions - check auth first
  const handleGatedAction = (feature: 'leaderboard' | 'protocol', callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      setAuthFeature(feature);
      setShowAuthModal(true);
    }
  };

  // Handle viewing protocol (gated + premium check)
  const handleViewProtocol = () => {
    if (!isAuthenticated) {
      setAuthFeature('protocol');
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPaymentFeature('protocol');
      setShowPaymentModal(true);
      return;
    }
    
    setShowProtocol(true);
    // Fetch AI protocols if premium
    fetchAiProtocols();
  };

  // Fetch AI-powered protocol recommendations
  const fetchAiProtocols = async () => {
    if (!analysisResult || !isPremium) return;
    
    setIsLoadingAiProtocols(true);
    setAiProtocolError(null);
    
    try {
      const response = await authFetch('/api/ai-protocol', {
        method: 'POST',
        body: JSON.stringify({
          features: analysisResult.features,
          overallScore: analysisResult.overallScore,
          categoryScores: analysisResult.categoryScores,
          protocolType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch AI recommendations');
      }
      
      const data = await response.json();
      setAiProtocols(data.protocols);
    } catch (err) {
      console.error('AI Protocol error:', err);
      setAiProtocolError(err instanceof Error ? err.message : 'Failed to load AI recommendations');
    } finally {
      setIsLoadingAiProtocols(false);
    }
  };

  // Check if user already has a leaderboard entry
  const hasLeaderboardEntry = dbUser?.leaderboardEntry != null;

  // Handle viewing leaderboard (gated)
  const handleViewLeaderboard = () => {
    handleGatedAction('leaderboard', () => {
      setShowLeaderboard(true);
    });
  };

  // Handle joining leaderboard for first time (gated)
  const handleJoinLeaderboard = () => {
    handleGatedAction('leaderboard', () => {
      setShowLeaderboardEntry(true);
    });
  };

  // Handle updating leaderboard entry (direct update without modal)
  const handleUpdateLeaderboard = async () => {
    if (!analysisResult || !capturedImage || !dbUser) return;

    setIsSubmittingToLeaderboard(true);
    try {
      // Get top features for the entry (highest scoring features)
      const topFeatures = [...analysisResult.features]
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
        .map(f => ({
          name: f.name,
          value: f.value,
          isStrength: f.isStrength,
          category: f.category,
        }));

      // Use existing name and age from dbUser's leaderboard entry
      const existingEntry = dbUser.leaderboardEntry;
      const response = await authFetch('/api/leaderboard', {
        method: 'POST',
        body: JSON.stringify({
          name: dbUser.displayName || dbUser.name,
          age: existingEntry?.age || dbUser.age || 25, // fallback age if not set
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update leaderboard');
      }

      const data = await response.json();
      setLeaderboardSuccess({ rank: data.rank });
      // Refresh user data to keep it in sync
      await refreshDbUser();
      // Show the leaderboard after successful update
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      alert(error instanceof Error ? error.message : 'Failed to update leaderboard. Please try again.');
    } finally {
      setIsSubmittingToLeaderboard(false);
    }
  };

  // Handle auth success - execute pending action
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After successful auth, retry the action
    if (authFeature === 'protocol') {
      setShowProtocol(true);
    } else if (authFeature === 'leaderboard') {
      // Show leaderboard view - user can then choose to join or update
      setShowLeaderboard(true);
    } else if (authFeature === 'flaws') {
      // Switch to flaws view
      setResultsView('flaws');
      setSelectedFeatureId(null);
    }
  };

  // Handle leaderboard entry submission
  const handleLeaderboardSubmit = async (name: string | null, age: number) => {
    if (!analysisResult || !capturedImage) return;

    setIsSubmittingToLeaderboard(true);
    try {
      // Get top features for the entry (highest scoring features)
      const topFeatures = [...analysisResult.features]
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
        .map(f => ({
          name: f.name,
          value: f.value,
          isStrength: f.isStrength,
          category: f.category,
        }));

      const response = await authFetch('/api/leaderboard', {
        method: 'POST',
        body: JSON.stringify({
          // If name is null, the API will use the user's Google name from the database
          name: name || undefined,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit to leaderboard');
      }

      const data = await response.json();
      setLeaderboardSuccess({ rank: data.rank });
      setShowLeaderboardEntry(false);
      setIsNewUserFlow(false);
      // Refresh user data so the UI updates to show "Update" button
      await refreshDbUser();
      // Automatically open the leaderboard after successful submission
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error submitting to leaderboard:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit to leaderboard. Please try again.');
    } finally {
      setIsSubmittingToLeaderboard(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0c0f] flex flex-col lg:flex-row items-center justify-center gap-8 p-6 lg:p-12 relative overflow-hidden">
      {/* User Menu - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <UserMenu />
      </div>

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


      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        pendingAction={authFeature}
        title={
          authFeature === 'leaderboard' ? 'Sign in for Leaderboard' : 
          authFeature === 'flaws' ? 'Sign in to View Flaws' :
          'Sign in for Protocol'
        }
        description={
          authFeature === 'leaderboard' 
            ? 'Create a free account to view and join the leaderboard' 
            : authFeature === 'flaws'
            ? 'Create a free account to see what\'s holding you back'
            : 'Create a free account to view your personalized improvement protocol'
        }
      />

      {/* EXPANDED PROTOCOL VIEW - Full screen overlay (only if authenticated) */}
      <AnimatePresence>
        {showProtocol && viewMode === 'results' && analysisResult && isAuthenticated && (
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

                {/* AI Protocol Generation Button */}
                {isPremium && (
                  <div className="mb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={fetchAiProtocols}
                      disabled={isLoadingAiProtocols}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-lg transition-all"
                    >
                      {isLoadingAiProtocols ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-sm text-purple-300">Generating AI recommendations...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm text-purple-300">
                            {aiProtocols.length > 0 ? 'Regenerate AI Recommendations' : 'Generate AI Recommendations'}
                          </span>
                        </>
                      )}
                    </motion.button>
                    
                    {aiProtocolError && (
                      <p className="text-xs text-red-400 mt-2">{aiProtocolError}</p>
                    )}
                  </div>
                )}

                {/* Protocol content - much larger area */}
                <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-6 min-h-[500px]">
                  {/* Show AI protocols if available, otherwise show default */}
                  <ProtocolRecommendation protocols={aiProtocols.length > 0 ? aiProtocols : protocols} />
                  
                  {/* Premium badge */}
                  {aiProtocols.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-purple-400 text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>AI-Powered Recommendations</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Branding + Potential Score (visible on larger screens) */}
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
          Find out where you really stand. Get your face rated and see how you stack up on the leaderboard.
        </p>

        {/* Potential Score Section - Only visible to logged-in users with results */}
        <AnimatePresence>
          {isAuthenticated && viewMode === 'results' && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block mt-8"
            >
              <div className="bg-black rounded-2xl border border-zinc-800 p-6 relative overflow-hidden">
                
                {/* Header */}
                <p className="text-xs text-zinc-500 mb-4">Your Potential</p>

                {/* Current vs Potential Score */}
                <div className="flex items-center justify-center gap-6 mb-4">
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
                  <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="text-3xl font-bold text-[#22c55e]">
                    {Math.min(10, analysisResult.overallScore + (protocols.reduce((sum, p) => sum + p.impactScore, 0) * 0.5)).toFixed(1)}
                  </span>
                </div>

                {/* Improvement estimate */}
                <div className="bg-black/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Estimated improvement</span>
                    <span className="text-sm font-semibold text-[#22c55e]">
                      +{(protocols.reduce((sum, p) => sum + p.impactScore, 0) * 0.5).toFixed(1)} pts
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(analysisResult.overallScore / 10) * 100}%` }}
                      className="h-full bg-gradient-to-r from-zinc-600 to-zinc-500 rounded-full relative"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (protocols.reduce((sum, p) => sum + p.impactScore, 0) * 0.5 / analysisResult.overallScore) * 100)}%` }}
                        transition={{ delay: 0.5 }}
                        className="absolute right-0 top-0 h-full bg-gradient-to-r from-[#22c55e]/50 to-[#22c55e] rounded-full"
                        style={{ transform: 'translateX(100%)' }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* CTA Button */}
                {isPremium ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewProtocol}
                    className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
                  >
                    View Your Protocol
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPaymentFeature('protocol');
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Unlock Protocol - $9.99
                    </span>
                  </motion.button>
                )}

                {/* What's included */}
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">What&apos;s included:</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-personalized recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Product links & pricing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Softmax & Hardmax options</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* iPhone with Camera/Results */}
      <div className="flex flex-col items-center gap-4">
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
                  onShareClick={() => setShowShareModal(true)}
                  hasResults={!!analysisResult}
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
                {/* Top bar buttons */}
                <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center">
                  {/* Back button */}
                  <button
                    onClick={handleBackToCamera}
                    className="p-2 text-zinc-400 hover:text-white transition-colors bg-black/30 rounded-full backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Share button with tooltip */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowShareModal(true);
                        dismissShareTooltip();
                      }}
                      className={`p-2 text-zinc-400 hover:text-[#22c55e] transition-colors bg-black/30 rounded-full backdrop-blur-sm ${showShareTooltip ? 'ring-2 ring-[#22c55e] ring-offset-2 ring-offset-black animate-pulse' : ''}`}
                      title="Share results"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </motion.button>
                    
                    {/* Share tooltip for new users */}
                    <AnimatePresence>
                      {showShareTooltip && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="absolute top-full right-0 mt-2 z-50"
                        >
                          <div className="bg-black border border-zinc-700 rounded-xl p-4 shadow-2xl w-64">
                            {/* Arrow pointing up */}
                            <div className="absolute -top-2 right-4 w-4 h-4 bg-black border-l border-t border-zinc-700 transform rotate-45" />
                            
                            <div className="relative">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-1">Share Your Results</h4>
                                  <p className="text-xs text-zinc-400 leading-relaxed">
                                    Generate a shareable link to show off your score! Links expire after 24 hours.
                                  </p>
                                </div>
                              </div>
                              
                              <button
                                onClick={dismissShareTooltip}
                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                Got it!
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Face visualization with real landmarks */}
                {capturedImage && analysisResult?.landmarks && (
                  <div className="relative flex-1 min-h-0">
                    <FaceVisualization 
                      imageData={capturedImage} 
                      landmarks={analysisResult.landmarks}
                    />
                  </div>
                )}

                {/* Score display overlay - positioned below the top bar */}
                {analysisResult && (
                  <div className="absolute top-28 right-4 z-10">
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
            {/* Toggle between flaws/strengths + Leaderboard buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  leftLabel="Flaws"
                  rightLabel="Strengths"
                  isRight={resultsView === 'strengths'}
                  onChange={(isRight) => {
                    if (!isRight && !isAuthenticated) {
                      // Trying to view flaws without being signed in
                      setAuthFeature('flaws');
                      setShowAuthModal(true);
                      return;
                    }
                    setResultsView(isRight ? 'strengths' : 'flaws');
                    setSelectedFeatureId(null); // Clear selection when switching views
                  }}
                />
                {/* Lock icon when not authenticated */}
                {!isAuthenticated && resultsView === 'strengths' && (
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              
              {/* Leaderboard buttons */}
              <div className="flex items-center gap-2">
                {/* View Leaderboard button - always available */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewLeaderboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/30 hover:border-white/50 rounded-lg transition-all"
                >
                  {!isAuthenticated && (
                    <svg className="w-3 h-3 text-[#22c55e]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <svg className="w-4 h-4 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                  </svg>
                </motion.button>

                {/* Join/Update button - depends on existing entry */}
                {isAuthenticated ? (
                  hasLeaderboardEntry ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUpdateLeaderboard}
                      disabled={isSubmittingToLeaderboard}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                      {isSubmittingToLeaderboard ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Update</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleJoinLeaderboard}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-green-500/20"
                    >
                      <span>Join</span>
                    </motion.button>
                  )
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleJoinLeaderboard}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black border border-[#22c55e]/50 hover:border-[#22c55e] text-[#22c55e] text-sm font-medium rounded-lg transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Join</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              <FlawsList features={analysisResult.features} />
            </div>

            {/* Mobile Potential Score Card - Only on mobile for logged-in users */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:hidden mt-3 bg-black rounded-xl border border-zinc-800 p-4"
              >
                <div className="flex flex-col items-center mb-3">
                  <span className="text-xs text-zinc-500 mb-2">Your Potential</span>
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span 
                      className="text-xl font-bold"
                      style={{ 
                        color: analysisResult.overallScore >= 8 ? '#22c55e' : 
                               analysisResult.overallScore >= 6.5 ? '#84cc16' : 
                               analysisResult.overallScore >= 5 ? '#eab308' : '#ef4444'
                      }}
                    >
                      {analysisResult.overallScore.toFixed(1)}
                    </span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-xl font-bold text-[#22c55e]">
                      {Math.min(10, analysisResult.overallScore + (protocols.reduce((sum, p) => sum + p.impactScore, 0) * 0.5)).toFixed(1)}
                    </span>
                  </div>
                </div>
                
                {isPremium ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewProtocol}
                    className="w-full py-2.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white text-sm font-semibold rounded-lg"
                  >
                    View Your Protocol
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPaymentFeature('protocol');
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock Protocol - $9.99
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Leaderboard rank badge - shown after submission or for existing entry */}
            {(leaderboardSuccess || hasLeaderboardEntry) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-3 py-3 px-6 bg-black border border-[#22c55e]/30 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                    </svg>
                    <span className="text-[#22c55e] font-semibold">
                      {leaderboardSuccess 
                        ? `You're ranked #${leaderboardSuccess.rank}!`
                        : `Score: ${dbUser?.leaderboardEntry?.overallScore.toFixed(1)}/10`
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="text-[#22c55e]/80 text-sm hover:text-[#22c55e] transition-colors"
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
        onClose={() => {
          setShowLeaderboardEntry(false);
          setIsNewUserFlow(false);
        }}
        onSubmit={handleLeaderboardSubmit}
        isSubmitting={isSubmittingToLeaderboard}
        defaultName={dbUser?.name || user?.user_metadata?.name || null}
        isNewUser={isNewUserFlow}
      />

      {/* Leaderboard View */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Share Modal */}
      {analysisResult && capturedImage && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageData={capturedImage}
          analysisResult={analysisResult}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={async () => {
          await refreshDbUser();
          // Open protocol after successful payment
          if (analysisResult) {
            setShowProtocol(true);
            fetchAiProtocols();
          }
        }}
      />
    </main>
  );
}
