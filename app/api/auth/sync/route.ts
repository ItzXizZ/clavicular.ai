import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// POST - Sync user to database after auth
export async function POST(request: NextRequest) {
  try {
    // Check env vars are configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseAnonKey 
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Verify the token with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token - no user found' },
        { status: 401 }
      );
    }

    // Sync user to our database
    const userData = {
      id: user.id,
      email: user.email!,
      emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      displayName: user.user_metadata?.name || user.user_metadata?.full_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      lastLoginAt: new Date(),
    };

    // Upsert user in database
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: userData.email,
        emailVerified: userData.emailVerified,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        lastLoginAt: userData.lastLoginAt,
      },
      create: userData,
    });

    // Fetch leaderboard entry separately using raw query to include hidden field
    const leaderboardEntries = await prisma.$queryRaw<Array<{
      id: string;
      overallScore: number;
      hidden: boolean;
      age: number;
      name: string;
    }>>`
      SELECT "id", "overallScore", "hidden", "age", "name"
      FROM "LeaderboardEntry"
      WHERE "userId" = ${user.id}
      LIMIT 1
    `;

    const leaderboardEntry = leaderboardEntries.length > 0 ? leaderboardEntries[0] : null;

    return NextResponse.json({ 
      user: {
        ...dbUser,
        leaderboardEntry,
      }
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('User sync error:', error);
    
    // Check if it's a Prisma error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPrismaError = errorMessage.includes('Prisma') || errorMessage.includes('prisma');
    
    return NextResponse.json(
      { 
        error: 'Failed to sync user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        type: isPrismaError ? 'database' : 'unknown'
      },
      { status: 500 }
    );
  }
}

