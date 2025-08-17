import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, FortuneError, ValidationError, AuthenticationError } from '@/types';
import { safeJsonStringify } from './utils';

export type ApiHandler = (
  request: NextRequest,
  context?: { params: any }
) => Promise<NextResponse>;

/**
 * Create API response
 */
export function createApiResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: status < 400,
    data,
    message
  };

  return NextResponse.json(response, { status });
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500
): NextResponse {
  const message = error instanceof Error ? error.message : error;
  const response: ApiResponse = {
    success: false,
    error: message
  };

  return NextResponse.json(response, { status });
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: any }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof FortuneError) {
        return createErrorResponse(error.message, error.statusCode);
      }

      if (error instanceof Error) {
        return createErrorResponse(error.message, 500);
      }

      return createErrorResponse('Internal server error', 500);
    }
  };
}

/**
 * Validate request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  validator: (data: any) => T
): Promise<T> {
  try {
    const body = await request.json();
    return validator(body);
  } catch (error) {
    throw new ValidationError('Invalid request body');
  }
}

/**
 * Get user from request (JWT authentication)
 */
export async function getUserFromRequest(request: NextRequest): Promise<{ id: string } | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // For development, we'll use a simple JWT verification
    // In production, you should use a proper JWT library
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return { id: payload.userId || payload.sub };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Require authentication
 */
export async function requireAuth(request: NextRequest): Promise<{ id: string }> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}

/**
 * Parse query parameters
 */
export function parseQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: Record<string, string>) {
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  
  if (page < 1 || limit < 1 || limit > 100) {
    throw new ValidationError('Invalid pagination parameters');
  }
  
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse {
  const response = {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  return NextResponse.json(response);
}

/**
 * Log API request
 */
export function logApiRequest(
  request: NextRequest,
  response?: NextResponse,
  error?: Error
): void {
  const method = request.method;
  const url = request.url;
  const timestamp = new Date().toISOString();
  
  const logData = {
    timestamp,
    method,
    url,
    status: response?.status,
    error: error?.message
  };

  console.log('API Request:', safeJsonStringify(logData));
}

/**
 * CORS headers
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

/**
 * Rate limiting (placeholder)
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<boolean> {
  // TODO: Implement actual rate limiting with Redis
  // For now, always return true
  return true;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Sanitize input data
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}
