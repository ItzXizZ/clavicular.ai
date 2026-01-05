'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface DatabaseUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  age: number | null;
  accessTier: string;
  leaderboardEntry: {
    id: string;
    overallScore: number;
    hidden: boolean;
    age: number;
    name: string;
  } | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  dbUser: DatabaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Global state store for auth - shared across all components
let globalAuthState: AuthState = {
  user: null,
  session: null,
  dbUser: null,
  isLoading: true,
  isAuthenticated: false,
};

// Subscribers for state changes
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach(callback => callback());
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return globalAuthState;
}

function setGlobalAuthState(newState: Partial<AuthState>) {
  globalAuthState = { ...globalAuthState, ...newState };
  notifySubscribers();
}

// Track if we've initialized
let initialized = false;
let initPromise: Promise<void> | null = null;

async function syncUserToDatabase(session: Session) {
  try {
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setGlobalAuthState({
        dbUser: data.user as DatabaseUser,
      });
    }
  } catch (error) {
    console.error('Failed to sync user to database:', error);
  }
}

async function initializeAuth() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setGlobalAuthState({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
        });
        
        await syncUserToDatabase(session);
      } else {
        setGlobalAuthState({
          user: null,
          session: null,
          dbUser: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setGlobalAuthState({ isLoading: false });
    }
    
    initialized = true;
  })();
  
  return initPromise;
}

export function useAuth() {
  // Subscribe to global state changes
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Initialize auth on first mount
  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setGlobalAuthState({
            user: session.user,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
          
          // Sync user to database on sign in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await syncUserToDatabase(session);
          }
        } else {
          setGlobalAuthState({
            user: null,
            session: null,
            dbUser: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh database user - now updates global state
  const refreshDbUser = useCallback(async () => {
    if (state.session) {
      await syncUserToDatabase(state.session);
    }
  }, [state.session]);

  return {
    ...state,
    refreshDbUser,
  };
}

// Simpler hook for just checking if user is authenticated
export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return isAuthenticated;
}
