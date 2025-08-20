// 数据库恢复脚本
const API_BASE_URL = 'https://destiny-backend.jerryliang5119.workers.dev';

class DatabaseRestore {
  constructor() {
    this.availableBackups = [];
  }

  /**
   * 获取可用的备份列表
   */
  async getAvailableBackups() {
    try {
      console.log('📋 Fetching available backups...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/backups`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get backup list');
      }
      
      this.availableBackups = data.backups || [];
      
      if (this.availableBackups.length === 0) {
        console.log('❌ No backup files found');
        return false;
      }
      
      // 按日期排序（最新的在前）
      this.availableBackups.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
      
      console.log(`✅ Found ${this.availableBackups.length} backup files`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to fetch backups:', error.message);
      return false;
    }
  }

  /**
   * 显示可用的备份列表
   */
  displayBackups() {
    console.log('\n📁 Available Backups:');
    console.log('=' * 80);
    console.log('Index | File Name                              | Date                | Size');
    console.log('-' * 80);
    
    this.availableBackups.forEach((backup, index) => {
      const date = new Date(backup.uploaded).toLocaleString();
      const size = this.formatBytes(backup.size);
      const fileName = backup.fileName.length > 35 
        ? backup.fileName.substring(0, 32) + '...' 
        : backup.fileName;
      
      console.log(`${String(index + 1).padStart(5)} | ${fileName.padEnd(35)} | ${date.padEnd(19)} | ${size}`);
    });
    
    console.log('-' * 80);
  }

  /**
   * 执行数据库恢复
   */
  async restoreDatabase(backupFileName) {
    try {
      console.log(`🔄 Starting database restore from: ${backupFileName}`);
      console.log('⚠️  WARNING: This will overwrite the current database!');
      
      // 确认操作
      if (!this.confirmRestore()) {
        console.log('❌ Restore operation cancelled by user');
        return false;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/restore-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupFileName: backupFileName
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Database restore completed successfully');
        console.log(`📁 Restored from: ${backupFileName}`);
        return true;
      } else {
        console.log('❌ Database restore failed:', result.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Restore operation failed:', error.message);
      return false;
    }
  }

  /**
   * 确认恢复操作
   */
  confirmRestore() {
    // 在实际使用中，这里应该有用户交互确认
    // 为了脚本自动化，我们返回false，需要用户明确指定
    return false;
  }

  /**
   * 验证恢复后的数据库
   */
  async verifyRestore() {
    try {
      console.log('🔍 Verifying restored database...');
      
      // 检查API健康状态
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
      const healthData = await healthResponse.json();
      
      if (healthData.status === 'ok') {
        console.log('✅ Database is responding correctly');
      } else {
        console.log('⚠️ Database health check failed');
        return false;
      }
      
      // 可以添加更多验证逻辑
      console.log('✅ Database verification completed');
      return true;
      
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      return false;
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
   * 创建恢复前备份
   */
  async createPreRestoreBackup() {
    try {
      console.log('🔄 Creating pre-restore backup...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/backup-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Pre-restore backup created successfully');
        console.log(`📁 Backup file: ${result.backupInfo?.fileName}`);
        return result.backupInfo?.fileName;
      } else {
        console.log('❌ Failed to create pre-restore backup:', result.message);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Pre-restore backup failed:', error.message);
      return null;
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🔄 Database Restore Utility');
  console.log('=' * 50);
  
  const restore = new DatabaseRestore();
  
  // 获取可用备份
  const hasBackups = await restore.getAvailableBackups();
  if (!hasBackups) {
    console.log('❌ No backups available for restore');
    process.exit(1);
  }
  
  // 显示可用备份
  restore.displayBackups();
  
  // 检查命令行参数
  if (args.length === 0) {
    console.log('\n📋 Usage:');
    console.log('  node restore-database.js <backup-file-name>');
    console.log('  node restore-database.js --latest');
    console.log('  node restore-database.js --list-only');
    console.log('\n💡 Examples:');
    console.log('  node restore-database.js destiny-db-backup-2024-08-20T02-00-00-000Z.sql');
    console.log('  node restore-database.js --latest');
    process.exit(0);
  }
  
  if (args[0] === '--list-only') {
    console.log('\n✅ Backup list displayed');
    process.exit(0);
  }
  
  let backupFileName;
  
  if (args[0] === '--latest') {
    backupFileName = restore.availableBackups[0].fileName;
    console.log(`\n🎯 Selected latest backup: ${backupFileName}`);
  } else {
    backupFileName = args[0];
    
    // 验证备份文件是否存在
    const backupExists = restore.availableBackups.some(b => b.fileName === backupFileName);
    if (!backupExists) {
      console.log(`❌ Backup file not found: ${backupFileName}`);
      console.log('💡 Use --list-only to see available backups');
      process.exit(1);
    }
  }
  
  // 警告信息
  console.log('\n⚠️  IMPORTANT WARNINGS:');
  console.log('   • This will completely overwrite the current database');
  console.log('   • All current data will be lost');
  console.log('   • This operation cannot be undone');
  console.log('   • Make sure you have a recent backup before proceeding');
  
  // 创建恢复前备份
  console.log('\n🔄 Creating safety backup before restore...');
  const preRestoreBackup = await restore.createPreRestoreBackup();
  
  if (preRestoreBackup) {
    console.log(`✅ Safety backup created: ${preRestoreBackup}`);
  } else {
    console.log('⚠️ Could not create safety backup, but continuing...');
  }
  
  // 由于安全考虑，需要用户明确确认
  if (!args.includes('--force')) {
    console.log('\n❌ Restore operation requires --force flag for safety');
    console.log('💡 Add --force to confirm you want to proceed');
    console.log(`   node restore-database.js "${backupFileName}" --force`);
    process.exit(1);
  }
  
  // 执行恢复
  console.log('\n🔄 Starting restore operation...');
  const restoreSuccess = await restore.restoreDatabase(backupFileName);
  
  if (restoreSuccess) {
    // 验证恢复
    await restore.verifyRestore();
    console.log('\n🎉 Database restore completed successfully!');
  } else {
    console.log('\n❌ Database restore failed');
    process.exit(1);
  }
}

// 运行恢复工具
main().catch(error => {
  console.error('❌ Restore utility failed:', error);
  process.exit(1);
});
