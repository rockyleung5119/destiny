import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse,
  requireAuth
} from '@/lib/api-handler';
import { pushNotificationService } from '@/lib/push-notification-service';

// POST /api/notifications/test - Send test notification
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const success = await pushNotificationService.sendToUser(user.id, {
    title: '🧪 Test Notification',
    body: 'This is a test notification to verify your push settings are working correctly.',
    icon: '/icons/test.png',
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    },
    tag: 'test-notification'
  });

  if (!success) {
    throw new Error('Failed to send test notification');
  }

  return createApiResponse({
    message: 'Test notification sent successfully'
  });
});
