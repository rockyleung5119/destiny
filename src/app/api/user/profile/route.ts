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

  // 转换数据格式以匹配前端期望
  const transformedProfile = {
    ...userProfile,
    // 如果有birthDate，解析为分离的字段
    ...(userProfile.birthDate && {
      birthYear: userProfile.birthDate.getFullYear(),
      birthMonth: userProfile.birthDate.getMonth() + 1,
      birthDay: userProfile.birthDate.getDate(),
      birthHour: userProfile.birthDate.getHours(),
      birthMinute: userProfile.birthDate.getMinutes()
    }),
    // 添加其他前端需要的字段
    isEmailVerified: true, // 假设已验证
    profileUpdatedCount: 0, // 默认值
    membership: userProfile.subscriptionType ? {
      planId: userProfile.subscriptionType,
      isActive: userProfile.subscriptionEnd ? new Date(userProfile.subscriptionEnd) > new Date() : false,
      expiresAt: userProfile.subscriptionEnd?.toISOString() || '',
      remainingCredits: 10, // 默认值
      createdAt: userProfile.createdAt.toISOString()
    } : null
  };

  return createApiResponse(transformedProfile);
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
