/**
 * Subscription access helpers for Clavicular Premium.
 * PREMIUM while status is ACTIVE or TRIAL, or within currentPeriodEnd after cancel.
 */

export type SubscriptionPlan = 'monthly' | 'yearly' | 'trial_referral';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'SUSPENDED' | 'EXPIRED';

export interface SubscriptionFields {
  accessTier?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
}

export const SUBSCRIPTION_PRICING = {
  monthly: { price: 50, label: '$50/mo', planEnv: 'NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY', hasTrial: false },
  yearly: { price: 399, label: '$399/yr', planEnv: 'NEXT_PUBLIC_PAYPAL_PLAN_YEARLY', hasTrial: true },
  trialDays: 7,
} as const;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

/** Whether the user currently has premium (subscribed or in trial). */
export function hasActiveSubscription(user: SubscriptionFields | null | undefined): boolean {
  if (!user) return false;

  const status = (user.subscriptionStatus || '').toUpperCase();
  const periodEnd = toDate(user.currentPeriodEnd);
  const trialEnd = toDate(user.trialEndsAt);
  const now = new Date();

  if (status === 'ACTIVE' || status === 'TRIAL') {
    // Still respect period/trial end if set
    if (status === 'TRIAL' && trialEnd && trialEnd < now) {
      return false;
    }
    if (periodEnd && periodEnd < now && status !== 'ACTIVE') {
      return false;
    }
    return true;
  }

  // Cancelled but still inside paid period
  if (status === 'CANCELLED' && periodEnd && periodEnd > now) {
    return true;
  }

  // Legacy / referral lifetime premium without subscription fields
  if (
    (user.accessTier === 'PREMIUM' || user.accessTier === 'premium') &&
    !user.subscriptionStatus
  ) {
    // If they have a trial end date (referral), check it
    if (trialEnd) {
      return trialEnd > now;
    }
    return true;
  }

  // Referral trial via trialEndsAt alone
  if (trialEnd && trialEnd > now && (user.accessTier === 'PREMIUM' || user.accessTier === 'premium')) {
    return true;
  }

  return false;
}

export function isPremiumUser(user: SubscriptionFields | null | undefined): boolean {
  return hasActiveSubscription(user);
}

/** Grant a 7-day referral trial (not lifetime). */
export function referralTrialData() {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + SUBSCRIPTION_PRICING.trialDays);
  return {
    accessTier: 'PREMIUM' as const,
    subscriptionPlan: 'trial_referral' as const,
    subscriptionStatus: 'TRIAL' as const,
    trialEndsAt,
    currentPeriodEnd: trialEndsAt,
  };
}

/** Compute trial + period end for a new PayPal subscription activation. */
export function subscriptionActivationData(plan: 'monthly' | 'yearly', status: string) {
  const now = new Date();
  const normalized = status.toUpperCase();
  const hasTrial = plan === 'yearly'; // Trial only on annual — incentive to pick yearly

  const currentPeriodEnd = new Date(now);
  if (plan === 'yearly') {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  }

  if (hasTrial) {
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + SUBSCRIPTION_PRICING.trialDays);
    return {
      accessTier: 'PREMIUM' as const,
      subscriptionPlan: plan,
      subscriptionStatus: 'TRIAL' as SubscriptionStatus,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt, // until first charge; webhook extends on sale
    };
  }

  return {
    accessTier: 'PREMIUM' as const,
    subscriptionPlan: plan,
    subscriptionStatus: (normalized === 'ACTIVE' || normalized === 'APPROVED'
      ? 'ACTIVE'
      : 'ACTIVE') as SubscriptionStatus,
    trialEndsAt: null,
    currentPeriodEnd,
  };
}

export function downgradeSubscriptionData() {
  return {
    accessTier: 'REGISTERED' as const,
    subscriptionStatus: 'EXPIRED' as const,
  };
}
