'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IPhoneMockup from '@/components/IPhoneMockup';
import CameraCapture from '@/components/CameraCapture';
import FlawsList from '@/components/FlawsList';
import FaceVisualization from '@/components/FaceVisualization';
import LeaderboardEntryModal from '@/components/LeaderboardEntryModal';
import Leaderboard from '@/components/Leaderboard';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';
import ShareModal from '@/components/ShareModal';
import PaymentModal from '@/components/PaymentModal';
import BeforeAfterReveal from '@/components/BeforeAfterReveal';
import BeautyBot from '@/components/BeautyBot';
import ProtocolPlatform from '@/components/ProtocolPlatform';
import MarketingLanding from '@/components/MarketingLanding';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/useAuth';
import { authFetch } from '@/lib/apiClient';
import { isPremiumUser } from '@/lib/subscription';
import { loadSavedAdvice, peekSavedAdvice, persistAdvice } from '@/lib/saveAdvice';
import type { Landmark } from '@/lib/types';

export default function Home() {
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  
  // Auth state
  const { isAuthenticated, isLoading: authLoading, dbUser, user, refreshDbUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFeature, setAuthFeature] = useState<'leaderboard' | 'protocol' | 'flaws'>('leaderboard');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showReferralWelcome, setShowReferralWelcome] = useState(false);
  
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
  const isPremium = isPremiumUser(dbUser);
  
  // AI before/after transform (afterImageUrl lives in the persisted store —
  // see below — so a page refresh doesn't trigger a costly re-generation)
  const [isGeneratingAfter, setIsGeneratingAfter] = useState(false);
  const [showBeautyBot, setShowBeautyBot] = useState(false);
  
  const {
    viewMode,
    profileMode,
    resultsView,
    showProtocol,
    isAnalyzing,
    analysisResult,
    capturedImage,
    afterImageUrl,
    protocols,
    setViewMode,
    setProfileMode,
    setResultsView,
    setShowProtocol,
    setIsAnalyzing,
    setAnalysisResult,
    setCapturedImage,
    setAfterImageUrl,
    setSelectedFeatureId,
    setProtocols,
  } = useAppStore();

  // Check for referral code in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        setReferralCode(refCode);
        // If not authenticated, show signup modal with referral code
        if (!isAuthenticated && !authLoading) {
          setShowAuthModal(true);
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  // Handle pending action after OAuth redirect and auto-join leaderboard for new users
  useEffect(() => {
    if (isAuthenticated && !authLoading && dbUser) {
      const pendingAction = sessionStorage.getItem('auth_pending_action');
      const hasProcessedNewUser = sessionStorage.getItem('processed_new_user');
      const referralApplied = sessionStorage.getItem('referral_applied');
      
      // Show welcome message if referral was applied
      if (referralApplied) {
        sessionStorage.removeItem('referral_applied');
        setShowReferralWelcome(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowReferralWelcome(false), 5000);
      }
      
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
    setAfterImageUrl(null); // New photo — any previous after-image no longer applies
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
  }, [profileMode, setAnalysisResult, setCapturedImage, setAfterImageUrl, setIsAnalyzing, setProtocols, setViewMode]);

  const handleBackToCamera = () => {
    setViewMode('camera');
    setShowProtocol(false);
    setAnalysisResult(null);
    setCapturedImage(null);
    setSelectedFeatureId(null);
    setAnalysisError(null);
    setFlashlightOn(false);
    setLeaderboardSuccess(null);
    setAfterImageUrl(null);
    setShowBeautyBot(false);
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

  const openTransformPaywall = () => {
    if (!isAuthenticated) {
      setAuthFeature('protocol');
      setShowAuthModal(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const scrollToScan = () => {
    document.getElementById('scan')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handle viewing protocol (gated + premium check)
  const handleViewProtocol = () => {
    if (!isAuthenticated) {
      setAuthFeature('protocol');
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setShowPaymentModal(true);
      return;
    }
    
    setShowProtocol(true);
  };

  // Generate AI after-image (premium only — this is a real, paid OpenAI call)
  const [afterImageError, setAfterImageError] = useState<string | null>(null);
  const autoGenAttemptRef = useRef<string | null>(null);
  const afterHydratedRef = useRef(false);

  const imageFingerprint = (img: string | null) =>
    img ? `${img.length}:${img.slice(0, 64)}:${img.slice(-32)}` : null;

  // Restore saved after-image before any auto-generation
  useEffect(() => {
    if (afterHydratedRef.current || afterImageUrl) return;
    afterHydratedRef.current = true;

    const local = peekSavedAdvice<{ url?: string; sourceImageKey?: string }>('after_image');
    const key = imageFingerprint(capturedImage);
    if (local?.url && (!local.sourceImageKey || local.sourceImageKey === key)) {
      setAfterImageUrl(local.url);
      return;
    }

    void (async () => {
      const saved = await loadSavedAdvice<{ url?: string; sourceImageKey?: string }>('after_image');
      const currentKey = imageFingerprint(capturedImage);
      if (saved?.url && (!saved.sourceImageKey || saved.sourceImageKey === currentKey)) {
        setAfterImageUrl(saved.url);
      }
    })();
  }, [afterImageUrl, capturedImage, setAfterImageUrl]);

  const generateAfterImage = useCallback(async (force = false) => {
    if (!capturedImage || !analysisResult || !isAuthenticated || !isPremium) return;

    if (!force && afterImageUrl) return;

    setIsGeneratingAfter(true);
    setAfterImageError(null);
    try {
      const fixes = protocols.slice(0, 6).map((p) => p.fix?.title || p.issue);
      const flaws = analysisResult.features
        .filter((f) => !f.isStrength)
        .slice(0, 6)
        .map((f) => f.name);
      const response = await authFetch('/api/transform-image', {
        method: 'POST',
        body: JSON.stringify({
          image: capturedImage,
          features: analysisResult.features,
          fixes: fixes.length ? fixes : flaws,
          source: 'protocol',
          forceRegenerate: force,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.afterImageUrl) {
          setAfterImageUrl(data.afterImageUrl);
          await persistAdvice('after_image', {
            url: data.afterImageUrl,
            sourceImageKey: imageFingerprint(capturedImage),
            savedAt: new Date().toISOString(),
          });
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setAfterImageError(data.error || 'Failed to generate after photo');
      }
    } catch (err) {
      console.error('[Transform] client error:', err);
      setAfterImageError('Failed to generate after photo');
    } finally {
      setIsGeneratingAfter(false);
    }
  }, [capturedImage, analysisResult, isAuthenticated, isPremium, protocols, afterImageUrl, setAfterImageUrl]);

  // Auto-generate only when there is no saved after-image for this photo
  useEffect(() => {
    if (
      viewMode === 'results' &&
      isAuthenticated &&
      isPremium &&
      capturedImage &&
      analysisResult &&
      !afterImageUrl &&
      !isGeneratingAfter &&
      afterHydratedRef.current &&
      autoGenAttemptRef.current !== capturedImage
    ) {
      autoGenAttemptRef.current = capturedImage;
      void generateAfterImage(false);
    }
  }, [
    viewMode,
    isAuthenticated,
    isPremium,
    capturedImage,
    analysisResult,
    afterImageUrl,
    isGeneratingAfter,
    generateAfterImage,
  ]);

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
    <main
      className={`bg-black ${
        viewMode === 'results'
          ? 'fixed inset-0 overflow-hidden'
          : 'relative min-h-screen'
      }`}
    >
      {/* User Menu - Top Right */}
      <div className="fixed top-4 right-4 z-30">
        <UserMenu />
      </div>

      {/* Marketing funnel — camera / welcome only */}
      {viewMode === 'camera' && (
        <MarketingLanding onStartScan={scrollToScan} onStartTrial={openTransformPaywall} />
      )}

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


      {/* Referral Welcome Toast */}
      <AnimatePresence>
        {showReferralWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-[#22c55e] to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <div>
                <p className="font-semibold">Welcome! 7-day free trial unlocked</p>
                <p className="text-sm text-white/80">Your referral trial has been applied</p>
              </div>
              <button
                onClick={() => setShowReferralWelcome(false)}
                className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        pendingAction={authFeature}
        initialReferralCode={referralCode || undefined}
        title={
          referralCode 
            ? 'Sign up to claim your reward!' 
            : authFeature === 'leaderboard' ? 'Sign in for Leaderboard' : 
            authFeature === 'flaws' ? 'Sign in to View Flaws' :
            'Sign in for Protocol'
        }
        description={
          referralCode
            ? 'Create a free account with this referral code to get a 7-day Premium trial'
            : authFeature === 'leaderboard' 
            ? 'Create a free account to view and join the leaderboard' 
            : authFeature === 'flaws'
            ? 'Create a free account to see what\'s holding you back'
            : 'Create a free account to view your personalized improvement protocol'
        }
      />

      {/* Protocol platform — full screen (authenticated) */}
      <AnimatePresence>
        {showProtocol && viewMode === 'results' && analysisResult && isAuthenticated && (
          <ProtocolPlatform
            analysisResult={analysisResult}
            capturedImage={capturedImage}
            afterImageUrl={afterImageUrl}
            isGeneratingAfter={isGeneratingAfter}
            onClose={() => setShowProtocol(false)}
            onAfterGenerated={(url) => setAfterImageUrl(url)}
          />
        )}
      </AnimatePresence>

      {/* Centered stage — absolute fill + flex center (works when logged in) */}
      <div
        id="scan"
        className={
          viewMode === 'results'
            ? 'absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 p-3 lg:p-6 lg:gap-6'
            : 'relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 p-6 lg:p-12 scroll-mt-4'
        }
      >
      {/* Left: brand + subscription / transform (uses empty side of screen) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full lg:flex-1 lg:max-w-sm xl:max-w-md shrink-0"
      >
        <h1 className={`font-bold text-white mb-1 ${viewMode === 'results' ? 'text-xl lg:text-3xl' : 'text-2xl lg:text-4xl mb-2'}`}>
          {viewMode === 'results' ? (
            <>
              Welcome to <span className="text-[#22c55e]">Clavicular.AI</span>
            </>
          ) : (
            <>
              Your turn. <span className="text-[#22c55e]">Scan now.</span>
            </>
          )}
        </h1>
        <p className={`text-white/50 hidden lg:block ${viewMode === 'results' ? 'text-xs lg:text-sm' : 'text-sm lg:text-base'}`}>
          {viewMode === 'results'
            ? 'Your analysis found the gap. Close it.'
            : 'Free face rating in seconds. Then unlock fashion, physique, and your protocol.'}
        </p>

        {/* Subscription / transform — left column */}
        <AnimatePresence>
          {viewMode === 'results' && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-3 lg:mt-4"
            >
              {(() => {
                const potential = Math.min(
                  10,
                  analysisResult.overallScore +
                    protocols.reduce((sum, p) => sum + p.impactScore, 0) * 0.5
                );
                const gain = potential - analysisResult.overallScore;
                const topFlaws = [...analysisResult.features]
                  .filter((f) => !f.isStrength)
                  .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
                  .slice(0, 3);

                return (
                  <div className="rounded-2xl border border-[#22c55e]/35 bg-gradient-to-b from-[#22c55e]/10 to-transparent p-4 space-y-3.5">
                    {!isPremium ? (
                      <>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#22c55e] font-bold mb-2">
                            Your score is capped
                          </p>
                          <div className="flex items-end justify-between gap-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-white tabular-nums leading-none">
                                {analysisResult.overallScore.toFixed(1)}
                              </span>
                              <span className="text-white/25 text-xl font-light">→</span>
                              <span className="text-4xl font-bold text-[#22c55e] tabular-nums leading-none">
                                {potential.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-right shrink-0 pb-0.5">
                              <p className="text-lg font-bold text-[#22c55e] leading-none">
                                +{gain.toFixed(1)}
                              </p>
                              <p className="text-[10px] text-white/40 mt-0.5">pts available</p>
                            </div>
                          </div>
                          <p className="text-xs text-white/55 mt-2 leading-snug">
                            Unlock the protocol built for your face. See the AI after before you
                            commit.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={openTransformPaywall}
                          className="relative w-full rounded-xl overflow-hidden border border-white/15 group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/transformation.png"
                            alt="Facial transformation before and after"
                            className="w-full aspect-[16/10] object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90 bg-black/60 px-2 py-0.5 rounded">
                              Before
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-black bg-[#22c55e] px-2 py-0.5 rounded">
                              After · Unlock yours
                            </span>
                          </div>
                        </button>

                        {topFlaws.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                              Fix these first
                            </p>
                            <ol className="space-y-1.5">
                              {topFlaws.map((f, i) => (
                                <li
                                  key={f.id}
                                  className="flex items-center gap-2 text-[12px] text-white/85"
                                >
                                  <span className="w-5 h-5 rounded bg-white/10 text-white/50 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {i + 1}
                                  </span>
                                  <span className="truncate">{f.name}</span>
                                  <span className="ml-auto text-white/35 tabular-nums text-[11px]">
                                    {f.value.toFixed(1)}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="space-y-2">
                          <button
                            onClick={openTransformPaywall}
                            className="w-full py-3.5 bg-[#22c55e] hover:bg-white text-black text-sm font-bold rounded-xl transition-colors"
                          >
                            Start 7-day free trial
                          </button>
                          <p className="text-center text-[11px] text-white/45 leading-relaxed">
                            Yearly includes trial · then $399/yr
                            <span className="text-white/25"> · </span>
                            or $50/mo
                          </p>
                          <p className="text-center text-[10px] text-white/30">
                            AI future-self · Style & makeup · Fitness · Beauty Bot · cancel anytime
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#22c55e] font-semibold mb-1.5">
                            Protocol unlocked
                          </p>
                          <div className="flex items-baseline justify-center gap-2.5">
                            <span className="text-3xl font-bold text-white tabular-nums">
                              {analysisResult.overallScore.toFixed(1)}
                            </span>
                            <span className="text-white/30 text-lg">→</span>
                            <span className="text-3xl font-bold text-[#22c55e] tabular-nums">
                              {potential.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <BeforeAfterReveal
                          beforeImage={capturedImage}
                          afterImage={afterImageUrl}
                          isLocked={false}
                          isLoading={isGeneratingAfter}
                          onUnlock={() => {}}
                          compact
                          hideCta
                        />
                        {!afterImageUrl && !isGeneratingAfter && afterImageError && (
                          <button
                            type="button"
                            onClick={() => void generateAfterImage(true)}
                            className="w-full py-2 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-[11px] transition-colors"
                          >
                            After photo failed to generate. Tap to retry.
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleViewProtocol}
                            className="py-2.5 bg-[#22c55e] hover:bg-white text-black text-xs font-bold rounded-xl transition-colors"
                          >
                            View Protocol
                          </button>
                          <button
                            onClick={() => setShowBeautyBot(true)}
                            className="py-2.5 bg-black border border-white/25 hover:border-[#22c55e] text-white text-xs font-semibold rounded-xl transition-colors"
                          >
                            Beauty Bot
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* iPhone with Camera/Results */}
      <div className={`flex flex-col items-center gap-2 shrink-0 ${viewMode === 'results' ? 'lg:scale-[0.92] origin-center' : ''}`}>
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
                          <div className="bg-black border border-zinc-700 rounded-lg p-3 shadow-2xl w-44">
                            {/* Arrow pointing up */}
                            <div className="absolute -top-2 right-3 w-3 h-3 bg-black border-l border-t border-zinc-700 transform rotate-45" />
                            
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                </div>
                                <h4 className="text-xs font-semibold text-white">Share Results</h4>
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                                Generate a link to show off your score!
                              </p>
                              
                              <button
                                onClick={dismissShareTooltip}
                                className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium rounded transition-colors"
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
                        <span className="text-3xl font-bold text-[#22c55e]">
                          {analysisResult.overallScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-white/40">/10</span>
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
            className="w-full lg:w-[320px] xl:w-[360px] lg:flex-shrink-0"
          >
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
              {/* Score strip */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 font-medium">
                    Analysis
                  </p>
                  <p className="text-xs text-white/50 mt-0.5 truncate max-w-[160px]">
                    {analysisResult.rarity}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {analysisResult.overallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/30">/10</span>
                </div>
              </div>

              {/* Segmented control — full width */}
              <div className="grid grid-cols-2 rounded-xl border border-white/10 p-1 mb-1 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthFeature('flaws');
                      setShowAuthModal(true);
                      return;
                    }
                    setResultsView('flaws');
                    setSelectedFeatureId(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    resultsView === 'flaws'
                      ? 'bg-[#22c55e] text-black'
                      : 'text-white/45 hover:text-white'
                  }`}
                >
                  Flaws
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResultsView('strengths');
                    setSelectedFeatureId(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    resultsView === 'strengths'
                      ? 'bg-[#22c55e] text-black'
                      : 'text-white/45 hover:text-white'
                  }`}
                >
                  Strengths
                </button>
              </div>

              <p className="text-[10px] text-white/30 mb-1 px-0.5">
                Tap a row to highlight on face
              </p>

              <FlawsList features={analysisResult.features} />

              {/* Leaderboard — minimal footer */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewLeaderboard}
                  className="flex-1 py-2 rounded-lg text-white/70 text-xs font-medium hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Leaderboard
                </button>
                <button
                  type="button"
                  onClick={
                    isAuthenticated && hasLeaderboardEntry
                      ? handleUpdateLeaderboard
                      : handleJoinLeaderboard
                  }
                  disabled={isSubmittingToLeaderboard}
                  className="flex-1 py-2 rounded-lg bg-[#22c55e] hover:bg-white text-black text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingToLeaderboard
                    ? 'Saving…'
                    : isAuthenticated && hasLeaderboardEntry
                      ? leaderboardSuccess
                        ? `Rank #${leaderboardSuccess.rank}`
                        : 'Update rank'
                      : 'Join board'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      {/* end centered stage */}

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
        onTransformCta={() => {
          setShowLeaderboard(false);
          openTransformPaywall();
        }}
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
          if (analysisResult) {
            setShowProtocol(true);
          }
        }}
      />

      {/* Beauty Bot overlay (opened from left column) */}
      <AnimatePresence>
        {showBeautyBot && isPremium && analysisResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowBeautyBot(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowBeautyBot(false)}
                  className="text-white/70 hover:text-white text-sm px-2"
                >
                  Close
                </button>
              </div>
              <BeautyBot
                image={capturedImage}
                features={analysisResult.features}
                overallScore={analysisResult.overallScore}
                onAfterGenerated={(url) => setAfterImageUrl(url)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
