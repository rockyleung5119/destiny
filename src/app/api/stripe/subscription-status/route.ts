import { NextRequest } from 'next/server';

// GET /api/stripe/subscription-status - Proxy to Cloudflare Worker
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Proxying subscription status request to Worker...');
    
    // 获取请求头
    const authHeader = request.headers.get('authorization');
    
    console.log('📋 Request headers:', {
      hasAuth: !!authHeader,
      authPrefix: authHeader?.substring(0, 20) + '...'
    });
    
    // 代理到Cloudflare Worker
    const workerUrl = 'https://destiny-backend.jerryliang5119.workers.dev/api/stripe/subscription-status';
    
    console.log('🎯 Proxying to:', workerUrl);
    
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      }
    });

    console.log('📥 Worker response status:', response.status);
    
    // 返回Worker的响应
    const data = await response.json();
    
    console.log('✅ Subscription status proxy successful');
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ Subscription status proxy error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Proxy error: ' + error.message,
      code: 'PROXY_ERROR'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// OPTIONS /api/stripe/subscription-status - Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
