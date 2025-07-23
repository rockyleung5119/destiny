import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse, 
  validateRequestBody,
  requireAuth,
  validateRequiredFields,
  sanitizeInput
} from '@/lib/api-handler';
import { ValidationError } from '@/types';
import { stripeService } from '@/lib/stripe-service';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import prisma from '@/lib/db';

// Validate subscription creation request
function validateSubscriptionRequest(data: any) {
  const sanitized = sanitizeInput(data);
  
  validateRequiredFields(sanitized, [
    'planId',
    'paymentMethodId'
  ]);

  const { planId, paymentMethodId } = sanitized;

  // Validate plan ID
  if (!Object.keys(SUBSCRIPTION_PLANS).includes(planId)) {
    throw new ValidationError('Invalid subscription plan');
  }

  // Validate payment method ID format
  if (typeof paymentMethodId !== 'string' || !paymentMethodId.startsWith('pm_')) {
    throw new ValidationError('Invalid payment method ID');
  }

  return {
    planId,
    paymentMethodId
  };
}

// POST /api/subscription/create - Create new subscription
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const { planId, paymentMethodId } = await validateRequestBody(request, validateSubscriptionRequest);

  // Get user details
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      name: true,
      subscriptionType: true,
      subscriptionEnd: true
    }
  });

  if (!userRecord) {
    throw new ValidationError('User not found');
  }

  // Check if user already has an active subscription
  const isCurrentlyActive = userRecord.subscriptionType !== 'free' && 
    (userRecord.subscriptionType === 'lifetime' || 
     (userRecord.subscriptionEnd && userRecord.subscriptionEnd > new Date()));

  if (isCurrentlyActive) {
    throw new ValidationError('User already has an active subscription');
  }

  // Create subscription
  const result = await stripeService.createSubscription({
    userId: user.id,
    planId: planId as any,
    paymentMethodId,
    customerEmail: userRecord.email || '',
    customerName: userRecord.name
  });

  if (result.status === 'failed') {
    throw new Error(result.error || 'Subscription creation failed');
  }

  return createApiResponse({
    subscriptionId: result.subscriptionId,
    clientSecret: result.clientSecret,
    status: result.status,
    plan: SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
  }, 'Subscription created successfully', 201);
});
