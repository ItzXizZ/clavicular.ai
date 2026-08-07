'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp, signInWithGoogle, getAuthErrorMessage } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  pendingAction?: string;
  initialReferralCode?: string;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

const inputClass =
  'w-full px-4 py-3 bg-black border border-white/25 rounded-xl text-white placeholder-white/35 focus:outline-none focus:border-[#22c55e] transition-colors';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Sign in to continue',
  description = 'Create an account or sign in to access this feature',
  pendingAction,
  initialReferralCode,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
      setMode('signup');
      validateReferralCode(initialReferralCode);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        setReferralCode(refCode);
        setMode('signup');
        validateReferralCode(refCode);
      }
    }
  }, [initialReferralCode, isOpen]);

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferrerName(null);
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.valid) {
        setReferrerName(data.referrerName);
      } else {
        setReferrerName(null);
      }
    } catch {
      setReferrerName(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    if (!initialReferralCode && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('ref')) {
        setReferralCode('');
        setReferrerName(null);
      }
    }
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    setMode('signin');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        if (referralCode && typeof window !== 'undefined') {
          sessionStorage.setItem('auth_referral_code', referralCode);
        }

        const { user } = await signUp(email, password, name);
        if (user && !user.email_confirmed_at) {
          setSuccessMessage('Check your email to confirm your account');
          setMode('signin');
        } else {
          onSuccess?.();
          handleClose();
        }
      } else if (mode === 'signin') {
        await signIn(email, password);
        onSuccess?.();
        handleClose();
      } else if (mode === 'forgot') {
        const { resetPassword } = await import('@/lib/auth');
        await resetPassword(email);
        setSuccessMessage('Check your email for a password reset link');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle(pendingAction, referralCode || undefined);
    } catch (err) {
      setError(getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0]));
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-black rounded-2xl border border-white/20 overflow-hidden"
          >
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-2">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-sm text-white/50">{description}</p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-black border border-white/40 rounded-lg"
                  >
                    <p className="text-sm text-white">{error}</p>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-black border border-[#22c55e] rounded-lg"
                  >
                    <p className="text-sm text-[#22c55e]">{successMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white hover:bg-[#22c55e] text-black font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {/* Monochrome Google mark — black only */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/15" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-black text-white/40">or continue with email</span>
                </div>
              </div>

              {mode === 'signup' && referrerName && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-black border border-[#22c55e] rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#22c55e]">Referral bonus active!</p>
                      <p className="text-xs text-white/50">
                        Invited by {referrerName}. You get a free 7-day Premium trial
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">
                        Referral Code <span className="text-white/40">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value.toUpperCase());
                            validateReferralCode(e.target.value);
                          }}
                          placeholder="Enter code for 7-day free trial"
                          className={`${inputClass} ${
                            referrerName
                              ? 'border-[#22c55e]'
                              : referralCode && !isValidatingCode
                                ? 'border-white'
                                : ''
                          }`}
                        />
                        {isValidatingCode && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-white/50 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                        {!isValidatingCode && referrerName && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {referralCode && !isValidatingCode && !referrerName && (
                        <p className="text-xs text-white/60 mt-1">Invalid referral code</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={inputClass}
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-sm text-white/50 hover:text-[#22c55e] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#22c55e] hover:bg-white text-black font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : mode === 'signin' ? (
                    'Sign In'
                  ) : mode === 'signup' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                {mode === 'signin' && (
                  <p className="text-sm text-white/50">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="text-[#22c55e] hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-sm text-white/50">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="text-[#22c55e] hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <p className="text-sm text-white/50">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#22c55e] hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
