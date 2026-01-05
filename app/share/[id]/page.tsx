'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ShareData {
  imageUrl: string;
  overallScore: number;
  harmScore: number;
  miscScore: number;
  anguScore: number;
  dimoScore: number;
  rarity: string;
  features: Array<{
    name: string;
    value: number;
    isStrength: boolean;
    category: string;
  }>;
  expiresAt: string;
  createdAt: string;
}

// Get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 8) return '#22c55e';
  if (score >= 6.5) return '#84cc16';
  if (score >= 5) return '#eab308';
  if (score >= 4) return '#f97316';
  return '#ef4444';
};

// Get rarity description
const getRarityDescription = (score: number): string => {
  if (score >= 9.1) return 'Near perfect';
  if (score >= 9) return 'Strikingly attractive';
  if (score >= 8.5) return 'Exceptionally attractive';
  if (score >= 8) return 'Surpassingly attractive';
  if (score >= 7.5) return 'Highly attractive';
  if (score >= 7) return 'Considerably attractive';
  if (score >= 6.5) return 'Noticeably attractive';
  if (score >= 6) return 'Decently attractive';
  if (score >= 5.5) return 'Moderately attractive';
  if (score >= 5) return 'Average';
  if (score >= 4.5) return 'Slightly below average';
  if (score >= 4) return 'Below average';
  return 'Below average';
};

// Get funny phrase based on score (third-person for sharing)
const getFunnyPhrase = (score: number): string => {
  if (score >= 9.5) return "Scientists are studying this guy's face for research purposes.";
  if (score >= 9) return "This guy's parents definitely won the genetic lottery.";
  if (score >= 8.5) return "Mirrors feel honored when this guy looks into them.";
  if (score >= 8) return "This guy could start arguments in comment sections just by existing.";
  if (score >= 7.5) return "This guy's bone structure has its own fan club.";
  if (score >= 7) return "Dating apps were basically designed for this guy.";
  if (score >= 6.5) return "This guy cleans up nicer than most people's best day.";
  if (score >= 6) return "Solid face. Would recommend this guy to a friend.";
  if (score >= 5.5) return "This guy is the main character in someone's story.";
  if (score >= 5) return "This guy is perfectly balanced, as all things should be.";
  if (score >= 4.5) return "This guy's personality better be incredible.";
  if (score >= 4) return "Beauty is subjective anyway, right?";
  if (score >= 3.5) return "At least this guy has a great sense of humor.";
  if (score >= 3) return "The algorithm is concerned about this guy.";
  if (score >= 2.5) return "This guy should consider a career in radio.";
  if (score >= 2) return "This guy's face has... character.";
  return "Even AI doesn't know what to say about this guy.";
};

