// AI服务实时监控工具
const PROD_API_URL = 'https://destiny-backend.wlk8s6v9y.workers.dev';

class AIServiceMonitor {
  constructor() {
    this.isRunning = false;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutErrors: 0,
      error524Count: 0,
      averageResponseTime: 0,
      lastCheckTime: null
    };
  }

  async start() {
    console.log('🔍 AI服务实时监控启动');
    console.log('='.repeat(50));
    
    this.isRunning = true;
    
    // 初始状态检查
    await this.performInitialCheck();
    
    // 开始监控循环
    this.startMonitoringLoop();
    
    // 设置定期报告
    this.startPeriodicReporting();
    
    console.log('\n✅ 监控已启动，按Ctrl+C停止');
  }

  async performInitialCheck() {
    console.log('\n📊 初始状态检查...');
    
    try {
      // 检查系统健康状态
      const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
      const healthData = await healthResponse.json();
      console.log(`✅ API健康状态: ${healthData.status}`);
      
      // 检查任务监控
      const monitorResponse = await fetch(`${PROD_API_URL}/api/admin/task-monitor`);
      const monitorData = await monitorResponse.json();
      
      if (monitorData.success) {
        console.log('📊 当前任务状态:');
        monitorData.data.stats.forEach(stat => {
          console.log(`  - ${stat.status}: ${stat.count}个任务`);
        });
        
        if (monitorData.data.longRunningTasks.length > 0) {
          console.log(`⚠️ 发现 ${monitorData.data.longRunningTasks.length} 个长时间运行的任务`);
        }
        
        if (monitorData.data.failedTasks.length > 0) {
          console.log(`❌ 发现 ${monitorData.data.failedTasks.length} 个失败的任务`);
        }
      }
      
    } catch (error) {
      console.log('❌ 初始检查失败:', error.message);
    }
  }

  startMonitoringLoop() {
    // 每30秒检查一次
    setInterval(async () => {
      if (!this.isRunning) return;
      
      await this.checkSystemStatus();
    }, 30000);
  }

  startPeriodicReporting() {
    // 每5分钟生成一次报告
    setInterval(() => {
      if (!this.isRunning) return;
      
      this.generateReport();
    }, 300000);
  }

  async checkSystemStatus() {
    try {
      const startTime = Date.now();
      
      // 检查API健康状态
      const healthResponse = await fetch(`${PROD_API_URL}/api/health`);
      const responseTime = Date.now() - startTime;
      
      this.stats.totalRequests++;
      this.stats.lastCheckTime = new Date().toISOString();
      
      if (healthResponse.ok) {
        this.stats.successfulRequests++;
        this.updateAverageResponseTime(responseTime);
        
        // 静默成功（不打印）
        if (this.stats.totalRequests % 10 === 0) {
          console.log(`✅ 健康检查 #${this.stats.totalRequests} (${responseTime}ms)`);
        }
      } else {
        this.stats.failedRequests++;
        console.log(`❌ 健康检查失败: ${healthResponse.status} (${responseTime}ms)`);
        
        if (healthResponse.status === 524) {
          this.stats.error524Count++;
          console.log('🚨 检测到524错误!');
          await this.handle524Error();
        }
      }
      
    } catch (error) {
      this.stats.failedRequests++;
      console.log(`❌ 监控检查失败: ${error.message}`);
      
      if (error.message.includes('timeout')) {
        this.stats.timeoutErrors++;
        console.log('⏰ 检测到超时错误');
      }
      
      if (error.message.includes('524')) {
        this.stats.error524Count++;
        console.log('🚨 检测到524错误!');
        await this.handle524Error();
      }
    }
  }

  async handle524Error() {
    console.log('🔧 处理524错误...');
    
    try {
      // 触发卡住任务处理
      const stuckResponse = await fetch(`${PROD_API_URL}/api/admin/process-stuck-tasks`);
      const stuckData = await stuckResponse.json();
      
      if (stuckData.success) {
        console.log(`✅ 自动处理了 ${stuckData.processed || 0} 个卡住的任务`);
      }
      
    } catch (error) {
      console.log('❌ 524错误处理失败:', error.message);
    }
  }

  updateAverageResponseTime(responseTime) {
    if (this.stats.averageResponseTime === 0) {
      this.stats.averageResponseTime = responseTime;
    } else {
      this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
    }
  }

  generateReport() {
    console.log('\n📊 监控报告');
    console.log('='.repeat(30));
    console.log(`📈 总请求数: ${this.stats.totalRequests}`);
    console.log(`✅ 成功请求: ${this.stats.successfulRequests}`);
    console.log(`❌ 失败请求: ${this.stats.failedRequests}`);
    console.log(`⏰ 超时错误: ${this.stats.timeoutErrors}`);
    console.log(`🚨 524错误: ${this.stats.error524Count}`);
    console.log(`📊 成功率: ${this.stats.totalRequests > 0 ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1) : 0}%`);
    console.log(`⚡ 平均响应时间: ${this.stats.averageResponseTime.toFixed(0)}ms`);
    console.log(`🕐 最后检查: ${this.stats.lastCheckTime}`);
    console.log('='.repeat(30));
    
    // 如果错误率过高，发出警告
    const errorRate = this.stats.totalRequests > 0 ? (this.stats.failedRequests / this.stats.totalRequests) * 100 : 0;
    if (errorRate > 10) {
      console.log(`⚠️ 警告: 错误率过高 (${errorRate.toFixed(1)}%)`);
    }
    
    if (this.stats.error524Count > 0) {
      console.log(`🚨 警告: 检测到 ${this.stats.error524Count} 次524错误`);
    }
    
    if (this.stats.averageResponseTime > 5000) {
      console.log(`⏰ 警告: 平均响应时间过长 (${this.stats.averageResponseTime.toFixed(0)}ms)`);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 监控已停止');
    this.generateReport();
  }
}

// 创建监控实例
const monitor = new AIServiceMonitor();

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n收到退出信号...');
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号...');
  monitor.stop();
  process.exit(0);
});

// 启动监控
monitor.start().catch(error => {
  console.error('❌ 监控启动失败:', error);
  process.exit(1);
});
