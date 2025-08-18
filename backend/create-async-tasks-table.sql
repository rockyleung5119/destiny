-- 创建async_tasks表的独立脚本
-- 这个脚本只创建异步任务表，不会影响现有数据

CREATE TABLE IF NOT EXISTS async_tasks (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data TEXT,
  result TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
