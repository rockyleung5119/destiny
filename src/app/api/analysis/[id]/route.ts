import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse, 
  createErrorResponse,
  requireAuth
} from '@/lib/api-handler';
import { ValidationError } from '@/types';
import prisma from '@/lib/db';
import { safeJsonParse } from '@/lib/utils';

// GET /api/analysis/[id] - Get specific analysis
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await requireAuth(request);
  const analysisId = params.id;

  if (!analysisId) {
    throw new ValidationError('Analysis ID is required');
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      userId: user.id
    }
  });

  if (!analysis) {
    return createErrorResponse('Analysis not found', 404);
  }

  // Parse JSON fields
  const result = {
    id: analysis.id,
    name: analysis.name,
    gender: analysis.gender,
    birthDate: analysis.birthDate,
    birthPlace: analysis.birthPlace,
    latitude: analysis.latitude,
    longitude: analysis.longitude,
    analysisType: analysis.analysisType,
    overallScore: analysis.overallScore,
    scores: {
      career: analysis.careerScore,
      wealth: analysis.wealthScore,
      love: analysis.loveScore,
      health: analysis.healthScore
    },
    baziData: analysis.baziData ? safeJsonParse(analysis.baziData, null) : null,
    ziweiData: analysis.ziweiData ? safeJsonParse(analysis.ziweiData, null) : null,
    predictions: analysis.predictions ? safeJsonParse(analysis.predictions, null) : null,
    advice: analysis.advice ? safeJsonParse(analysis.advice, null) : null,
    aiResponse: analysis.aiResponse,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt
  };

  return createApiResponse(result);
});

// DELETE /api/analysis/[id] - Delete specific analysis
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await requireAuth(request);
  const analysisId = params.id;

  if (!analysisId) {
    throw new ValidationError('Analysis ID is required');
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      userId: user.id
    }
  });

  if (!analysis) {
    return createErrorResponse('Analysis not found', 404);
  }

  await prisma.analysis.delete({
    where: { id: analysisId }
  });

  return createApiResponse(null, 'Analysis deleted successfully');
});
