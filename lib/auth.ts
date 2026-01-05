import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

// Sign up with email and password
export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign in with OAuth provider (Google)
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return session;
}

// Get current user
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return user;
}

// Send password reset email
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/reset-password`
      : undefined,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Update password
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Check if user has required access tier
export function hasAccess(userTier: string | undefined, requiredTier: 'FREE' | 'REGISTERED' | 'PREMIUM'): boolean {
  const tierLevels: Record<string, number> = {
    'FREE': 0,
    'REGISTERED': 1,
    'PREMIUM': 2,
  };

  const userLevel = tierLevels[userTier || 'FREE'] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return userLevel >= requiredLevel;
}

// Error message helper
export function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email before signing in',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Email rate limit exceeded': 'Too many attempts. Please try again later',
  };

  return errorMessages[error.message] || error.message;
}
