'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/useAuth';
import { signOut } from '@/lib/auth';
import { authFetch } from '@/lib/apiClient';

// Generate a unique color based on a string (name/email)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness for visibility
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 50%)`;
}

// Generate a lighter shade for gradient
function stringToLightColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 65%)`;
}

interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

function DefaultAvatar({ name, size = 'md' }: DefaultAvatarProps) {
  const initials = name.charAt(0).toUpperCase();
  const color1 = stringToColor(name);
  const color2 = stringToLightColor(name + 'salt');
  
  const sizeClasses = size === 'sm' 
    ? 'w-9 h-9 text-sm' 
    : 'w-10 h-10 text-base';
  
  return (
    <div 
      className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-bold shadow-inner`}
      style={{
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      }}
    >
      {initials}
    </div>
  );
}

export default function UserMenu() {
  const { user, dbUser, isAuthenticated, isLoading, refreshDbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync hidden state with dbUser
  useEffect(() => {
    if (dbUser?.leaderboardEntry) {
      setIsHidden(dbUser.leaderboardEntry.hidden ?? false);
    }
  }, [dbUser?.leaderboardEntry]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleToggleVisibility = async () => {
    setIsToggling(true);
    try {
      const response = await authFetch('/api/leaderboard', {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to toggle visibility');
      }

      const data = await response.json();
      setIsHidden(data.hidden);
      
      // Refresh user data to update the UI
      await refreshDbUser();
    } catch (error) {
      console.error('Error toggling leaderboard visibility:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
    );
  }

  // Not authenticated - don't show anything
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - show user menu
  const displayName = dbUser?.displayName || dbUser?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = dbUser?.avatarUrl || user?.user_metadata?.avatar_url;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-800 transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-zinc-700"
          />
        ) : (
          <DefaultAvatar name={displayName} size="sm" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-black rounded-xl border border-zinc-800 shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <DefaultAvatar name={displayName} size="md" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Leaderboard rank if available */}
            {dbUser?.leaderboardEntry && (
              <div className="px-4 py-2 border-b border-zinc-800 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4V5H19C19.55 5 20 5.45 20 6V8C20 10.21 18.21 12 16 12H15.9C15.5 13.85 13.96 15.25 12.1 15.46V17H15C15.55 17 16 17.45 16 18V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21V18C8 17.45 8.45 17 9 17H10V15.46C8.04 15.25 6.5 13.85 6.1 12H6C3.79 12 2 10.21 2 8V6C2 5.45 2.45 5 3 5H8V4C8 2.9 8.9 2 10 2H12Z" />
                  </svg>
                  <span className="text-xs font-medium">
                    Score: {dbUser.leaderboardEntry.overallScore.toFixed(1)}/10
                  </span>
                </div>
              </div>
            )}

            {/* Menu items */}
            <div className="py-1">
              {/* Leaderboard visibility toggle - only show if user has entry */}
              {dbUser?.leaderboardEntry && (
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isHidden ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                      {!isHidden && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                    <span>Show on Leaderboard</span>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={handleToggleVisibility}
                    disabled={isToggling}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                      isToggling ? 'opacity-50' : ''
                    } ${!isHidden ? 'bg-[#22c55e]' : 'bg-zinc-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        !isHidden ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

