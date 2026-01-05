import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PayPal Webhook Handler
// This endpoint is called by PayPal when a payment is completed
// You need to add this URL to your PayPal webhook settings:
// https://your-domain.com/api/payment/webhook

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    payer?: {
      email_address?: string;
      payer_id?: string;
    };
    purchase_units?: Array<{
      custom_id?: string; // We'll store user ID here
      amount?: {
        value: string;
        currency_code: string;
      };
    }>;
    subscriber?: {
      email_address?: string;
    };
  };
  create_time: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PayPalWebhookEvent = await request.json();
    
    console.log('[PayPal Webhook] Received event:', body.event_type, body.id);

    // Handle different event types
    switch (body.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.APPROVED':
        await handlePaymentCompleted(body);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentFailed(body);
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

async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  const payerEmail = event.resource.payer?.email_address || 
                     event.resource.subscriber?.email_address;
  const customId = event.resource.purchase_units?.[0]?.custom_id;
  
  console.log('[PayPal Webhook] Payment completed for:', payerEmail, 'customId:', customId);

  // Try to find user by custom_id (user ID) first, then by email
  let user = null;
  
  if (customId) {
    user = await prisma.user.findUnique({
      where: { id: customId }
    });
  }
  
  if (!user && payerEmail) {
    user = await prisma.user.findUnique({
      where: { email: payerEmail }
    });
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        accessTier: 'PREMIUM',
        updatedAt: new Date()
      }
    });
    console.log('[PayPal Webhook] User upgraded to PREMIUM:', user.id);
  } else {
    console.warn('[PayPal Webhook] Could not find user for payment:', payerEmail, customId);
    // Store the payment for later matching
    // You might want to create a PendingPayment table for this
  }
}

async function handlePaymentFailed(event: PayPalWebhookEvent) {
  const payerEmail = event.resource.payer?.email_address;
  console.log('[PayPal Webhook] Payment failed/refunded for:', payerEmail);
  
  // Optionally revoke premium access on refund
  if (payerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: payerEmail }
    });
    
    if (user && event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          accessTier: 'REGISTERED',
          updatedAt: new Date()
        }
      });
      console.log('[PayPal Webhook] User downgraded due to refund:', user.id);
    }
  }
}

