/**
 * PayPal Subscriptions helpers (server-side).
 */

const PAYPAL_API_URL =
  process.env.PAYPAL_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com');

export async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    console.warn('[PayPal] Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET');
    return null;
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    console.error('[PayPal] Token error:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.access_token as string;
}

export interface PayPalSubscription {
  id: string;
  status: string;
  plan_id?: string;
  custom_id?: string;
  subscriber?: {
    email_address?: string;
  };
  billing_info?: {
    next_billing_time?: string;
    cycle_executions?: Array<{
      tenure_type?: string;
      sequence?: number;
      cycles_completed?: number;
    }>;
  };
  start_time?: string;
}

export async function getPayPalSubscription(
  subscriptionId: string
): Promise<PayPalSubscription | null> {
  const token = await getPayPalAccessToken();
  if (!token) return null;

  const response = await fetch(
    `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('[PayPal] Get subscription error:', await response.text());
    return null;
  }

  return response.json();
}

export function resolvePlanFromId(planId: string | undefined): 'monthly' | 'yearly' {
  const monthly = process.env.PAYPAL_PLAN_MONTHLY || process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY;
  const yearly = process.env.PAYPAL_PLAN_YEARLY || process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY;
  if (planId && yearly && planId === yearly) return 'yearly';
  if (planId && monthly && planId === monthly) return 'monthly';
  return 'monthly';
}

export function getPublicPayPalClientId(): string {
  return (
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID ||
    ''
  );
}

export function getPublicPlanIds() {
  return {
    monthly:
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY ||
      process.env.PAYPAL_PLAN_MONTHLY ||
      '',
    yearly:
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY ||
      process.env.PAYPAL_PLAN_YEARLY ||
      '',
  };
}
