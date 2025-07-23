import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse,
  requireAuth
} from '@/lib/api-handler';
import { pushNotificationService } from '@/lib/push-notification-service';

// POST /api/notifications/unsubscribe - Unsubscribe from push notifications
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const success = await pushNotificationService.unsubscribe(user.id);

  if (!success) {
    throw new Error('Failed to remove push subscription');
  }

  return createApiResponse({
    message: 'Push notification subscription removed successfully'
  });
});
