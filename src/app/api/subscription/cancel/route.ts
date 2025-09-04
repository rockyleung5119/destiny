import { NextRequest } from 'next/server';

// POST /api/subscription/cancel - Proxy to Cloudflare Worker
export async function POST(request: NextRequest) {
  try {
    // 获取请求头
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');

    // 代理到Cloudflare Worker
    const workerUrl = 'https://destiny-backend.jerryliang5119.workers.dev/api/stripe/cancel-subscription';

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/json',
        'Authorization': authHeader || '',
      },
      body: request.body
    });

    // 返回Worker的响应
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Proxy error: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
