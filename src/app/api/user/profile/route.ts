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
import { isValidEmail, parseDate } from '@/lib/utils';

// Validate profile update request
function validateProfileUpdate(data: any) {
  const sanitized = sanitizeInput(data);
  
  if (sanitized.email && !isValidEmail(sanitized.email)) {
    throw new ValidationError('Invalid email format');
  }

  if (sanitized.birthDate) {
    try {
      sanitized.birthDate = parseDate(sanitized.birthDate);
    } catch {
      throw new ValidationError('Invalid birth date format');
    }
  }

  if (sanitized.gender && !['male', 'female'].includes(sanitized.gender)) {
    throw new ValidationError('Gender must be male or female');
  }

  return sanitized;
}

// GET /api/user/profile - Get user profile
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      gender: true,
      birthDate: true,
      birthPlace: true,
      latitude: true,
      longitude: true,
      timezone: true,
      subscriptionType: true,
      subscriptionEnd: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!userProfile) {
    throw new ValidationError('User not found');
  }

  return createApiResponse(userProfile);
});

// PUT /api/user/profile - Update user profile
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const updateData = await validateRequestBody(request, validateProfileUpdate);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      name: true,
      gender: true,
      birthDate: true,
      birthPlace: true,
      latitude: true,
      longitude: true,
      timezone: true,
      subscriptionType: true,
      subscriptionEnd: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return createApiResponse(updatedUser, 'Profile updated successfully');
});
