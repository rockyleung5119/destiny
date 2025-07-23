# 项目备份脚本
# 创建时间: 2025-07-22
# 用途: 备份整个 Destiny Fortune Telling 项目

param(
    [string]$BackupPath = "G:\backups",
    [switch]$IncludeNodeModules = $false
)

# 获取当前时间戳
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$projectName = "destiny-fortune-telling"
$backupName = "${projectName}_backup_${timestamp}"
$backupDir = Join-Path $BackupPath $backupName

Write-Host "🚀 开始备份项目..." -ForegroundColor Green
Write-Host "📁 源目录: $(Get-Location)" -ForegroundColor Cyan
Write-Host "📦 备份目录: $backupDir" -ForegroundColor Cyan

# 创建备份目录
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "✅ 创建备份根目录: $BackupPath" -ForegroundColor Yellow
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 定义要排除的文件和目录
$excludePatterns = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    ".vscode",
    ".idea",
    "*.log",
    "*.tmp",
    ".DS_Store",
    "Thumbs.db",
    ".env.local",
    ".env.production",
    "coverage",
    ".nyc_output",
    "*.backup",
    "*.bak"
)

# 如果指定包含 node_modules，则从排除列表中移除
if ($IncludeNodeModules) {
    $excludePatterns = $excludePatterns | Where-Object { $_ -ne "node_modules" }
    Write-Host "📦 包含 node_modules 目录" -ForegroundColor Yellow
}

Write-Host "🔍 开始复制文件..." -ForegroundColor Green

# 获取所有文件和目录
$items = Get-ChildItem -Path "." -Recurse -Force

$copiedFiles = 0
$skippedFiles = 0

foreach ($item in $items) {
    $relativePath = $item.FullName.Substring((Get-Location).Path.Length + 1)
    $shouldExclude = $false
    
    # 检查是否应该排除
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*$pattern*" -or $item.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude) {
        $destPath = Join-Path $backupDir $relativePath
        $destDir = Split-Path $destPath -Parent
        
        # 创建目标目录
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # 复制文件
        if ($item.PSIsContainer -eq $false) {
            try {
                Copy-Item -Path $item.FullName -Destination $destPath -Force
                $copiedFiles++
                
                if ($copiedFiles % 100 -eq 0) {
                    Write-Host "📄 已复制 $copiedFiles 个文件..." -ForegroundColor Gray
                }
            }
            catch {
                Write-Host "❌ 复制失败: $relativePath - $($_.Exception.Message)" -ForegroundColor Red
                $skippedFiles++
            }
        }
    }
    else {
        $skippedFiles++
    }
}

Write-Host "✅ 文件复制完成!" -ForegroundColor Green
Write-Host "📊 统计信息:" -ForegroundColor Cyan
Write-Host "   - 复制文件: $copiedFiles" -ForegroundColor White
Write-Host "   - 跳过文件: $skippedFiles" -ForegroundColor White

# 创建备份信息文件
$backupInfo = @{
    ProjectName = $projectName
    BackupTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    SourcePath = (Get-Location).Path
    BackupPath = $backupDir
    IncludeNodeModules = $IncludeNodeModules
    CopiedFiles = $copiedFiles
    SkippedFiles = $skippedFiles
    ExcludePatterns = $excludePatterns
}

$backupInfoJson = $backupInfo | ConvertTo-Json -Depth 3
$backupInfoPath = Join-Path $backupDir "backup_info.json"
$backupInfoJson | Out-File -FilePath $backupInfoPath -Encoding UTF8

Write-Host "📋 备份信息已保存到: backup_info.json" -ForegroundColor Yellow

# 计算备份大小
$backupSize = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host "📦 备份大小: $backupSizeMB MB" -ForegroundColor Cyan

# 创建压缩包
Write-Host "🗜️ 创建压缩包..." -ForegroundColor Green
$zipPath = "$backupDir.zip"

try {
    Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force
    
    # 获取压缩包大小
    $zipSize = (Get-Item $zipPath).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    
    Write-Host "✅ 压缩包创建成功!" -ForegroundColor Green
    Write-Host "📦 压缩包大小: $zipSizeMB MB" -ForegroundColor Cyan
    Write-Host "📁 压缩包路径: $zipPath" -ForegroundColor White
    
    # 询问是否删除未压缩的备份目录
    $deleteUncompressed = Read-Host "是否删除未压缩的备份目录? (y/N)"
    if ($deleteUncompressed -eq "y" -or $deleteUncompressed -eq "Y") {
        Remove-Item -Path $backupDir -Recurse -Force
        Write-Host "🗑️ 已删除未压缩的备份目录" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ 创建压缩包失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 备份完成!" -ForegroundColor Green
Write-Host "📍 备份位置: $BackupPath" -ForegroundColor White

# 显示备份历史
Write-Host "`n📚 最近的备份:" -ForegroundColor Cyan
Get-ChildItem -Path $BackupPath -Filter "${projectName}_backup_*" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    ForEach-Object {
        $size = if ($_.PSIsContainer) {
            $folderSize = (Get-ChildItem -Path $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
            "$([math]::Round($folderSize / 1MB, 2)) MB (文件夹)"
        } else {
            "$([math]::Round($_.Length / 1MB, 2)) MB (压缩包)"
        }
        Write-Host "   📦 $($_.Name) - $size - $($_.LastWriteTime)" -ForegroundColor Gray
    }

Write-Host "`n✨ 备份脚本执行完成!" -ForegroundColor Green
