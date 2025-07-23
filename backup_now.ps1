# Destiny项目自动备份脚本
# 使用方法: 右键点击此文件 -> "使用PowerShell运行"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    🚀 Destiny项目自动备份工具" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前时间戳
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$projectName = "destiny-project"
$backupName = "$projectName-backup-$timestamp"

# 设置备份路径（桌面）
$desktopPath = [Environment]::GetFolderPath("Desktop")
$backupPath = Join-Path $desktopPath $backupName

Write-Host "📋 备份信息:" -ForegroundColor Yellow
Write-Host "   项目名称: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   备份路径: $backupPath" -ForegroundColor White
Write-Host ""

# 创建备份目录
try {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Write-Host "✅ 备份目录创建成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 创建备份目录失败: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "📁 开始复制项目文件..." -ForegroundColor Yellow

# 定义要复制的文件夹
$foldersToBackup = @(
    "src",
    "backend", 
    "public",
    "messages",
    "scripts",
    "prisma"
)

# 定义要复制的单个文件
$filesToBackup = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tailwind.config.js",
    "tsconfig.json",
    "tsconfig.app.json", 
    "tsconfig.node.json",
    "docker-compose.yml",
    "Dockerfile",
    "nginx.conf",
    "index.html",
    "postcss.config.js",
    "eslint.config.js",
    "eslint.config.mjs"
)

# 复制文件夹
foreach ($folder in $foldersToBackup) {
    if (Test-Path $folder) {
        try {
            $destPath = Join-Path $backupPath $folder
            Copy-Item -Path $folder -Destination $destPath -Recurse -Force
            Write-Host "   ✅ 已复制: $folder" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  复制失败: $folder - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  文件夹不存在: $folder" -ForegroundColor Yellow
    }
}

# 复制单个文件
foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        try {
            Copy-Item -Path $file -Destination $backupPath -Force
            Write-Host "   ✅ 已复制: $file" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  复制失败: $file - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  文件不存在: $file" -ForegroundColor Yellow
    }
}

# 复制所有Markdown文档
$mdFiles = Get-ChildItem -Path "." -Filter "*.md" -File
foreach ($mdFile in $mdFiles) {
    try {
        Copy-Item -Path $mdFile.FullName -Destination $backupPath -Force
        Write-Host "   ✅ 已复制: $($mdFile.Name)" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  复制失败: $($mdFile.Name)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 计算备份大小..." -ForegroundColor Yellow

# 计算备份大小
try {
    $backupSize = (Get-ChildItem $backupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($backupSize / 1MB, 2)
    $fileCount = (Get-ChildItem $backupPath -Recurse -File).Count
    
    Write-Host ""
    Write-Host "📈 备份统计:" -ForegroundColor Cyan
    Write-Host "   📁 备份路径: $backupPath" -ForegroundColor White
    Write-Host "   📏 备份大小: $sizeMB MB" -ForegroundColor White
    Write-Host "   📄 文件数量: $fileCount 个" -ForegroundColor White
} catch {
    Write-Host "⚠️  无法计算备份大小" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗜️  是否创建ZIP压缩包？" -ForegroundColor Yellow
$createZip = Read-Host "输入 y 创建压缩包，直接回车跳过"

if ($createZip -eq "y" -or $createZip -eq "Y") {
    Write-Host ""
    Write-Host "📦 正在创建压缩包..." -ForegroundColor Yellow
    
    $zipPath = "$backupPath.zip"
    
    try {
        # 使用.NET压缩
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($backupPath, $zipPath)
        
        if (Test-Path $zipPath) {
            $zipFile = Get-Item $zipPath
            $zipSizeMB = [math]::Round($zipFile.Length / 1MB, 2)
            $compressionRatio = [math]::Round((1 - $zipFile.Length / $backupSize) * 100, 1)
            
            Write-Host "✅ 压缩包创建成功！" -ForegroundColor Green
            Write-Host "   📦 压缩包路径: $zipPath" -ForegroundColor White
            Write-Host "   📏 压缩包大小: $zipSizeMB MB" -ForegroundColor White
            Write-Host "   🗜️  压缩率: $compressionRatio%" -ForegroundColor White
            
            Write-Host ""
            Write-Host "🗑️  是否删除原始备份文件夹？" -ForegroundColor Yellow
            $deleteOriginal = Read-Host "输入 y 删除原始文件夹，直接回车保留"
            
            if ($deleteOriginal -eq "y" -or $deleteOriginal -eq "Y") {
                Remove-Item -Path $backupPath -Recurse -Force
                Write-Host "✅ 原始备份文件夹已删除" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "❌ 压缩包创建失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           🎉 备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 备份摘要:" -ForegroundColor Yellow
Write-Host "   🎯 项目: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   📅 备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   📁 备份位置: $desktopPath" -ForegroundColor White
Write-Host "   📦 备份名称: $backupName" -ForegroundColor White
Write-Host ""

Write-Host "✅ 备份内容包括:" -ForegroundColor Green
Write-Host "   📂 源代码文件夹 (src/, backend/, public/)" -ForegroundColor White
Write-Host "   ⚙️  配置文件 (package.json, vite.config.ts 等)" -ForegroundColor White
Write-Host "   📚 文档文件 (所有 .md 文件)" -ForegroundColor White
Write-Host "   🗄️  数据库文件 (backend/destiny.db)" -ForegroundColor White
Write-Host "   🌐 多语言文件 (messages/)" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  已排除的文件:" -ForegroundColor Yellow
Write-Host "   📦 node_modules (可重新安装)" -ForegroundColor Gray
Write-Host "   🔄 .git (版本控制历史)" -ForegroundColor Gray
Write-Host "   🏗️  dist/build (构建输出)" -ForegroundColor Gray
Write-Host "   📝 *.log (日志文件)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 项目恢复步骤:" -ForegroundColor Cyan
Write-Host "   1️⃣  解压备份到新位置" -ForegroundColor White
Write-Host "   2️⃣  运行: npm install" -ForegroundColor White
Write-Host "   3️⃣  运行: cd backend && npm install" -ForegroundColor White
Write-Host "   4️⃣  配置环境变量 (.env 文件)" -ForegroundColor White
Write-Host "   5️⃣  启动服务: npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "🎊 备份操作已完成！请检查桌面上的备份文件。" -ForegroundColor Green
Write-Host ""

Read-Host "按回车键退出"
