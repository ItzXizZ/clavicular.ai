import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/authMiddleware';

// Generate a unique referral code
function generateReferralCode(name?: string): string {
  const base = name 
    ? name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) 
    : 'REF';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

// GET - Get current user's referral code and stats
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Get or create referral code for user
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId: user.id },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                name: true,
                displayName: true,
                createdAt: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 referrals
        }
      }
    });

    // If user doesn't have a code, create one
    if (!referralCode) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true }
      });

      // Generate unique code (with retries)
      let code = generateReferralCode(dbUser?.name || undefined);
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.referralCode.findUnique({ where: { code } });
        if (!existing) break;
        code = generateReferralCode(dbUser?.name || undefined);
        attempts++;
      }

      referralCode = await prisma.referralCode.create({
        data: {
          code,
          userId: user.id,
        },
        include: {
          referrals: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  createdAt: true,
                }
              }
            }
          }
        }
      });
    }

    // Build the referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clavicular.ai';
    const referralLink = `${baseUrl}?ref=${referralCode.code}`;

    return NextResponse.json({
      code: referralCode.code,
      link: referralLink,
      usageCount: referralCode.usageCount,
      referrals: referralCode.referrals.map(r => ({
        id: r.id,
        userName: r.referredUser.displayName || r.referredUser.name || 'Anonymous',
        joinedAt: r.createdAt,
        rewardGranted: r.rewardGranted,
      })),
    });
  } catch (err) {
    console.error('Get referral code error:', err);
    return NextResponse.json(
      { error: 'Failed to get referral code' },
      { status: 500 }
    );
  }
}

// POST - Validate a referral code (called during signup)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Look up the code
    const referralCode = await prisma.referralCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        }
      }
    });

    if (!referralCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrerName: referralCode.user.displayName || referralCode.user.name || 'A friend',
      referrerId: referralCode.user.id,
    });
  } catch (err) {
    console.error('Validate referral code error:', err);
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}

