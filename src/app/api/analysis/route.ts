import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse, 
  validateRequestBody,
  requireAuth,
  validateRequiredFields,
  sanitizeInput
} from '@/lib/api-handler';
import { AnalysisRequest, ValidationError } from '@/types';
import prisma from '@/lib/db';
import { parseDate } from '@/lib/utils';
import { hybridCalculator } from '@/lib/hybrid-calculator';
import { permissionService } from '@/lib/permission-service';

// Validate analysis request
function validateAnalysisRequest(data: any): AnalysisRequest {
  const sanitized = sanitizeInput(data);
  
  validateRequiredFields(sanitized, [
    'birthInfo.name',
    'birthInfo.gender', 
    'birthInfo.birthDate',
    'birthInfo.birthPlace',
    'analysisType'
  ]);

  const { birthInfo, analysisType, faceImageUrl, palmImageUrl, options } = sanitized;

  // Validate birth date
  let birthDate: Date;
  try {
    birthDate = parseDate(birthInfo.birthDate);
  } catch {
    throw new ValidationError('Invalid birth date format');
  }

  // Validate gender
  if (!['male', 'female'].includes(birthInfo.gender)) {
    throw new ValidationError('Gender must be male or female');
  }

  // Validate analysis type
  if (!['bazi', 'ziwei', 'daily', 'comprehensive'].includes(analysisType)) {
    throw new ValidationError('Invalid analysis type');
  }

  return {
    birthInfo: {
      name: birthInfo.name,
      gender: birthInfo.gender,
      birthDate,
      birthPlace: birthInfo.birthPlace,
      latitude: birthInfo.latitude,
      longitude: birthInfo.longitude,
      timezone: birthInfo.timezone
    },
    analysisType,
    faceImageUrl,
    palmImageUrl,
    options
  };
}

// POST /api/analysis - Create new analysis
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const analysisRequest = await validateRequestBody(request, validateAnalysisRequest);

  // Check permissions and rate limits
  await permissionService.checkRateLimit(user.id, 'analysis');
  await permissionService.consumeQueryQuota(user.id);

  // Check feature access for images if provided
  if (analysisRequest.faceImageUrl || analysisRequest.palmImageUrl) {
    const imageAccess = await permissionService.checkFeatureAccess(user.id, 'image_upload');
    if (!imageAccess.hasAccess) {
      throw new ValidationError(imageAccess.reason || 'Image upload not allowed');
    }
  }

  // Get user record
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!userRecord) {
    throw new ValidationError('User not found');
  }

  // Create analysis record
  const analysis = await prisma.analysis.create({
    data: {
      userId: user.id,
      name: analysisRequest.birthInfo.name,
      gender: analysisRequest.birthInfo.gender,
      birthDate: analysisRequest.birthInfo.birthDate,
      birthPlace: analysisRequest.birthInfo.birthPlace,
      latitude: analysisRequest.birthInfo.latitude,
      longitude: analysisRequest.birthInfo.longitude,
      faceImageUrl: analysisRequest.faceImageUrl,
      palmImageUrl: analysisRequest.palmImageUrl,
      analysisType: analysisRequest.analysisType
    }
  });

  // Process the analysis using hybrid calculator
  try {
    const analysisResult = await hybridCalculator.performAnalysis(
      analysisRequest,
      userRecord.subscriptionType as any
    );

    // Update analysis record with results
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        overallScore: analysisResult.fortune.overallScore,
        careerScore: analysisResult.fortune.career.score,
        wealthScore: analysisResult.fortune.wealth.score,
        loveScore: analysisResult.fortune.love.score,
        healthScore: analysisResult.fortune.health.score,
        baziData: analysisResult.baziData ? JSON.stringify(analysisResult.baziData) : null,
        ziweiData: analysisResult.ziweiData ? JSON.stringify(analysisResult.ziweiData) : null,
        predictions: analysisResult.predictions ? JSON.stringify(analysisResult.predictions) : null,
        advice: analysisResult.advice ? JSON.stringify(analysisResult.advice) : null,
        updatedAt: new Date()
      }
    });

    return createApiResponse({
      id: analysis.id,
      status: 'completed',
      result: analysisResult
    }, 'Analysis completed successfully', 201);

  } catch (error) {
    // Update analysis record with error status
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        updatedAt: new Date()
      }
    });

    throw error;
  }
});

// GET /api/analysis - Get user's analyses
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth(request);
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        birthPlace: true,
        analysisType: true,
        overallScore: true,
        careerScore: true,
        wealthScore: true,
        loveScore: true,
        healthScore: true,
        createdAt: true
      }
    }),
    prisma.analysis.count({
      where: { userId: user.id }
    })
  ]);

  return createApiResponse({
    analyses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
