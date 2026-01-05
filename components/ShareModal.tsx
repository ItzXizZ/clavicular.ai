'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  analysisResult: AnalysisResult;
}

export default function ShareModal({ isOpen, onClose, imageData, analysisResult }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareLink = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get top features for sharing (highest scoring features)
      const topFeatures = [...analysisResult.features]
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
        .map(f => ({
          name: f.name,
          value: f.value,
          isStrength: f.isStrength,
          category: f.category,
        }));

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
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
        throw new Error(errorData.error || 'Failed to generate share link');
      }

      const data = await response.json();
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  }, [imageData, analysisResult]);

  // Auto-generate link when modal opens
  useEffect(() => {
    if (isOpen && !shareUrl && !isGenerating) {
      generateShareLink();
    }
  }, [isOpen, shareUrl, isGenerating, generateShareLink]);

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#22c55e';
    if (score >= 6.5) return '#84cc16';
    if (score >= 5) return '#eab308';
    return '#ef4444';
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
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white text-center">Share Your Results</h2>
              <p className="text-zinc-500 text-sm text-center mt-1">Create a link that expires in 7 days</p>
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Preview of what will be shared */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img 
                      src={imageData} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: getScoreColor(analysisResult.overallScore) }}
                      >
                        {analysisResult.overallScore.toFixed(1)}
                      </span>
                      <span className="text-zinc-500 text-sm">/10</span>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">{analysisResult.rarity}</p>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}

              {/* Generate or Copy section */}
              {!shareUrl ? (
                <div className="w-full py-4 px-6 bg-zinc-900 border border-zinc-800 text-white rounded-xl flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full"
                  />
                  <span className="text-zinc-400">Generating link...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* URL display */}
                  <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-xl">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-zinc-300 text-sm outline-none truncate"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        copied 
                          ? 'bg-[#22c55e] text-white' 
                          : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }`}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </span>
                      ) : (
                        'Copy'
                      )}
                    </motion.button>
                  </div>

                  {/* Share options */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Twitter/X */}
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`https://twitter.com/intent/tweet?text=I%20scored%20${analysisResult.overallScore.toFixed(1)}/10%20on%20Clavicular.AI!%20Get%20your%20face%20rated%3A&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </motion.a>

                    {/* WhatsApp */}
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`https://wa.me/?text=I%20scored%20${analysisResult.overallScore.toFixed(1)}/10%20on%20Clavicular.AI!%20${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </motion.a>

                    {/* iMessage / SMS */}
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`sms:?body=I%20scored%20${analysisResult.overallScore.toFixed(1)}/10%20on%20Clavicular.AI!%20${encodeURIComponent(shareUrl)}`}
                      className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5 text-[#34C759]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
                      </svg>
                    </motion.a>
                  </div>

                  {/* Expiry notice */}
                  <p className="text-zinc-600 text-xs text-center flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Link expires in 7 days
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

