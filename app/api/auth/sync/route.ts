import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';
import { referralTrialData } from '@/lib/subscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper to generate unique referral code
function generateReferralCode(name?: string): string {
  const base = name 
    ? name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) 
    : 'REF';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

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

    // Get referral code from request body (if provided during signup)
    let referralCode: string | null = null;
    try {
      const body = await request.json();
      referralCode = body.referralCode || null;
    } catch {
      // No body or invalid JSON, that's fine
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

    // Check if this is a new user
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, accessTier: true }
    });
    const isNewUser = !existingUser;

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

    // Process referral code for new users
    let referralApplied = false;
    if (isNewUser && referralCode) {
      try {
        // Look up the referral code
        const refCode = await prisma.referralCode.findUnique({
          where: { code: referralCode.toUpperCase() },
          include: { user: true }
        });

        if (refCode && refCode.userId !== user.id) {
          const trial = referralTrialData();
          // Create referral record and grant 7-day trial (not lifetime)
          await prisma.$transaction([
            prisma.referral.create({
              data: {
                referralCodeId: refCode.id,
                referrerId: refCode.userId,
                referredUserId: user.id,
                rewardGranted: true,
                rewardGrantedAt: new Date(),
              }
            }),
            prisma.referralCode.update({
              where: { id: refCode.id },
              data: { usageCount: { increment: 1 } }
            }),
            prisma.user.update({
              where: { id: user.id },
              data: trial,
            })
          ]);

          referralApplied = true;
          console.log(`[Referral] User ${user.id} signed up with code ${referralCode}, granted 7-day trial`);
        }
      } catch (refError) {
        console.error('Error processing referral:', refError);
        // Don't fail the entire sync if referral processing fails
      }
    }

    // Create referral code for the new user
    if (isNewUser) {
      try {
        let code = generateReferralCode(userData.name || undefined);
        let attempts = 0;
        while (attempts < 5) {
          const existing = await prisma.referralCode.findUnique({ where: { code } });
          if (!existing) break;
          code = generateReferralCode(userData.name || undefined);
          attempts++;
        }

        await prisma.referralCode.create({
          data: {
            code,
            userId: user.id,
          }
        });
        console.log(`[Referral] Created referral code ${code} for user ${user.id}`);
      } catch (codeError) {
        console.error('Error creating referral code:', codeError);
        // Don't fail if code creation fails
      }
    }

    // Re-fetch the user to get updated access tier if referral was applied
    const finalUser = referralApplied 
      ? await prisma.user.findUnique({ where: { id: user.id } })
      : dbUser;

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

    // Fetch user's referral code
    const userReferralCode = await prisma.referralCode.findUnique({
      where: { userId: user.id },
      select: { code: true, usageCount: true }
    });

    return NextResponse.json({ 
      user: {
        ...finalUser,
        leaderboardEntry,
        referralCode: userReferralCode?.code || null,
        referralCount: userReferralCode?.usageCount || 0,
      },
      referralApplied,
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

