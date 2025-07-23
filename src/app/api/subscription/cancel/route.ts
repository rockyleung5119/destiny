import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse,
  requireAuth
} from '@/lib/api-handler';
import { stripeService } from '@/lib/stripe-service';

// POST /api/subscription/cancel - Cancel user's subscription
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const success = await stripeService.cancelSubscription(user.id);

  if (!success) {
    throw new Error('Failed to cancel subscription');
  }

  return createApiResponse({
    message: 'Subscription cancelled successfully'
  });
});
