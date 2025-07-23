# 项目备份脚本
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "destiny-fortune-telling_backup_$timestamp"
$backupPath = "G:\backups\$backupName"

Write-Host "开始备份项目..." -ForegroundColor Green
Write-Host "备份路径: $backupPath" -ForegroundColor Cyan

# 创建备份目录
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# 复制文件，排除不需要的目录
Write-Host "复制文件中..." -ForegroundColor Yellow

# 使用 robocopy 复制文件
robocopy "." $backupPath /E /XD "node_modules" ".git" "dist" "build" ".vscode" ".idea" /XF "*.log" "*.tmp" /R:1 /W:1

Write-Host "文件复制完成" -ForegroundColor Green

# 创建压缩包
Write-Host "创建压缩包..." -ForegroundColor Yellow
$zipPath = "$backupPath.zip"
Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force

# 获取大小信息
$zipSize = (Get-Item $zipPath).Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "备份完成!" -ForegroundColor Green
Write-Host "压缩包路径: $zipPath" -ForegroundColor White
Write-Host "压缩包大小: $zipSizeMB MB" -ForegroundColor Cyan

# 创建备份信息文件
$info = @"
项目备份信息
============
备份时间: $(Get-Date)
源路径: $(Get-Location)
备份路径: $zipPath
压缩包大小: $zipSizeMB MB
"@

$info | Out-File -FilePath (Join-Path (Split-Path $backupPath) "backup_info_$timestamp.txt") -Encoding UTF8

Write-Host "备份信息已保存" -ForegroundColor Green
