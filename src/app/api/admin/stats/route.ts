import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createApiResponse,
  requireAuth
} from '@/lib/api-handler';
import prisma from '@/lib/db';
import { hybridCalculator } from '@/lib/hybrid-calculator';
import { cache } from '@/lib/cache';

// GET /api/admin/stats - Get system statistics
export const GET = withErrorHandling(async (request: NextRequest) => {
  // TODO: Add admin authentication check
  const user = await requireAuth(request);

  // Get analysis statistics
  const analysisStats = await getAnalysisStats();
  
  // Get user statistics
  const userStats = await getUserStats();
  
  // Get system performance stats
  const performanceStats = await hybridCalculator.getAnalysisStats();
  
  // Get cache statistics
  const cacheStats = await cache.getStats();

  return createApiResponse({
    analysis: analysisStats,
    users: userStats,
    performance: performanceStats,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get analysis statistics
 */
async function getAnalysisStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalAnalyses,
    todayAnalyses,
    monthAnalyses,
    yearAnalyses,
    analysisTypes,
    subscriptionBreakdown
  ] = await Promise.all([
    // Total analyses
    prisma.analysis.count(),
    
    // Today's analyses
    prisma.analysis.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    }),
    
    // This month's analyses
    prisma.analysis.count({
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    }),
    
    // This year's analyses
    prisma.analysis.count({
      where: {
        createdAt: {
          gte: thisYear
        }
      }
    }),
    
    // Analysis types breakdown
    prisma.analysis.groupBy({
      by: ['analysisType'],
      _count: {
        analysisType: true
      }
    }),
    
    // Subscription breakdown
    prisma.analysis.groupBy({
      by: ['user'],
      _count: {
        user: true
      },
      include: {
        user: {
          select: {
            subscriptionType: true
          }
        }
      }
    })
  ]);

  return {
    total: totalAnalyses,
    today: todayAnalyses,
    thisMonth: monthAnalyses,
    thisYear: yearAnalyses,
    byType: analysisTypes.reduce((acc, item) => {
      acc[item.analysisType] = item._count.analysisType;
      return acc;
    }, {} as Record<string, number>),
    growth: {
      daily: todayAnalyses,
      monthly: monthAnalyses,
      yearly: yearAnalyses
    }
  };
}

/**
 * Get user statistics
 */
async function getUserStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
    subscriptionBreakdown,
    activeUsers
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // New users today
    prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    }),
    
    // New users this month
    prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    }),
    
    // Subscription breakdown
    prisma.user.groupBy({
      by: ['subscriptionType'],
      _count: {
        subscriptionType: true
      }
    }),
    
    // Active users (users with analyses in last 30 days)
    prisma.user.count({
      where: {
        analyses: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    })
  ]);

  return {
    total: totalUsers,
    newToday: newUsersToday,
    newThisMonth: newUsersThisMonth,
    active: activeUsers,
    bySubscription: subscriptionBreakdown.reduce((acc, item) => {
      acc[item.subscriptionType] = item._count.subscriptionType;
      return acc;
    }, {} as Record<string, number>)
  };
}

// POST /api/admin/stats/clear-cache - Clear system cache
export const POST = withErrorHandling(async (request: NextRequest) => {
  // TODO: Add admin authentication check
  const user = await requireAuth(request);

  const body = await request.json();
  const { type } = body;

  switch (type) {
    case 'all':
      await cache.clear();
      break;
    case 'analysis':
      await cache.clear('bazi');
      await cache.clear('ziwei');
      break;
    case 'ai':
      await cache.clear('ai');
      break;
    default:
      throw new Error('Invalid cache type');
  }

  return createApiResponse({
    message: `${type} cache cleared successfully`
  });
});
