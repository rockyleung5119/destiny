import { NextRequest } from 'next/server';

// POST /api/stripe/create-payment - Proxy to Cloudflare Worker
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxying create payment request to Worker...');
    
    // 获取请求头和body
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    const body = await request.text();
    
    console.log('📋 Request headers:', {
      hasAuth: !!authHeader,
      contentType,
      bodyLength: body.length
    });
    
    // 代理到Cloudflare Worker
    const workerUrl = 'https://destiny-backend.jerryliang5119.workers.dev/api/stripe/create-payment';
    
    console.log('🎯 Proxying to:', workerUrl);
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/json',
        'Authorization': authHeader || '',
      },
      body: body
    });

    console.log('📥 Worker response status:', response.status);
    
    // 返回Worker的响应
    const data = await response.json();
    
    console.log('✅ Create payment proxy successful');
    
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
    console.error('❌ Create payment proxy error:', error);
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

// OPTIONS /api/stripe/create-payment - Handle preflight requests
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
