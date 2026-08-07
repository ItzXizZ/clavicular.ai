import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import { isPremiumUser } from '@/lib/subscription';

const ALLOWED_TYPES = new Set(['softmax', 'hardmax', 'physique', 'fashion', 'after_image']);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type');

  try {
    if (type) {
      if (!ALLOWED_TYPES.has(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
      const row = await prisma.savedAdvice.findUnique({
        where: { userId_type: { userId: user.id, type } },
      });
      if (!row) return NextResponse.json({ advice: null });
      return NextResponse.json({
        advice: {
          type: row.type,
          payload: JSON.parse(row.payload),
          updatedAt: row.updatedAt,
        },
      });
    }

    const rows = await prisma.savedAdvice.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      advice: rows.map((row) => ({
        type: row.type,
        payload: JSON.parse(row.payload),
        updatedAt: row.updatedAt,
      })),
    });
  } catch (err) {
    console.error('[SavedAdvice GET]', err);
    return NextResponse.json({ error: 'Failed to load saved advice' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      accessTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });

  if (!isPremiumUser(dbUser)) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, payload } = body as { type?: string; payload?: unknown };

    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (payload === undefined || payload === null) {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 });
    }

    const row = await prisma.savedAdvice.upsert({
      where: { userId_type: { userId: user.id, type } },
      create: {
        userId: user.id,
        type,
        payload: JSON.stringify(payload),
      },
      update: {
        payload: JSON.stringify(payload),
      },
    });

    return NextResponse.json({
      advice: {
        type: row.type,
        payload: JSON.parse(row.payload),
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    console.error('[SavedAdvice POST]', err);
    return NextResponse.json({ error: 'Failed to save advice' }, { status: 500 });
  }
}