export default function SharePage() {
  const params = useParams();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const fetchShareData = async () => {
      try {
        const response = await fetch(`/api/share?id=${params.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load share');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchShareData();
    }
  }, [params.id]);

  // Calculate time remaining
  useEffect(() => {
    if (!data?.expiresAt) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const expires = new Date(data.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [data?.expiresAt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-[#22c55e] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          {/* Expired icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            {error.includes('expired') ? 'Link Expired' : 'Link Not Found'}
          </h1>
          <p className="text-zinc-500 mb-8">
            {error.includes('expired') 
              ? 'This share link has expired. Share links are only valid for 7 days.'
              : 'This share link doesn\'t exist or may have been removed.'}
          </p>

          {/* CTA Button */}
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-green-500/25"
            >
              Get My Rating
            </motion.button>
          </Link>
          
          <p className="text-zinc-600 text-sm mt-4">
            Analyze your face with AI and see how you compare
          </p>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = getScoreColor(data.overallScore);
  const rarityDescription = getRarityDescription(data.overallScore);

  return (
    <div className="min-h-screen bg-[#0c0c0f] relative overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${scoreColor}15 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col gap-0">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-6 pb-2 flex items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#22c55e] font-bold text-xl">Clavicular.AI</span>
          </Link>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeLeft}</span>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12">
          {/* Funny phrase directly above content */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6 mt-6"
          >
            <p className="text-white text-2xl lg:text-3xl font-semibold">
              {getFunnyPhrase(data.overallScore)}
            </p>
          </motion.div>

          {/* Content row */}
          <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] items-center lg:items-stretch gap-6">
            {/* Left column - Image + CTA (boxed together on desktop) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-sm lg:w-[320px] lg:bg-black lg:border lg:border-zinc-800 lg:rounded-3xl lg:overflow-hidden lg:shadow-2xl lg:flex lg:flex-col"
            >
              {/* Image card */}
              <div className="relative aspect-[3/4] lg:aspect-auto lg:flex-1 lg:min-h-0 rounded-3xl lg:rounded-none overflow-hidden bg-zinc-900 lg:bg-black border border-zinc-800 lg:border-0 shadow-2xl lg:shadow-none">
                <img
                  src={data.imageUrl}
                  alt="Face analysis"
                  className="w-full h-full object-cover lg:absolute lg:inset-0"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Score badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-6 left-6 right-6"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">{rarityDescription}</p>
                      <p 
                        className="px-3 py-1 rounded-full text-sm font-medium inline-block"
                        style={{ backgroundColor: `${scoreColor}25`, color: scoreColor }}
                      >
                        {data.rarity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-5xl font-bold"
                        style={{ color: scoreColor }}
                      >
                        {data.overallScore.toFixed(1)}
                      </span>
                      <span className="text-zinc-500 text-xl">/10</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* CTA Button - Desktop only (inside the box) */}
              <div className="hidden lg:block p-4">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-green-500/25"
                  >
                    Get My Rating
                  </motion.button>
                </Link>
                <p className="text-zinc-600 text-sm text-center mt-3">
                  AI-powered facial analysis • Free to try
                </p>
              </div>
            </motion.div>

            {/* Right column - Stats panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md lg:max-w-none"
            >
              {/* Category scores */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-black border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Harmony</p>
                  <p className="text-2xl font-bold text-white">{data.harmScore.toFixed(1)}</p>
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${data.harmScore * 10}%`, backgroundColor: getScoreColor(data.harmScore) }}
                    />
                  </div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Angularity</p>
                  <p className="text-2xl font-bold text-white">{data.anguScore.toFixed(1)}</p>
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${data.anguScore * 10}%`, backgroundColor: getScoreColor(data.anguScore) }}
                    />
                  </div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Dimorphism</p>
                  <p className="text-2xl font-bold text-white">{data.dimoScore.toFixed(1)}</p>
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${data.dimoScore * 10}%`, backgroundColor: getScoreColor(data.dimoScore) }}
                    />
                  </div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Misc</p>
                  <p className="text-2xl font-bold text-white">{data.miscScore.toFixed(1)}</p>
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${data.miscScore * 10}%`, backgroundColor: getScoreColor(data.miscScore) }}
                    />
                  </div>
                </div>
              </div>

              {/* Top features */}
              {data.features && data.features.length > 0 && (
                <div className="bg-black border border-zinc-800 rounded-2xl p-4 mb-6 lg:mb-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Top Features</p>
                  <div className="space-y-2">
                    {[...data.features].sort((a, b) => b.value - a.value).slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">{feature.name}</span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: feature.value >= 5 ? '#22c55e' : '#ef4444' }}
                        >
                          {feature.value.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button - Mobile only */}
              <div className="lg:hidden">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-green-500/25"
                  >
                    Get My Rating
                  </motion.button>
                </Link>
                <p className="text-zinc-600 text-sm text-center mt-4">
                  AI-powered facial analysis • Free to try
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-6 text-center"
        >
          <p className="text-zinc-600 text-sm">
            Powered by <span className="text-[#22c55e]">Clavicular.AI</span> • Find out where you really stand
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

