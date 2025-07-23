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
import { pushNotificationService } from '@/lib/push-notification-service';

// Validate push subscription request
function validatePushSubscription(data: any) {
  const sanitized = sanitizeInput(data);
  
  validateRequiredFields(sanitized, [
    'endpoint',
    'keys.p256dh',
    'keys.auth'
  ]);

  const { endpoint, keys } = sanitized;

  // Validate endpoint URL
  try {
    new URL(endpoint);
  } catch {
    throw new ValidationError('Invalid endpoint URL');
  }

  // Validate keys
  if (!keys.p256dh || !keys.auth) {
    throw new ValidationError('Missing required push keys');
  }

  return {
    endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth
    }
  };
}

// POST /api/notifications/subscribe - Subscribe to push notifications
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const subscription = await validateRequestBody(request, validatePushSubscription);

  const success = await pushNotificationService.subscribe(user.id, subscription);

  if (!success) {
    throw new Error('Failed to save push subscription');
  }

  return createApiResponse({
    message: 'Push notification subscription saved successfully'
  }, 'Subscription successful', 201);
});
