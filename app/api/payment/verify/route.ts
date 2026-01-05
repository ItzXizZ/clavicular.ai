import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/authMiddleware';

interface PaymentVerifyRequest {
  paymentId: string;
  feature?: 'flaws' | 'protocol' | 'premium';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body: PaymentVerifyRequest = await request.json();
    const { paymentId, feature = 'premium' } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // TODO: In production, verify the payment with PayPal API
    // For now, we'll trust the payment ID and upgrade the user
    // 
    // const paypalVerification = await verifyPayPalPayment(paymentId);
    // if (!paypalVerification.valid) {
    //   return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    // }

    console.log(`[Payment] Processing payment ${paymentId} for user ${user.id}, feature: ${feature}`);

    // Update user's access tier to PREMIUM
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        accessTier: 'PREMIUM',
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        accessTier: true,
        leaderboardEntry: {
          select: {
            id: true,
            overallScore: true,
            hidden: true,
            age: true,
            name: true
          }
        }
      }
    });

    console.log(`[Payment] User ${user.id} upgraded to PREMIUM`);

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Premium access granted!'
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

// Helper function to verify PayPal payment (implement in production)
// async function verifyPayPalPayment(paymentId: string): Promise<{ valid: boolean; amount?: number }> {
//   const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
//   const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
//   const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
//     ? 'https://api-m.paypal.com' 
//     : 'https://api-m.sandbox.paypal.com';
//
//   // Get access token
//   const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
//   const tokenResponse = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Basic ${auth}`,
//       'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     body: 'grant_type=client_credentials'
//   });
//   
//   const { access_token } = await tokenResponse.json();
//
//   // Verify payment
//   const paymentResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paymentId}`, {
//     headers: {
//       'Authorization': `Bearer ${access_token}`,
//       'Content-Type': 'application/json'
//     }
//   });
//
//   const payment = await paymentResponse.json();
//   return { 
//     valid: payment.status === 'COMPLETED',
//     amount: parseFloat(payment.purchase_units?.[0]?.amount?.value || '0')
//   };
// }

