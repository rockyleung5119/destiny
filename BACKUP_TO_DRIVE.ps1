# Destiny项目通用驱动器备份脚本
# 可以备份到任何可用的驱动器

param(
    [string]$TargetDrive = "G:",
    [string]$BackupFolder = "backups"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    🚀 Destiny项目驱动器备份工具" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前时间戳
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "destiny-backup-$timestamp"

# 检查目标驱动器是否存在
Write-Host "🔍 检查目标驱动器..." -ForegroundColor Yellow
$availableDrives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null }

Write-Host "📋 可用驱动器列表:" -ForegroundColor Cyan
foreach ($drive in $availableDrives) {
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $usedSpaceGB = [math]::Round($drive.Used / 1GB, 2)
    Write-Host "   $($drive.Name): - 可用空间: $freeSpaceGB GB, 已用空间: $usedSpaceGB GB" -ForegroundColor White
}

# 如果指定的驱动器不存在，让用户选择
if (-not (Test-Path $TargetDrive)) {
    Write-Host ""
    Write-Host "⚠️  指定的驱动器 $TargetDrive 不存在或无法访问" -ForegroundColor Yellow
    Write-Host ""
    
    # 自动选择第一个有足够空间的驱动器（除了C盘）
    $suitableDrive = $availableDrives | Where-Object { 
        $_.Name -ne "C" -and $_.Free -gt 500MB 
    } | Select-Object -First 1
    
    if ($suitableDrive) {
        $TargetDrive = "$($suitableDrive.Name):"
        Write-Host "🎯 自动选择驱动器: $TargetDrive" -ForegroundColor Green
    } else {
        # 如果没有合适的驱动器，使用C盘的临时目录
        $TargetDrive = "C:"
        $BackupFolder = "temp\backups"
        Write-Host "🎯 使用C盘临时目录: C:\temp\backups" -ForegroundColor Yellow
    }
}

# 设置完整备份路径
$fullBackupPath = Join-Path $TargetDrive $BackupFolder
$backupPath = Join-Path $fullBackupPath $backupName

Write-Host ""
Write-Host "📋 备份信息:" -ForegroundColor Yellow
Write-Host "   项目名称: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   目标驱动器: $TargetDrive" -ForegroundColor White
Write-Host "   备份路径: $backupPath" -ForegroundColor White
Write-Host ""

# 创建备份目录
try {
    New-Item -ItemType Directory -Force -Path $fullBackupPath | Out-Null
    New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
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
    "eslint.config.mjs",
    "next.config.js"
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
Write-Host "🗜️  创建ZIP压缩包..." -ForegroundColor Yellow

$zipPath = "$backupPath.zip"

try {
    Compress-Archive -Path "$backupPath\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
    
    if (Test-Path $zipPath) {
        $zipFile = Get-Item $zipPath
        $zipSizeMB = [math]::Round($zipFile.Length / 1MB, 2)
        $compressionRatio = [math]::Round((1 - $zipFile.Length / $backupSize) * 100, 1)
        
        Write-Host "✅ 压缩包创建成功！" -ForegroundColor Green
        Write-Host "   📦 压缩包路径: $zipPath" -ForegroundColor White
        Write-Host "   📏 压缩包大小: $zipSizeMB MB" -ForegroundColor White
        Write-Host "   🗜️  压缩率: $compressionRatio%" -ForegroundColor White
        
        Write-Host ""
        $deleteOriginal = Read-Host "🗑️  是否删除原始备份文件夹，只保留ZIP? (y/N)"
        
        if ($deleteOriginal -eq "y" -or $deleteOriginal -eq "Y") {
            Remove-Item -Path $backupPath -Recurse -Force
            Write-Host "✅ 原始备份文件夹已删除" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ 压缩包创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           🎉 备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 备份摘要:" -ForegroundColor Yellow
Write-Host "   🎯 项目: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   📅 备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   💾 备份驱动器: $TargetDrive" -ForegroundColor White
Write-Host "   📁 备份位置: $fullBackupPath" -ForegroundColor White
Write-Host "   📦 备份名称: $backupName" -ForegroundColor White
Write-Host ""

Write-Host "✅ 备份内容包括:" -ForegroundColor Green
Write-Host "   📂 源代码文件夹 (src/, backend/, public/)" -ForegroundColor White
Write-Host "   ⚙️  配置文件 (package.json, vite.config.ts 等)" -ForegroundColor White
Write-Host "   📚 文档文件 (所有 .md 文件)" -ForegroundColor White
Write-Host "   🗄️  数据库文件 (backend/destiny.db)" -ForegroundColor White
Write-Host "   🌐 多语言文件 (messages/)" -ForegroundColor White
Write-Host ""

$openFolder = Read-Host "📂 是否打开备份文件夹? (y/N)"
if ($openFolder -eq "y" -or $openFolder -eq "Y") {
    Start-Process explorer.exe -ArgumentList $fullBackupPath
}

Write-Host ""
Write-Host "🎊 备份操作已完成！项目已成功备份到 $TargetDrive 驱动器。" -ForegroundColor Green
Write-Host ""

Read-Host "按回车键退出"
