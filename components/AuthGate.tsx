'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';
import { useAuth } from '@/lib/useAuth';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string; // Description of what feature requires auth
}

// Component that gates content behind authentication
export default function AuthGate({ children, fallback, feature = 'this feature' }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated, show the content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show fallback or default gated UI
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default gated UI
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-4 border border-zinc-700">
          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Sign in required</h3>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs">
          Create a free account to access {feature}
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/20"
        >
          Sign In / Create Account
        </button>
      </motion.div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to continue"
        description={`Create a free account to access ${feature}`}
      />
    </>
  );
}

// Hook-based gate for programmatic access control
interface UseAuthGateOptions {
  feature?: string;
}

export function useAuthGate(options: UseAuthGateOptions = {}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Execute pending action when user authenticates
  useEffect(() => {
    if (isAuthenticated && pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [isAuthenticated, pendingAction]);

  // Gate a callback - if user is not authenticated, show modal first
  const gatedAction = (callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      setPendingAction(() => callback);
      setShowAuthModal(true);
    }
  };

  const AuthModalComponent = (
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => {
        setShowAuthModal(false);
        setPendingAction(null);
      }}
      onSuccess={() => {
        // Action will be executed via useEffect when isAuthenticated changes
      }}
      title="Sign in to continue"
      description={options.feature ? `Create a free account to access ${options.feature}` : undefined}
    />
  );

  return {
    isAuthenticated,
    isLoading,
    gatedAction,
    AuthModal: AuthModalComponent,
    showAuthModal,
    setShowAuthModal,
  };
}

