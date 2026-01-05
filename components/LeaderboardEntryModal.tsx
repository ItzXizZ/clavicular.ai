'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string | null, age: number) => Promise<void>;
  isSubmitting: boolean;
  defaultName?: string | null;
  isUpdate?: boolean; // Whether this is an update to existing entry
}

export default function LeaderboardEntryModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  defaultName,
  isUpdate = false,
}: LeaderboardEntryModalProps) {
  const [name, setName] = useState(defaultName || '');
  const [age, setAge] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; age?: string; consent?: string }>({});
  
  // Update name when defaultName changes (e.g., when user logs in)
  useEffect(() => {
    if (defaultName && !name) {
      setName(defaultName);
    }
  }, [defaultName]);

  const validateAndSubmit = async () => {
    const newErrors: { name?: string; age?: string; consent?: string } = {};

    // Name is optional if defaultName is provided - user can override or use default
    const finalName = name.trim() || defaultName;
    if (!finalName) {
      newErrors.name = 'Please enter your name';
    } else if (finalName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const ageNum = parseInt(age);
    if (!age) {
      newErrors.age = 'Please enter your age';
    } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    if (!consent && !isUpdate) {
      newErrors.consent = 'You must consent to continue';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Pass null if using default name, otherwise pass the custom name
      await onSubmit(name.trim() || null, parseInt(age));
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
            className="w-full max-w-md bg-[#0c0c0f] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                {isUpdate ? 'Update Your Entry' : 'Join the Leaderboard'}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {isUpdate ? 'Update your profile on the leaderboard' : 'Show off your score to the world'}
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display Name
                  {defaultName && (
                    <span className="text-zinc-500 font-normal ml-2">(optional - using Google name)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultName || "Enter your name..."}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-black border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 transition-all ${
                    errors.name ? 'border-red-500' : 'border-zinc-700'
                  } disabled:opacity-50`}
                />
                {defaultName && !name && (
                  <p className="mt-1.5 text-xs text-zinc-500">Will use: {defaultName}</p>
                )}
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
                  className={`w-full px-4 py-3 bg-black border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 transition-all ${
                    errors.age ? 'border-red-500' : 'border-zinc-700'
                  } disabled:opacity-50`}
                />
                {errors.age && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.age}</p>
                )}
              </div>

              {/* Consent checkbox - only show for first-time entry */}
              {!isUpdate && (
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
                      <div className={`w-5 h-5 rounded-md border-2 transition-all peer-checked:bg-[#22c55e] peer-checked:border-[#22c55e] ${
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
              )}
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
                disabled={isSubmitting || (!consent && !isUpdate)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <span>{isUpdate ? 'Update Entry' : 'Join Leaderboard'}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
