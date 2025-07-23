import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe-service';
import { logger } from '@/lib/logger';

// POST /api/webhooks/stripe - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    await stripeService.handleWebhook(body, signature);

    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Webhook handling failed', error as Error);
    
    return NextResponse.json(
      { error: 'Webhook handling failed' },
      { status: 400 }
    );
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
