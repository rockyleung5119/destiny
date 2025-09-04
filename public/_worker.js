// Cloudflare Pages Worker - API代理
// 解决405错误：将API请求代理到后端Worker

const BACKEND_WORKER_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 只处理API请求
    if (url.pathname.startsWith('/api/')) {
      console.log(`🔄 Proxying ${request.method} ${url.pathname} to backend Worker`);
      
      try {
        // 构建后端Worker的URL
        const backendUrl = new URL(url.pathname + url.search, BACKEND_WORKER_URL);
        
        // 创建新的请求，保持所有原始头部和body
        const backendRequest = new Request(backendUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: 'follow'
        });
        
        // 转发请求到后端Worker
        const response = await fetch(backendRequest);
        
        console.log(`📥 Backend response: ${response.status} for ${request.method} ${url.pathname}`);
        
        // 创建新的响应，添加CORS头
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Language',
          }
        });
        
        return newResponse;
      } catch (error) {
        console.error(`❌ Proxy error for ${request.method} ${url.pathname}:`, error);
        
        return new Response(JSON.stringify({
          success: false,
          message: 'Proxy error: ' + error.message,
          code: 'PROXY_ERROR'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }
    
    // 对于非API请求，返回null让Pages处理静态文件
    return null;
  }
};
