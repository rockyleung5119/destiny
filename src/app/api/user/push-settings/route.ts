import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse, 
  validateRequestBody,
  requireAuth,
  sanitizeInput
} from '@/lib/api-handler';
import { ValidationError } from '@/types';
import prisma from '@/lib/db';

// Validate push settings update
function validatePushSettings(data: any) {
  const sanitized = sanitizeInput(data);
  
  // Validate time format (HH:mm)
  if (sanitized.preferredTime) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(sanitized.preferredTime)) {
      throw new ValidationError('Invalid time format. Use HH:mm format.');
    }
  }

  return sanitized;
}

// GET /api/user/push-settings - Get push notification settings
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  let pushSettings = await prisma.pushSettings.findUnique({
    where: { userId: user.id }
  });

  // Create default settings if not exists
  if (!pushSettings) {
    pushSettings = await prisma.pushSettings.create({
      data: {
        userId: user.id,
        emailEnabled: true,
        dailyFortune: true,
        specialAlerts: true,
        browserEnabled: false,
        preferredTime: '09:00',
        timezone: 'UTC'
      }
    });
  }

  return createApiResponse({
    emailEnabled: pushSettings.emailEnabled,
    dailyFortune: pushSettings.dailyFortune,
    specialAlerts: pushSettings.specialAlerts,
    browserEnabled: pushSettings.browserEnabled,
    preferredTime: pushSettings.preferredTime,
    timezone: pushSettings.timezone
  });
});

// PUT /api/user/push-settings - Update push notification settings
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const updateData = await validateRequestBody(request, validatePushSettings);

  const updatedSettings = await prisma.pushSettings.upsert({
    where: { userId: user.id },
    update: {
      ...updateData,
      updatedAt: new Date()
    },
    create: {
      userId: user.id,
      emailEnabled: updateData.emailEnabled ?? true,
      dailyFortune: updateData.dailyFortune ?? true,
      specialAlerts: updateData.specialAlerts ?? true,
      browserEnabled: updateData.browserEnabled ?? false,
      preferredTime: updateData.preferredTime ?? '09:00',
      timezone: updateData.timezone ?? 'UTC'
    }
  });

  return createApiResponse({
    emailEnabled: updatedSettings.emailEnabled,
    dailyFortune: updatedSettings.dailyFortune,
    specialAlerts: updatedSettings.specialAlerts,
    browserEnabled: updatedSettings.browserEnabled,
    preferredTime: updatedSettings.preferredTime,
    timezone: updatedSettings.timezone
  }, 'Push settings updated successfully');
});
