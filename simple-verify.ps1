# 简单备份验证脚本
$BackupPath = "F:\projects\destiny-backup-2025-07-27_23-53-41"

Write-Host "=== 项目备份验证 ===" -ForegroundColor Green
Write-Host "备份路径: $BackupPath" -ForegroundColor Yellow

# 检查备份目录是否存在
if (Test-Path $BackupPath) {
    Write-Host "✅ 备份目录存在" -ForegroundColor Green
} else {
    Write-Host "❌ 备份目录不存在!" -ForegroundColor Red
    exit 1
}

# 检查关键目录
$dirs = @("src", "backend", "database", "public", "prisma")
Write-Host "`n检查关键目录..." -ForegroundColor Yellow
foreach ($dir in $dirs) {
    $dirPath = Join-Path $BackupPath $dir
    if (Test-Path $dirPath) {
        Write-Host "✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir" -ForegroundColor Red
    }
}

# 检查关键文件
$files = @("package.json", ".env", "next.config.js")
Write-Host "`n检查关键文件..." -ForegroundColor Yellow
foreach ($file in $files) {
    $filePath = Join-Path $BackupPath $file
    if (Test-Path $filePath) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

# 统计信息
Write-Host "`n统计信息..." -ForegroundColor Yellow
$fileCount = (Get-ChildItem -Path $BackupPath -Recurse -File).Count
$dirCount = (Get-ChildItem -Path $BackupPath -Recurse -Directory).Count

Write-Host "📁 目录数量: $dirCount" -ForegroundColor Cyan
Write-Host "📄 文件数量: $fileCount" -ForegroundColor Cyan

Write-Host "`n✅ 备份验证完成!" -ForegroundColor Green
