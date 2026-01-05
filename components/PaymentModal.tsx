'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/useAuth';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (config: { hostedButtonId: string }) => {
        render: (selector: string) => { catch: (fn: (err: Error) => void) => void };
      };
    };
  }
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { isAuthenticated, refreshDbUser, dbUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);
  const wasOpenRef = useRef(false);
  
  // Check if user is premium
  const isPremium = dbUser?.accessTier === 'PREMIUM' || dbUser?.accessTier === 'premium';
  
  // Auto-close modal when premium status is detected
  useEffect(() => {
    if (isOpen && isPremium && wasOpenRef.current) {
      // User just became premium while modal was open
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, isPremium, onSuccess, onClose]);

  // Protocol is the only paid feature now
  const featureDetails = {
    title: 'Unlock Improvement Protocol',
    description: 'Get your personalized AI-powered plan to reach your potential',
    benefits: [
      'AI-generated personalized recommendations',
      'Specific product recommendations with links',
      'Softmax (non-invasive) & Hardmax options',
      'Expected improvement score for each fix',
      'Lifetime access to your protocol'
    ],
    price: '$9.99',
    originalPrice: '$19.99'
  };

  // Load PayPal SDK with hosted buttons component
  useEffect(() => {
    if (!isOpen || paypalLoaded) return;

    // Check if already loaded
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=BAAGzmtQ_nq0SsxJpso1t2edVHx7md7IlKb89o4QMjLI3hy8QB3rNTKXhobaImUrkwlkbhFAFSEPLmnVmY&components=hosted-buttons&disable-funding=venmo&currency=USD';
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setError('Failed to load payment system');
    document.body.appendChild(script);
  }, [isOpen, paypalLoaded]);

  // Render PayPal hosted button when SDK loads
  useEffect(() => {
    if (!paypalLoaded || !isOpen || !paypalContainerRef.current || paypalRendered.current) return;
    if (!window.paypal?.HostedButtons) return;

    paypalRendered.current = true;

    window.paypal.HostedButtons({
      hostedButtonId: "DP58SNXT44T9L",
    }).render("#paypal-button-container").catch((err: Error) => {
      console.error('PayPal render error:', err);
      setError('Failed to load payment button. Please refresh.');
    });
  }, [paypalLoaded, isOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      paypalRendered.current = false;
      setError(null);
    }
  }, [isOpen]);

  // Check if user has been upgraded to premium
  useEffect(() => {
    // Poll for premium status after PayPal button is shown
    if (!isOpen || !isAuthenticated || !paypalLoaded) return;
    
    const checkPremiumStatus = async () => {
      await refreshDbUser();
    };
    
    // Check every 5 seconds
    const interval = setInterval(checkPremiumStatus, 5000);
    
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, paypalLoaded, refreshDbUser]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-[#22c55e]/20 via-emerald-500/20 to-teal-500/20 p-6 pb-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22c55e] to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white text-center">
                  {featureDetails.title}
                </h2>
                <p className="text-zinc-400 text-center mt-2 text-sm">
                  {featureDetails.description}
                </p>
              </div>
              
              {/* Features */}
              <div className="p-6 space-y-4">
                {featureDetails.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">{benefit}</p>
                  </div>
                ))}
              </div>
              
              {/* Price */}
              <div className="px-6">
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-zinc-500 text-lg line-through">{featureDetails.originalPrice}</span>
                    <span className="text-3xl font-bold text-white">{featureDetails.price}</span>
                  </div>
                  <p className="text-center text-xs text-[#22c55e] mt-1">One-time payment • Lifetime access</p>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="px-6 pb-4">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
                    <p className="text-xs text-red-300 text-center">{error}</p>
                  </div>
                </div>
              )}
              
              {/* Payment section */}
              <div className="p-6 pt-2">
                {!isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-zinc-400 text-sm mb-3">Please sign in first to purchase</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-lg transition-colors"
                    >
                      Sign In First
                    </button>
                  </div>
                ) : (
                  <>
                    {/* PayPal Button Container */}
                    <div 
                      ref={paypalContainerRef}
                      id="paypal-button-container" 
                      className="min-h-[50px] mb-4"
                    />
                    
                    {/* Loading state */}
                    {!paypalLoaded && (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-zinc-400 text-sm">Loading payment options...</span>
                      </div>
                    )}

                    {/* Post-payment info */}
                    <div className="mt-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-300 font-medium mb-1">
                            Premium activates automatically
                          </p>
                          <p className="text-xs text-zinc-500">
                            After PayPal payment completes, your account will be upgraded within seconds. Refresh the page if needed.
                          </p>
                        </div>
                      </div>
                      
                      {/* Check status button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          setIsLoading(true);
                          await refreshDbUser();
                          setIsLoading(false);
                        }}
                        disabled={isLoading}
                        className="w-full mt-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Checking...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Check Payment Status
                          </span>
                        )}
                      </motion.button>
                    </div>
                    
                    <p className="text-center text-xs text-zinc-600 mt-3">
                      Secure payment via PayPal
                    </p>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-center gap-4 text-zinc-500 text-xs">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Lifetime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
