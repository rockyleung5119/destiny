// 数据库备份服务监控脚本
const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

class BackupMonitor {
  constructor() {
    this.stats = {
      totalBackups: 0,
      latestBackup: null,
      oldestBackup: null,
      totalSize: 0,
      averageSize: 0,
      backupFrequency: 'daily',
      retentionDays: 30
    };
  }

  /**
   * 检查备份服务状态
   */
  async checkBackupStatus() {
    try {
      console.log('🔍 Checking backup service status...');
      
      // 获取备份列表
      const response = await fetch(`${API_BASE_URL}/api/admin/backups`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get backup list');
      }
      
      const backups = data.backups || [];
      console.log(`📊 Found ${backups.length} backup files`);
      
      if (backups.length === 0) {
        console.log('⚠️ No backup files found');
        return;
      }
      
      // 分析备份统计
      this.analyzeBackups(backups);
      this.displayStats();
      this.checkBackupHealth(backups);
      
    } catch (error) {
      console.error('❌ Failed to check backup status:', error.message);
    }
  }

  /**
   * 分析备份统计信息
   */
  analyzeBackups(backups) {
    this.stats.totalBackups = backups.length;
    
    // 按上传时间排序
    const sortedBackups = backups.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
    
    this.stats.latestBackup = sortedBackups[0];
    this.stats.oldestBackup = sortedBackups[sortedBackups.length - 1];
    
    // 计算总大小和平均大小
    this.stats.totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
    this.stats.averageSize = this.stats.totalSize / backups.length;
  }

  /**
   * 显示备份统计信息
   */
  displayStats() {
    console.log('\n📊 Backup Statistics:');
    console.log('=' * 50);
    console.log(`📁 Total backups: ${this.stats.totalBackups}`);
    console.log(`📊 Total size: ${this.formatBytes(this.stats.totalSize)}`);
    console.log(`📈 Average size: ${this.formatBytes(this.stats.averageSize)}`);
    
    if (this.stats.latestBackup) {
      console.log(`🕐 Latest backup: ${this.stats.latestBackup.fileName}`);
      console.log(`   📅 Date: ${new Date(this.stats.latestBackup.uploaded).toLocaleString()}`);
      console.log(`   📊 Size: ${this.formatBytes(this.stats.latestBackup.size)}`);
    }
    
    if (this.stats.oldestBackup) {
      console.log(`🕐 Oldest backup: ${this.stats.oldestBackup.fileName}`);
      console.log(`   📅 Date: ${new Date(this.stats.oldestBackup.uploaded).toLocaleString()}`);
    }
  }

  /**
   * 检查备份健康状况
   */
  checkBackupHealth(backups) {
    console.log('\n🏥 Backup Health Check:');
    console.log('=' * 50);
    
    // 检查最近备份时间
    const latestBackupDate = new Date(this.stats.latestBackup.uploaded);
    const now = new Date();
    const hoursSinceLastBackup = (now - latestBackupDate) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup > 25) { // 超过25小时没有备份
      console.log('❌ WARNING: No backup in the last 25 hours');
      console.log(`   Last backup was ${Math.round(hoursSinceLastBackup)} hours ago`);
    } else {
      console.log('✅ Recent backup found (within 25 hours)');
    }
    
    // 检查备份大小一致性
    const sizes = backups.map(b => b.size).filter(s => s > 0);
    if (sizes.length > 1) {
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      const sizeVariation = (maxSize - minSize) / minSize;
      
      if (sizeVariation > 0.5) { // 大小变化超过50%
        console.log('⚠️ WARNING: Significant size variation in backups');
        console.log(`   Size range: ${this.formatBytes(minSize)} - ${this.formatBytes(maxSize)}`);
      } else {
        console.log('✅ Backup sizes are consistent');
      }
    }
    
    // 检查备份频率
    if (backups.length >= 2) {
      const dates = backups.map(b => new Date(b.uploaded)).sort((a, b) => b - a);
      const intervals = [];
      
      for (let i = 0; i < Math.min(dates.length - 1, 7); i++) {
        const interval = (dates[i] - dates[i + 1]) / (1000 * 60 * 60); // hours
        intervals.push(interval);
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      if (avgInterval > 26) { // 超过26小时间隔
        console.log('⚠️ WARNING: Backup frequency is lower than expected');
        console.log(`   Average interval: ${Math.round(avgInterval)} hours`);
      } else {
        console.log('✅ Backup frequency is normal');
      }
    }
    
    // 检查保留期
    const oldestDate = new Date(this.stats.oldestBackup.uploaded);
    const daysSinceOldest = (now - oldestDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceOldest > 35) { // 超过35天的备份
      console.log('⚠️ INFO: Some backups are older than 35 days');
      console.log(`   Oldest backup: ${Math.round(daysSinceOldest)} days ago`);
    } else {
      console.log('✅ Backup retention is within expected range');
    }
  }

  /**
   * 执行手动备份测试
   */
  async testManualBackup() {
    try {
      console.log('\n🔄 Testing manual backup...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/backup-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Manual backup test successful');
        console.log(`📁 Backup file: ${result.backupInfo?.fileName}`);
        console.log(`📊 Backup size: ${this.formatBytes(result.backupInfo?.size || 0)}`);
        console.log(`📋 Tables backed up: ${result.backupInfo?.tables?.length || 0}`);
      } else {
        console.log('❌ Manual backup test failed:', result.message);
      }
      
    } catch (error) {
      console.error('❌ Manual backup test error:', error.message);
    }
  }

  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成备份报告
   */
  generateReport() {
    const now = new Date();
    console.log('\n📋 Backup Service Report');
    console.log('=' * 50);
    console.log(`📅 Report generated: ${now.toLocaleString()}`);
    console.log(`🔧 Service: Cloudflare D1 Database Backup`);
    console.log(`📁 Storage: R2 Bucket (destiny-backups)`);
    console.log(`⏰ Schedule: Daily at 2:00 AM UTC`);
    console.log(`🗂️ Retention: 30 days`);
    console.log(`📊 Compression: gzip`);
    
    console.log('\n📈 Recommendations:');
    if (this.stats.totalBackups < 7) {
      console.log('• Monitor backup service for the first week');
    }
    if (this.stats.totalBackups > 35) {
      console.log('• Backup retention is working correctly');
    }
    console.log('• Regularly test backup restoration');
    console.log('• Monitor backup size trends');
    console.log('• Set up alerts for backup failures');
  }
}

// 主函数
async function main() {
  console.log('🔍 Database Backup Service Monitor');
  console.log('=' * 50);
  
  const monitor = new BackupMonitor();
  
  // 检查备份状态
  await monitor.checkBackupStatus();
  
  // 询问是否执行手动备份测试
  const args = process.argv.slice(2);
  if (args.includes('--test-backup')) {
    await monitor.testManualBackup();
  }
  
  // 生成报告
  monitor.generateReport();
  
  console.log('\n✅ Monitoring complete');
  
  if (!args.includes('--test-backup')) {
    console.log('\n💡 Tip: Run with --test-backup to test manual backup');
  }
}

// 运行监控
main().catch(error => {
  console.error('❌ Monitor failed:', error);
  process.exit(1);
});
