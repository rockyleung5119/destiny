# 简单项目备份脚本
param(
    [string]$BackupPath = "G:\backups"
)

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
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 要排除的目录和文件
$excludeItems = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    ".vscode",
    ".idea",
    "coverage",
    ".nyc_output"
)

Write-Host "🔍 复制项目文件..." -ForegroundColor Green

# 复制所有文件，排除指定目录
robocopy "." $backupDir /E /XD $excludeItems /XF "*.log" "*.tmp" ".DS_Store" "Thumbs.db" /R:1 /W:1 /NP

Write-Host "✅ 文件复制完成!" -ForegroundColor Green

# 创建备份信息
$backupInfo = @"
项目备份信息
============
项目名称: $projectName
备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
源路径: $(Get-Location)
备份路径: $backupDir
排除项目: $($excludeItems -join ', ')
"@

$backupInfo | Out-File -FilePath (Join-Path $backupDir "backup_info.txt") -Encoding UTF8

# 计算备份大小
$backupSize = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host "📦 备份大小: $backupSizeMB MB" -ForegroundColor Cyan

# 创建压缩包
Write-Host "🗜️ 创建压缩包..." -ForegroundColor Green
$zipPath = "$backupDir.zip"

Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force

$zipSize = (Get-Item $zipPath).Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "✅ 压缩包创建成功!" -ForegroundColor Green
Write-Host "📦 压缩包大小: $zipSizeMB MB" -ForegroundColor Cyan
Write-Host "📁 压缩包路径: $zipPath" -ForegroundColor White

Write-Host "🎉 备份完成!" -ForegroundColor Green
