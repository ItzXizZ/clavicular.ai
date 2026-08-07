'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/useAuth';
import { isPremiumUser, SUBSCRIPTION_PRICING } from '@/lib/subscription';
import { authFetch } from '@/lib/apiClient';
import PremiumPreview from '@/components/PremiumPreview';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PlanChoice = 'monthly' | 'yearly';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string>;
        createSubscription: (data: unknown, actions: {
          subscription: {
            create: (opts: { plan_id: string; custom_id?: string }) => Promise<string>;
          };
        }) => Promise<string>;
        onApprove: (data: { subscriptionID: string }) => Promise<void> | void;
        onError?: (err: Error) => void;
        onCancel?: () => void;
      }) => { render: (selector: string) => Promise<void>; close?: () => Promise<void> };
    };
  }
}

const BENEFITS = [
  'See your completely transformed face before you change a thing',
  'Full Softmax + Hardmax protocol built to remake every feature',
  'Fashion that reconstructs how you look from the neck down',
  'Physique plan that frames a new face, not a generic gym split',
  'Skincare and grooming stacked to push your score higher',
  'Beauty Bot on demand: new looks, products, and next moves',
];

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { isAuthenticated, refreshDbUser, dbUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  // Default to yearly — that's where the 7-day free trial lives
  const [plan, setPlan] = useState<PlanChoice>('yearly');
  // Once the user interacts with the protocol preview, keep the modal open
  // (no accidental backdrop dismiss).
  const [previewEngaged, setPreviewEngaged] = useState(false);
  const paypalRendered = useRef(false);
  const wasOpenRef = useRef(false);
  const planRef = useRef<PlanChoice>(plan);
  const buttonsInstanceRef = useRef<{ close?: () => Promise<void> } | null>(null);
  const renderGenerationRef = useRef(0);
  const refreshDbUserRef = useRef(refreshDbUser);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  const isPremium = isPremiumUser(dbUser);

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    refreshDbUserRef.current = refreshDbUser;
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [refreshDbUser, onSuccess, onClose]);

  useEffect(() => {
    if (isOpen && isPremium && wasOpenRef.current) {
      onSuccessRef.current?.();
      onCloseRef.current();
    }
    wasOpenRef.current = isOpen;
    if (!isOpen) setPreviewEngaged(false);
  }, [isOpen, isPremium]);

  // Load PayPal Subscriptions SDK
  useEffect(() => {
    if (!isOpen) return;

    const clientId =
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      'AZcJNZpff1CpmIO6fHbiSxSChTD9keQ3C45ozQHz5xXb9PYU3J-TXkeb-PT-saFAw8aTXic_Q86-AE-Y';

    const existing = document.querySelector('script[data-paypal-subscriptions]');
    if (window.paypal?.Buttons) {
      setPaypalLoaded(true);
      return;
    }
    if (existing) {
      existing.addEventListener('load', () => setPaypalLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.async = true;
    script.setAttribute('data-paypal-subscriptions', 'true');
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setError('Failed to load payment system');
    document.body.appendChild(script);
  }, [isOpen]);

  // Re-render buttons when plan changes.
  // Guarded against React Strict Mode's double-invoke (dev only), which would
  // otherwise fire two overlapping .render() calls into the same container
  // and cause PayPal's SDK to reject with "Failed to load payment button".
  useEffect(() => {
    if (!paypalLoaded || !isOpen || !isAuthenticated || !window.paypal?.Buttons) return;

    const container = document.getElementById('paypal-subscription-container');
    if (!container) return;

    const generation = ++renderGenerationRef.current;
    let cancelled = false;

    const monthlyPlan =
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY || 'P-31459051NS3442644NJ2AGXA';
    const yearlyPlan =
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY || 'P-30W465479X217384NNJ2AIIA';
    const planId = plan === 'yearly' ? yearlyPlan : monthlyPlan;

    if (!planId) {
      setError(
        plan === 'yearly'
          ? 'Yearly plan not configured yet. Finish creating it in PayPal, then add NEXT_PUBLIC_PAYPAL_PLAN_YEARLY.'
          : 'Monthly plan not configured. Set NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY.'
      );
      return;
    }

    const mountButtons = async () => {
      // Fully tear down any previous instance before mounting a new one —
      // clearing innerHTML alone doesn't destroy the underlying zoid component.
      if (buttonsInstanceRef.current?.close) {
        try {
          await buttonsInstanceRef.current.close();
        } catch {
          // ignore — instance may already be gone
        }
      }
      buttonsInstanceRef.current = null;
      if (cancelled || generation !== renderGenerationRef.current) return;

      container.innerHTML = '';
      setError(null);

      const instance = window.paypal!.Buttons({
        style: {
          shape: 'rect',
          color: 'black',
          layout: 'vertical',
          label: 'subscribe',
        },
        createSubscription: (_data, actions) => {
          return actions.subscription.create({
            plan_id: planId,
            custom_id: dbUser?.id,
          });
        },
        onApprove: async (data) => {
          setIsLoading(true);
          try {
            const res = await authFetch('/api/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                subscriptionId: data.subscriptionID,
                plan: planRef.current,
              }),
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || 'Failed to activate subscription');
            }
            await refreshDbUserRef.current();
            onSuccessRef.current?.();
            onCloseRef.current();
          } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Activation failed');
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
        },
      });

      buttonsInstanceRef.current = instance;
      paypalRendered.current = true;

      try {
        await instance.render('#paypal-subscription-container');
      } catch (err) {
        if (cancelled || generation !== renderGenerationRef.current) return;
        console.error('PayPal render error:', err);
        setError('Failed to load payment button. Please refresh.');
      }
    };

    mountButtons();

    return () => {
      cancelled = true;
    };
  }, [paypalLoaded, isOpen, isAuthenticated, plan, dbUser?.id]);

  useEffect(() => {
    if (!isOpen) {
      paypalRendered.current = false;
      setError(null);
      if (buttonsInstanceRef.current?.close) {
        buttonsInstanceRef.current.close().catch(() => {});
      }
      buttonsInstanceRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !paypalLoaded) return;
    // Poll quietly after subscribe; do not remount PayPal (refs keep callbacks stable).
    const interval = setInterval(() => refreshDbUserRef.current(), 8000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, paypalLoaded]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              // Stay open once the user is exploring the protocol preview.
              if (!previewEngaged) onClose();
            }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black border border-white/15 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 text-white/40 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid lg:grid-cols-[minmax(300px,380px)_1fr] min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
                {/* Payment column */}
                <div className="lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 lg:max-h-[92vh]">
                  <div className="relative border-b border-white/10 p-5 sm:p-6 pb-6">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-80"
                      style={{
                        background:
                          'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(34,197,94,0.18), transparent 70%)',
                      }}
                    />

                    <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-xs font-semibold mb-4 w-full justify-center bg-black">
                      YEARLY INCLUDES {SUBSCRIPTION_PRICING.trialDays}-DAY FREE TRIAL
                    </div>

                    <h2 className="relative text-2xl sm:text-3xl font-bold text-white text-center leading-tight tracking-tight">
                      Completely transform yourself
                    </h2>
                    <p className="relative text-white/50 text-center mt-3 text-sm leading-relaxed">
                      The world&apos;s most comprehensive full protocol. Softmax, Hardmax,
                      fashion, physique, skincare, and AI before/after in one system.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    {BENEFITS.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-white/75 text-sm">{benefit}</p>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 sm:px-6 mb-4">
                    <div className="grid grid-cols-2 gap-2 p-1 border border-white/10 rounded-xl bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => setPlan('monthly')}
                        className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                          plan === 'monthly'
                            ? 'bg-[#22c55e] text-black'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <div>$50/mo</div>
                        <div className="text-[10px] font-normal opacity-80">Monthly</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlan('yearly')}
                        className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all relative ${
                          plan === 'yearly'
                            ? 'bg-[#22c55e] text-black'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <span className="absolute -top-2 right-1 text-[9px] bg-black border border-[#22c55e] text-[#22c55e] px-1.5 py-0.5 rounded-full font-bold">
                          7-DAY FREE
                        </span>
                        <div>$399/yr</div>
                        <div className="text-[10px] font-normal opacity-80">~$33/mo</div>
                      </button>
                    </div>
                    <p className="text-center text-xs text-[#22c55e] mt-3">
                      {plan === 'yearly'
                        ? '7 days free, then $399/year · Cancel anytime'
                        : '$50/month billed immediately · Cancel anytime'}
                    </p>
                    <p className="text-center text-[11px] text-white/35 mt-2 leading-relaxed">
                      Total transformation: stylist, derm, makeup, and trainer energy
                      in one AI, for less than any of them alone.
                    </p>
                  </div>

                  {error && (
                    <div className="px-5 sm:px-6 pb-4">
                      <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-2">
                        <p className="text-xs text-white/70 text-center">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6 pt-2">
                    {!isAuthenticated ? (
                      <div className="text-center py-4">
                        <p className="text-white/45 text-sm mb-3">Sign in to subscribe</p>
                        <button
                          onClick={onClose}
                          className="px-6 py-2 bg-[#22c55e] hover:bg-white text-black font-medium rounded-lg transition-colors"
                        >
                          Sign In First
                        </button>
                      </div>
                    ) : (
                      <>
                        <div id="paypal-subscription-container" className="min-h-[50px] mb-4" />

                        {!paypalLoaded && (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                            <span className="ml-2 text-white/45 text-sm">Loading subscription options...</span>
                          </div>
                        )}

                        {isLoading && (
                          <p className="text-center text-sm text-[#22c55e] mb-2">
                            {plan === 'yearly' ? 'Activating your free trial...' : 'Activating subscription...'}
                          </p>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            setIsLoading(true);
                            await refreshDbUser();
                            setIsLoading(false);
                          }}
                          disabled={isLoading}
                          className="w-full py-2 border border-white/15 hover:border-[#22c55e] hover:text-[#22c55e] text-white/60 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          Refresh Access Status
                        </motion.button>

                        <p className="text-center text-xs text-white/25 mt-3">
                          Secure recurring billing via PayPal
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Protocol tabs preview: right on desktop, below on mobile */}
                <div className="flex flex-col min-h-[420px] lg:min-h-0 p-3 bg-black lg:max-h-[92vh]">
                  <PremiumPreview onUserEngage={() => setPreviewEngaged(true)} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
