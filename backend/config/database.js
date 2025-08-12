const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'destiny.db');
const DB_DIR = path.dirname(DB_PATH);

// 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 初始化数据库表
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          gender VARCHAR(10),
          birth_year INTEGER,
          birth_month INTEGER,
          birth_day INTEGER,
          birth_hour INTEGER,
          birth_place VARCHAR(100),
          timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
          is_email_verified BOOLEAN DEFAULT FALSE,
          profile_updated_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 会员表
      db.run(`
        CREATE TABLE IF NOT EXISTS memberships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          plan_id VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          expires_at DATETIME,
          remaining_credits INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // 邮箱验证码表
      db.run(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(10) NOT NULL,
          expires_at DATETIME NOT NULL,
          attempts INTEGER DEFAULT 0,
          is_used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 通用验证码表（用于各种验证场景）
      db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(10) NOT NULL,
          type VARCHAR(50) NOT NULL,
          expires_at DATETIME NOT NULL,
          attempts INTEGER DEFAULT 0,
          is_used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email, type, code)
        )
      `);

      // 添加缺失的字段（如果不存在）
      db.run(`
        ALTER TABLE users ADD COLUMN profile_updated_count INTEGER DEFAULT 0
      `, (err) => {
        // 忽略字段已存在的错误
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding profile_updated_count column:', err);
        }
      });

      // 添加时区字段
      db.run(`
        ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Shanghai'
      `, (err) => {
        // 忽略字段已存在的错误
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding timezone column:', err);
        }
      });

      // 添加Stripe客户ID字段
      db.run(`
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)
      `, (err) => {
        // 忽略字段已存在的错误
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding stripe_customer_id column:', err);
        }
      });

      // 添加Stripe订阅ID字段到会员表
      db.run(`
        ALTER TABLE memberships ADD COLUMN stripe_subscription_id VARCHAR(255)
      `, (err) => {
        // 忽略字段已存在的错误
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding stripe_subscription_id column:', err);
        }
      });

      // 用户会话表
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // 算命记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS fortune_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reading_type VARCHAR(50) NOT NULL,
          question TEXT,
          result TEXT NOT NULL,
          language VARCHAR(10) DEFAULT 'zh',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // API使用记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          endpoint VARCHAR(100) NOT NULL,
          method VARCHAR(10) NOT NULL,
          tokens INTEGER DEFAULT 0,
          success BOOLEAN NOT NULL,
          error TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // 创建索引
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships (user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_fortune_readings_user_id ON fortune_readings (user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_fortune_readings_type ON fortune_readings (reading_type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage (user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage (endpoint)');

      console.log('✅ Database tables created successfully');
      resolve();
    });
  });
};

// 数据库查询辅助函数
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  initDatabase,
  dbGet,
  dbAll,
  dbRun
};
