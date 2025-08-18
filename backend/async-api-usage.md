# 异步算命API使用说明

## 概述

为了解决Cloudflare Worker的CPU时间限制问题，我们实现了异步处理机制。现在所有4个算命服务都支持异步处理：

1. **八字精算** (`/api/fortune/bazi`)
2. **每日运势** (`/api/fortune/daily`) 
3. **塔罗占卜** (`/api/fortune/tarot`)
4. **幸运物品** (`/api/fortune/lucky`)

## 工作流程

### 1. 启动任务
调用任何算命API，立即返回任务ID：

```json
POST /api/fortune/bazi
{
  "language": "zh"
}

Response:
{
  "success": true,
  "message": "BaZi analysis started",
  "data": {
    "taskId": "task_1642512345678_abc123def",
    "status": "pending",
    "estimatedTime": "2-3 minutes"
  }
}
```

### 2. 轮询任务状态
使用返回的taskId查询处理状态：

```json
GET /api/fortune/task/{taskId}

Response (处理中):
{
  "success": true,
  "message": "Analysis in progress",
  "data": {
    "taskId": "task_1642512345678_abc123def",
    "type": "bazi",
    "status": "processing",
    "createdAt": "2025-01-18T10:30:00.000Z",
    "completedAt": null
  }
}

Response (完成):
{
  "success": true,
  "message": "bazi analysis completed successfully",
  "data": {
    "taskId": "task_1642512345678_abc123def",
    "type": "bazi", 
    "status": "completed",
    "createdAt": "2025-01-18T10:30:00.000Z",
    "completedAt": "2025-01-18T10:32:30.000Z",
    "analysis": "详细的八字分析结果...",
    "aiAnalysis": "详细的八字分析结果...",
    "analysisType": "bazi",
    "timestamp": "2025-01-18T10:32:30.000Z"
  }
}
```

### 3. 任务状态说明

- `pending`: 任务已创建，等待处理
- `processing`: 正在调用AI服务处理
- `completed`: 处理完成，结果可用
- `failed`: 处理失败，查看error字段

## 前端实现建议

```javascript
// 启动任务
async function startAnalysis(type, data) {
  const response = await fetch(`/api/fortune/${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data.taskId;
  }
  throw new Error(result.message);
}

// 轮询任务状态
async function pollTaskStatus(taskId) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/fortune/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (result.data.status === 'completed') {
          resolve(result.data);
        } else if (result.data.status === 'failed') {
          reject(new Error(result.data.error));
        } else {
          // 继续轮询，每5秒检查一次
          setTimeout(poll, 5000);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    poll();
  });
}

// 完整使用示例
async function performAnalysis() {
  try {
    // 1. 启动任务
    const taskId = await startAnalysis('bazi', { language: 'zh' });
    
    // 2. 显示加载状态
    showLoading('分析中，预计需要2-3分钟...');
    
    // 3. 轮询结果
    const result = await pollTaskStatus(taskId);
    
    // 4. 显示结果
    showResult(result.analysis);
    
  } catch (error) {
    showError(error.message);
  }
}
```

## 优势

1. **绕过Worker限制**: AI处理在后台进行，不占用Worker的CPU时间
2. **更好的用户体验**: 立即响应，用户知道任务已开始
3. **可靠性**: 即使网络中断，任务仍在后台处理
4. **可扩展**: 可以添加任务队列、优先级等功能

## 数据库表结构

```sql
CREATE TABLE async_tasks (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data TEXT,
  result TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
```
