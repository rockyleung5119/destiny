import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse,
  requireAuth
} from '@/lib/api-handler';
import { stripeService } from '@/lib/stripe-service';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

// GET /api/subscription/status - Get user's subscription status
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const status = await stripeService.getSubscriptionStatus(user.id);
  const plan = status.plan as keyof typeof SUBSCRIPTION_PLANS;
  const planDetails = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;

  return createApiResponse({
    isActive: status.isActive,
    plan: status.plan,
    planDetails,
    expiresAt: status.expiresAt,
    cancelAtPeriodEnd: status.cancelAtPeriodEnd,
    features: planDetails.features,
    limitations: planDetails.limitations
  });
});
