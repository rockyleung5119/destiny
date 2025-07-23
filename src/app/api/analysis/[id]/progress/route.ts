import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse, 
  createErrorResponse,
  requireAuth
} from '@/lib/api-handler';
import { ValidationError } from '@/types';
import prisma from '@/lib/db';

// GET /api/analysis/[id]/progress - Get analysis progress
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
    },
    select: {
      id: true,
      overallScore: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!analysis) {
    return createErrorResponse('Analysis not found', 404);
  }

  // Determine progress based on whether results are available
  const isCompleted = analysis.overallScore !== null;
  const progress = isCompleted ? 100 : calculateProgress(analysis.createdAt);

  const status = isCompleted ? 'completed' : 'processing';
  const message = isCompleted 
    ? 'Analysis completed' 
    : getProgressMessage(progress);

  return createApiResponse({
    id: analysis.id,
    status,
    progress,
    message,
    estimatedTimeRemaining: isCompleted ? 0 : Math.max(0, 30 - Math.floor((Date.now() - analysis.createdAt.getTime()) / 1000))
  });
});

/**
 * Calculate progress based on elapsed time
 */
function calculateProgress(startTime: Date): number {
  const elapsed = Date.now() - startTime.getTime();
  const totalTime = 30000; // 30 seconds for free users
  
  const progress = Math.min(95, (elapsed / totalTime) * 100);
  return Math.floor(progress);
}

/**
 * Get progress message based on progress percentage
 */
function getProgressMessage(progress: number): string {
  if (progress < 20) {
    return 'Analyzing birth chart...';
  } else if (progress < 40) {
    return 'Calculating destiny patterns...';
  } else if (progress < 70) {
    return 'Generating fortune report...';
  } else if (progress < 95) {
    return 'Almost complete...';
  } else {
    return 'Finalizing results...';
  }
}
