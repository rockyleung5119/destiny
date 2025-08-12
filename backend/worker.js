// Cloudflare Workers入口文件 - 简化版本
export default {
  async fetch(request, env, ctx) {
    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://fb824531.destiny-360.pages.dev',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Language',
      'Access-Control-Allow-Credentials': 'true'
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Destiny API Server is running on Cloudflare Workers',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 简单的API响应
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API endpoint under construction',
        path: url.pathname
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 默认响应
    return new Response('Destiny Backend API', {
      headers: corsHeaders
    });
  }
};
