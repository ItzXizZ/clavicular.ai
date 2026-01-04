'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, age: number) => Promise<void>;
  isSubmitting: boolean;
}

export default function LeaderboardEntryModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: LeaderboardEntryModalProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; age?: string; consent?: string }>({});

  const validateAndSubmit = async () => {
    const newErrors: { name?: string; age?: string; consent?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your name';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const ageNum = parseInt(age);
    if (!age) {
      newErrors.age = 'Please enter your age';
    } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    if (!consent) {
      newErrors.consent = 'You must consent to continue';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(name.trim(), parseInt(age));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setAge('');
      setConsent(false);
      setErrors({});
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
          >
            {/* Header with trophy icon */}
            <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12ZM4 7V8C4 9.1 4.9 10 6 10V7H4ZM18 7H16V10C17.1 10 18 9.1 18 8V7Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Join the Leaderboard</h2>
                  <p className="text-sm text-zinc-400">Show off your score to the world</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    errors.name ? 'border-red-500' : 'border-zinc-700'
                  } disabled:opacity-50`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Age input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age..."
                  min="13"
                  max="120"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    errors.age ? 'border-red-500' : 'border-zinc-700'
                  } disabled:opacity-50`}
                />
                {errors.age && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.age}</p>
                )}
              </div>

              {/* Consent checkbox */}
              <div className="pt-2">
                <label className={`flex items-start gap-3 cursor-pointer group ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      disabled={isSubmitting}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all peer-checked:bg-amber-500 peer-checked:border-amber-500 ${
                      errors.consent ? 'border-red-500' : 'border-zinc-600 group-hover:border-zinc-500'
                    }`}>
                      <svg
                        className={`w-full h-full text-white transition-opacity ${consent ? 'opacity-100' : 'opacity-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-zinc-400 leading-relaxed">
                    I consent to having my <span className="text-white font-medium">photo</span>, <span className="text-white font-medium">name</span>, <span className="text-white font-medium">age</span>, and <span className="text-white font-medium">analysis results</span> displayed publicly on the leaderboard. I understand this information will be visible to all users.
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-2 text-xs text-red-400">{errors.consent}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={validateAndSubmit}
                disabled={isSubmitting || !consent}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12ZM4 7V8C4 9.1 4.9 10 6 10V7H4ZM18 7H16V10C17.1 10 18 9.1 18 8V7Z" />
                    </svg>
                    <span>Join Leaderboard</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

