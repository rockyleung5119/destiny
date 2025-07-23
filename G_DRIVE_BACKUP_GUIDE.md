# 🚀 Destiny项目G盘备份指南

## 📋 备份概述
由于系统权限限制，自动备份脚本可能无法直接执行。以下提供手动备份到G盘的详细步骤。

## 🎯 手动备份步骤

### 方法1: 使用Windows资源管理器（推荐）

#### 1. 创建备份目录
1. 打开Windows资源管理器
2. 导航到G盘
3. 创建文件夹：`G:\backups`
4. 在backups文件夹中创建：`destiny-backup-2025-01-22`

#### 2. 复制项目文件
选择并复制以下文件夹到备份目录：

**📂 核心文件夹**：
- `src/` - 前端源代码
- `backend/` - 后端源代码  
- `public/` - 静态资源
- `messages/` - 多语言文件
- `scripts/` - 脚本文件
- `prisma/` - 数据库模式（如果存在）

**⚙️ 配置文件**：
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `docker-compose.yml`
- `Dockerfile`
- `nginx.conf`
- `index.html`
- `postcss.config.js`
- `eslint.config.js`

**📚 文档文件**：
- 所有 `.md` 文件

#### 3. 排除的文件
**不要复制以下文件夹**：
- `node_modules/` - 可重新安装
- `.git/` - 版本控制历史
- `dist/` - 构建输出
- `build/` - 构建输出
- `.vscode/` - IDE配置
- `.idea/` - IDE配置

### 方法2: 使用命令行

#### 1. 打开命令提示符
- 按 `Win + R`
- 输入 `cmd` 并按回车
- 导航到项目目录：`cd C:\Users\Administrator\Desktop\destiny`

#### 2. 执行备份命令
```cmd
# 创建备份目录
mkdir "G:\backups\destiny-backup-2025-01-22"

# 复制核心文件夹
xcopy "src" "G:\backups\destiny-backup-2025-01-22\src" /E /I /Q
xcopy "backend" "G:\backups\destiny-backup-2025-01-22\backend" /E /I /Q
xcopy "public" "G:\backups\destiny-backup-2025-01-22\public" /E /I /Q
xcopy "messages" "G:\backups\destiny-backup-2025-01-22\messages" /E /I /Q

# 复制配置文件
copy "package.json" "G:\backups\destiny-backup-2025-01-22\"
copy "vite.config.ts" "G:\backups\destiny-backup-2025-01-22\"
copy "tailwind.config.js" "G:\backups\destiny-backup-2025-01-22\"
copy "tsconfig.json" "G:\backups\destiny-backup-2025-01-22\"
copy "docker-compose.yml" "G:\backups\destiny-backup-2025-01-22\"

# 复制所有Markdown文档
copy "*.md" "G:\backups\destiny-backup-2025-01-22\"
```

### 方法3: 使用PowerShell

#### 1. 打开PowerShell
- 按 `Win + X`
- 选择 "Windows PowerShell (管理员)"
- 导航到项目目录：`cd C:\Users\Administrator\Desktop\destiny`

#### 2. 执行PowerShell备份命令
```powershell
# 设置变量
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "G:\backups\destiny-backup-$timestamp"

# 创建备份目录
New-Item -ItemType Directory -Force -Path "G:\backups"
New-Item -ItemType Directory -Force -Path $backupPath

# 复制文件夹
Copy-Item -Path "src" -Destination "$backupPath\src" -Recurse -Force
Copy-Item -Path "backend" -Destination "$backupPath\backend" -Recurse -Force
Copy-Item -Path "public" -Destination "$backupPath\public" -Recurse -Force
Copy-Item -Path "messages" -Destination "$backupPath\messages" -Recurse -Force

# 复制配置文件
$configFiles = @("package.json", "vite.config.ts", "tailwind.config.js", "tsconfig.json", "docker-compose.yml")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $backupPath -Force
    }
}

# 复制Markdown文档
Get-ChildItem -Filter "*.md" | Copy-Item -Destination $backupPath -Force

# 创建压缩包
Compress-Archive -Path "$backupPath\*" -DestinationPath "$backupPath.zip" -CompressionLevel Optimal

Write-Host "✅ 备份完成！位置：$backupPath"
```

## 📦 创建压缩包

### 使用Windows内置压缩
1. 右键点击备份文件夹
2. 选择"发送到" > "压缩(zipped)文件夹"
3. 重命名为：`destiny-backup-2025-01-22.zip`

### 使用PowerShell压缩
```powershell
Compress-Archive -Path "G:\backups\destiny-backup-2025-01-22\*" -DestinationPath "G:\backups\destiny-backup-2025-01-22.zip" -CompressionLevel Optimal
```

## 🔍 验证备份

### 检查备份内容
确保备份包含以下内容：

```
G:\backups\destiny-backup-2025-01-22\
├── src/                    # 前端源代码
├── backend/                # 后端源代码
├── public/                 # 静态资源
├── messages/               # 多语言文件
├── package.json            # 前端依赖
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
├── tsconfig.json          # TypeScript配置
├── docker-compose.yml     # Docker配置
└── *.md                   # 文档文件
```

### 检查文件大小
- **备份文件夹**: 约 20-50 MB
- **压缩包**: 约 10-25 MB
- **文件数量**: 约 100-200 个文件

## 🔄 恢复项目

### 从G盘恢复项目
1. **解压备份**：
   - 解压 `destiny-backup-2025-01-22.zip` 到新位置

2. **安装依赖**：
   ```bash
   # 前端依赖
   npm install

   # 后端依赖
   cd backend
   npm install
   cd ..
   ```

3. **配置环境**：
   ```bash
   # 创建环境变量文件
   cp backend/.env.example backend/.env
   # 编辑配置文件
   ```

4. **启动服务**：
   ```bash
   # 启动前端 (终端1)
   npm run dev

   # 启动后端 (终端2)
   cd backend && npm start
   ```

## 🛡️ 备份最佳实践

### 定期备份
- **频率**: 每周或重要更新后
- **命名**: 使用时间戳命名 `destiny-backup-YYYY-MM-DD`
- **位置**: 多个位置存储（本地、外部驱动器、云端）

### 验证备份
- 定期检查备份文件的完整性
- 测试备份的恢复过程
- 确保重要文件没有遗漏

### 安全考虑
- 不要备份包含敏感信息的 `.env` 文件
- 考虑加密重要的备份文件
- 保留多个版本的备份

## 🎯 快速备份检查清单

- [ ] 创建G盘备份目录
- [ ] 复制src文件夹
- [ ] 复制backend文件夹
- [ ] 复制public文件夹
- [ ] 复制messages文件夹
- [ ] 复制package.json
- [ ] 复制vite.config.ts
- [ ] 复制tailwind.config.js
- [ ] 复制tsconfig.json
- [ ] 复制docker-compose.yml
- [ ] 复制所有.md文档
- [ ] 创建ZIP压缩包
- [ ] 验证备份完整性

## 🎉 备份完成

完成上述步骤后，您的Destiny项目将成功备份到G盘。备份包含所有必要的源代码、配置文件和文档，可以在需要时完整恢复项目。

**建议**: 定期使用此指南创建项目备份，确保开发成果的安全性。
