import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // 确保环境变量正确传递
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // 开发服务器配置
    server: {
      port: 5173,
      host: true,
    },
    // 构建配置
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // 优化构建配置，避免部署时的内存问题
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js']
          }
        }
      },
      // 确保构建稳定性
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true
        }
      }
    },
  };
});
