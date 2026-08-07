import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolvePlanFromId } from '@/lib/paypal';
import {
  subscriptionActivationData,
  downgradeSubscriptionData,
} from '@/lib/subscription';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status?: string;
    plan_id?: string;
    custom_id?: string;
    billing_info?: {
      next_billing_time?: string;
    };
    subscriber?: {
      email_address?: string;
    };
    payer?: {
      email_address?: string;
    };
    // PAYMENT.SALE.COMPLETED
    billing_agreement_id?: string;
  };
  create_time: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PayPalWebhookEvent = await request.json();

    console.log('[PayPal Webhook] Received event:', body.event_type, body.id);

    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionActivated(body);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(body);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(body);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(body);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handleSaleCompleted(body);
        break;

      // Legacy one-time events (keep for old purchases)
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.APPROVED':
        await handleLegacyPayment(body);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handleRefund(body);
        break;

      default:
        console.log('[PayPal Webhook] Unhandled event type:', body.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function findUser(customId?: string, email?: string, subscriptionId?: string) {
  if (customId) {
    const byId = await prisma.user.findUnique({ where: { id: customId } });
    if (byId) return byId;
  }
  if (subscriptionId) {
    const bySub = await prisma.user.findFirst({ where: { subscriptionId } });
    if (bySub) return bySub;
  }
  if (email) {
    return prisma.user.findUnique({ where: { email } });
  }
  return null;
}

async function handleSubscriptionActivated(event: PayPalWebhookEvent) {
  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id;
  const email = event.resource.subscriber?.email_address;
  const plan = resolvePlanFromId(event.resource.plan_id);
  const status = event.resource.status || 'ACTIVE';

  const user = await findUser(customId, email, subscriptionId);
  if (!user) {
    console.warn('[PayPal Webhook] No user for subscription:', subscriptionId, email, customId);
    return;
  }

  const activation = subscriptionActivationData(plan, status);
  const nextBilling = event.resource.billing_info?.next_billing_time;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId,
      ...activation,
      currentPeriodEnd: nextBilling
        ? new Date(nextBilling)
        : activation.currentPeriodEnd,
      updatedAt: new Date(),
    },
  });

  console.log('[PayPal Webhook] Subscription activated for', user.id);
}

async function handleSubscriptionCancelled(event: PayPalWebhookEvent) {
  const subscriptionId = event.resource.id;
  const user = await findUser(
    event.resource.custom_id,
    event.resource.subscriber?.email_address,
    subscriptionId
  );
  if (!user) return;

  // Keep access until period end
  const periodEnd =
    user.currentPeriodEnd ||
    (event.resource.billing_info?.next_billing_time
      ? new Date(event.resource.billing_info.next_billing_time)
      : new Date());

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'CANCELLED',
      currentPeriodEnd: periodEnd,
      // Downgrade immediately only if period already ended
      ...(periodEnd <= new Date()
        ? downgradeSubscriptionData()
        : {}),
      updatedAt: new Date(),
    },
  });

  console.log('[PayPal Webhook] Subscription cancelled for', user.id);
}

async function handleSubscriptionSuspended(event: PayPalWebhookEvent) {
  const user = await findUser(
    event.resource.custom_id,
    event.resource.subscriber?.email_address,
    event.resource.id
  );
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'SUSPENDED',
      accessTier: 'REGISTERED',
      updatedAt: new Date(),
    },
  });
}

async function handleSubscriptionExpired(event: PayPalWebhookEvent) {
  const user = await findUser(
    event.resource.custom_id,
    event.resource.subscriber?.email_address,
    event.resource.id
  );
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...downgradeSubscriptionData(),
      updatedAt: new Date(),
    },
  });
}

async function handleSaleCompleted(event: PayPalWebhookEvent) {
  // Renewal payment — extend period
  const subscriptionId = event.resource.billing_agreement_id || event.resource.id;
  const user = await findUser(undefined, event.resource.subscriber?.email_address, subscriptionId);
  if (!user) return;

  const plan = (user.subscriptionPlan === 'yearly' ? 'yearly' : 'monthly') as
    | 'monthly'
    | 'yearly';
  const currentPeriodEnd = new Date();
  if (plan === 'yearly') {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd,
      updatedAt: new Date(),
    },
  });

  console.log('[PayPal Webhook] Renewal processed for', user.id);
}

async function handleLegacyPayment(event: PayPalWebhookEvent) {
  const email =
    event.resource.payer?.email_address ||
    event.resource.subscriber?.email_address;
  const customId = event.resource.custom_id;
  const user = await findUser(customId, email);
  if (!user) return;

  // Grandfather one-time buyers: grant monthly-equivalent period once
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'monthly',
      currentPeriodEnd: periodEnd,
      trialEndsAt: null,
      updatedAt: new Date(),
    },
  });
}

async function handleRefund(event: PayPalWebhookEvent) {
  const email = event.resource.payer?.email_address;
  if (!email) return;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...downgradeSubscriptionData(),
      updatedAt: new Date(),
    },
  });
}
