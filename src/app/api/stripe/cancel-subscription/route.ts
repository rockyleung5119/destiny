import { NextRequest } from 'next/server';

// POST /api/stripe/cancel-subscription - Proxy to Cloudflare Worker
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxying cancel subscription request to Worker...');
    
    // 获取请求头
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    
    console.log('📋 Request headers:', {
      hasAuth: !!authHeader,
      contentType,
      authPrefix: authHeader?.substring(0, 20) + '...'
    });
    
    // 代理到Cloudflare Worker
    const workerUrl = 'https://destiny-backend.jerryliang5119.workers.dev/api/stripe/cancel-subscription';
    
    console.log('🎯 Proxying to:', workerUrl);
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/json',
        'Authorization': authHeader || '',
      },
      body: request.body
    });

    console.log('📥 Worker response status:', response.status);
    
    // 返回Worker的响应
    const data = await response.json();
    
    console.log('✅ Proxy successful, returning response');
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
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

// OPTIONS /api/stripe/cancel-subscription - Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
