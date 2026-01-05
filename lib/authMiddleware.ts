import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface AuthenticatedUser {
  id: string;
  email: string;
  accessTier: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Verify the user's session from the request headers
 * Returns the user if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Check env vars
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration in authMiddleware');
      return { user: null, error: 'Server configuration error' };
    }

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      console.log('No auth token in request headers');
      return { user: null, error: 'No authentication token provided' };
    }

    // Create a Supabase client and verify the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user from the token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.error('Supabase auth.getUser error:', error.message, error.status);
      return { user: null, error: error.message || 'Invalid or expired token' };
    }

    if (!user) {
      console.error('No user returned from Supabase getUser');
      return { user: null, error: 'Invalid or expired token' };
    }

    // Get user from our database to get access tier
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, accessTier: true }
    });

    // If user doesn't exist in our DB, create them
    if (!dbUser) {
      console.log('Creating new user in database:', user.id);
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          accessTier: 'REGISTERED',
        },
        select: { id: true, email: true, accessTier: true }
      });
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        accessTier: dbUser.accessTier,
      },
      error: null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { user: null, error: `Authentication failed: ${errorMessage}` };
  }
}

/**
 * Middleware wrapper that requires authentication
 */
export function withAuth<T extends object>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const { user, error } = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Middleware wrapper that optionally includes auth (doesn't require it)
 */
export function withOptionalAuth<T extends object>(
  handler: (request: NextRequest, user: AuthenticatedUser | null) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const { user } = await verifyAuth(request);
    return handler(request, user);
  };
}

/**
 * Check if user has required access tier
 */
export function hasAccessTier(userTier: string, requiredTier: 'FREE' | 'REGISTERED' | 'PREMIUM'): boolean {
  const tierLevels: Record<string, number> = {
    'FREE': 0,
    'REGISTERED': 1,
    'PREMIUM': 2,
  };

  const userLevel = tierLevels[userTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return userLevel >= requiredLevel;
}
