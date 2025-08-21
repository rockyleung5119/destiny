// Cloudflare D1数据库自动备份服务
// 每天自动备份D1数据库到R2存储

interface Env {
  DB: D1Database;
  BACKUP_STORAGE: R2Bucket;
  BACKUP_NOTIFICATION_EMAIL?: string;
}

export class DatabaseBackupService {
  private env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }

  /**
   * 执行数据库备份
   */
  async performBackup(): Promise<{ success: boolean; message: string; backupInfo?: any }> {
    try {
      console.log('🔄 Starting database backup process...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `destiny-db-backup-${timestamp}.sql`;
      
      // 1. 获取所有表的结构和数据
      const backupData = await this.generateBackupSQL();
      
      // 2. 压缩备份数据（可选）
      const compressedData = await this.compressData(backupData);
      
      // 3. 上传到R2存储
      const uploadResult = await this.uploadToR2(backupFileName, compressedData);
      
      // 4. 清理旧备份（保留最近30天）
      await this.cleanupOldBackups();
      
      // 5. 记录备份信息
      const backupInfo = {
        fileName: backupFileName,
        timestamp: new Date().toISOString(),
        size: compressedData.length,
        tables: await this.getTableList(),
        success: true
      };
      
      console.log('✅ Database backup completed successfully:', backupInfo);
      
      return {
        success: true,
        message: `Database backup completed: ${backupFileName}`,
        backupInfo
      };
      
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      
      return {
        success: false,
        message: `Database backup failed: ${error.message}`
      };
    }
  }

  /**
   * 生成完整的SQL备份
   */
  private async generateBackupSQL(): Promise<string> {
    let sqlBackup = '';
    
    // 添加备份头信息
    sqlBackup += `-- Destiny Database Backup\n`;
    sqlBackup += `-- Generated: ${new Date().toISOString()}\n`;
    sqlBackup += `-- Database: destiny-db\n\n`;
    
    // 获取所有表
    const tables = await this.getTableList();
    
    for (const tableName of tables) {
      console.log(`📊 Backing up table: ${tableName}`);
      
      // 获取表结构
      const schema = await this.getTableSchema(tableName);
      sqlBackup += `-- Table: ${tableName}\n`;
      sqlBackup += `${schema}\n\n`;
      
      // 获取表数据
      const data = await this.getTableData(tableName);
      if (data.length > 0) {
        sqlBackup += `-- Data for table: ${tableName}\n`;
        for (const row of data) {
          const insertSQL = this.generateInsertSQL(tableName, row);
          sqlBackup += `${insertSQL}\n`;
        }
        sqlBackup += `\n`;
      }
    }
    
    return sqlBackup;
  }

  /**
   * 获取所有表名
   */
  private async getTableList(): Promise<string[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();
      
      return result.results.map((row: any) => row.name);
    } catch (error) {
      console.error('Failed to get table list:', error);
      return [];
    }
  }

  /**
   * 获取表结构
   */
  private async getTableSchema(tableName: string): Promise<string> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name=?
      `).bind(tableName).first();
      
      return result?.sql || '';
    } catch (error) {
      console.error(`Failed to get schema for table ${tableName}:`, error);
      return '';
    }
  }

  /**
   * 获取表数据
   */
  private async getTableData(tableName: string): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`SELECT * FROM ${tableName}`).all();
      return result.results || [];
    } catch (error) {
      console.error(`Failed to get data for table ${tableName}:`, error);
      return [];
    }
  }

  /**
   * 生成INSERT SQL语句
   */
  private generateInsertSQL(tableName: string, row: any): string {
    const columns = Object.keys(row);
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    });
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  }

  /**
   * 压缩数据（简单的gzip压缩）
   */
  private async compressData(data: string): Promise<Uint8Array> {
    // 在Cloudflare Workers中，我们使用CompressionStream
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // 写入数据
    await writer.write(new TextEncoder().encode(data));
    await writer.close();
    
    // 读取压缩后的数据
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // 合并所有chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  /**
   * 上传到R2存储
   */
  private async uploadToR2(fileName: string, data: Uint8Array): Promise<boolean> {
    try {
      console.log(`📤 Uploading backup to R2: ${fileName}`);
      
      await this.env.BACKUP_STORAGE.put(fileName, data, {
        httpMetadata: {
          contentType: 'application/gzip',
          contentEncoding: 'gzip'
        },
        customMetadata: {
          backupDate: new Date().toISOString(),
          database: 'destiny-db',
          type: 'full-backup'
        }
      });
      
      console.log(`✅ Backup uploaded successfully: ${fileName}`);
      return true;
    } catch (error) {
      console.error('Failed to upload backup to R2:', error);
      throw error;
    }
  }

  /**
   * 清理旧备份（保留最近30天）
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // 列出所有备份文件
      const objects = await this.env.BACKUP_STORAGE.list({
        prefix: 'destiny-db-backup-'
      });
      
      let deletedCount = 0;
      
      for (const object of objects.objects) {
        // 从文件名提取日期
        const match = object.key.match(/destiny-db-backup-(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const backupDate = new Date(match[1]);
          if (backupDate < thirtyDaysAgo) {
            await this.env.BACKUP_STORAGE.delete(object.key);
            deletedCount++;
            console.log(`🗑️ Deleted old backup: ${object.key}`);
          }
        }
      }
      
      console.log(`✅ Cleanup completed: ${deletedCount} old backups deleted`);
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // 不抛出错误，清理失败不应该影响备份过程
    }
  }

  /**
   * 获取备份列表
   */
  async listBackups(): Promise<any[]> {
    try {
      const objects = await this.env.BACKUP_STORAGE.list({
        prefix: 'destiny-db-backup-'
      });
      
      return objects.objects.map(obj => ({
        fileName: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        etag: obj.etag
      }));
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * 恢复数据库（从备份文件）
   */
  async restoreFromBackup(backupFileName: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Starting database restore from: ${backupFileName}`);
      
      // 从R2下载备份文件
      const object = await this.env.BACKUP_STORAGE.get(backupFileName);
      if (!object) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      // 解压数据
      const compressedData = await object.arrayBuffer();
      const decompressedSQL = await this.decompressData(new Uint8Array(compressedData));
      
      // 执行SQL恢复
      const sqlStatements = decompressedSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of sqlStatements) {
        if (statement.trim()) {
          await this.env.DB.prepare(statement).run();
        }
      }
      
      console.log('✅ Database restore completed successfully');
      
      return {
        success: true,
        message: `Database restored from ${backupFileName}`
      };
      
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      
      return {
        success: false,
        message: `Database restore failed: ${error.message}`
      };
    }
  }

  /**
   * 解压数据
   */
  private async decompressData(data: Uint8Array): Promise<string> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // 写入压缩数据
    await writer.write(data);
    await writer.close();
    
    // 读取解压后的数据
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // 合并并转换为字符串
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return new TextDecoder().decode(result);
  }
}
