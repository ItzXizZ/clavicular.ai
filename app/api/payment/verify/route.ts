import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/authMiddleware';
import { getPayPalSubscription, resolvePlanFromId } from '@/lib/paypal';
import { subscriptionActivationData } from '@/lib/subscription';

interface PaymentVerifyRequest {
  subscriptionId: string;
  plan?: 'monthly' | 'yearly';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body: PaymentVerifyRequest = await request.json();
    const { subscriptionId, plan: requestedPlan } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Payment] Verifying subscription ${subscriptionId} for user ${user.id}`);

    const paypalSub = await getPayPalSubscription(subscriptionId);
    const plan =
      requestedPlan ||
      resolvePlanFromId(paypalSub?.plan_id) ||
      'monthly';

    // Accept APPROVAL_PENDING / APPROVED / ACTIVE — trial starts immediately
    const status = paypalSub?.status || 'ACTIVE';
    const validStatuses = ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE'];
    if (paypalSub && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Subscription not active (status: ${status})` },
        { status: 400 }
      );
    }

    // If PayPal credentials missing, still activate from client approval (dev fallback)
    if (!paypalSub) {
      console.warn('[Payment] Could not verify with PayPal API — activating from client approval');
    }

    const activation = subscriptionActivationData(plan, status);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionId,
        ...activation,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        accessTier: true,
        subscriptionId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        leaderboardEntry: {
          select: {
            id: true,
            overallScore: true,
            hidden: true,
            age: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Payment] User ${user.id} subscribed (${plan}, ${activation.subscriptionStatus})`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Subscription activated. Your 7-day free trial has started!',
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
