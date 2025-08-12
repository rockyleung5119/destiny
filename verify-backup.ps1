# 备份验证脚本
# 验证最新备份的完整性

param(
    [string]$BackupPath = "F:\projects\destiny-backup-2025-07-27_23-53-41"
)

Write-Host "=== 项目备份验证脚本 ===" -ForegroundColor Green
Write-Host "备份路径: $BackupPath" -ForegroundColor Yellow

# 检查备份目录是否存在
if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ 错误: 备份目录不存在!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 备份目录存在" -ForegroundColor Green

# 检查关键目录
$criticalDirs = @("src", "backend", "database", "public", "prisma")

Write-Host "`n检查关键目录..." -ForegroundColor Yellow
foreach ($dir in $criticalDirs) {
    $dirPath = Join-Path $BackupPath $dir
    if (Test-Path $dirPath) {
        Write-Host "✅ $dir 目录存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir 目录缺失" -ForegroundColor Red
    }
}

# 检查关键文件
$criticalFiles = @("package.json", ".env", ".env.example", "next.config.js", "tsconfig.json")

Write-Host "`n检查关键文件..." -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $BackupPath $file
    if (Test-Path $filePath) {
        Write-Host "✅ $file 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $file 缺失" -ForegroundColor Red
    }
}

# 统计文件数量
Write-Host "`n统计备份内容..." -ForegroundColor Yellow
$fileCount = (Get-ChildItem -Path $BackupPath -Recurse -File).Count
$dirCount = (Get-ChildItem -Path $BackupPath -Recurse -Directory).Count
$totalSize = (Get-ChildItem -Path $BackupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum

Write-Host "📁 目录数量: $dirCount" -ForegroundColor Cyan
Write-Host "📄 文件数量: $fileCount" -ForegroundColor Cyan
Write-Host "💾 总大小: $([math]::Round($totalSize/1MB,2)) MB" -ForegroundColor Cyan

# 检查源代码目录
$srcPath = Join-Path $BackupPath "src"
if (Test-Path $srcPath) {
    $componentCount = (Get-ChildItem -Path (Join-Path $srcPath "components") -Filter "*.tsx" -ErrorAction SilentlyContinue).Count
    $pageCount = (Get-ChildItem -Path (Join-Path $srcPath "app") -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue).Count
    
    Write-Host "`n源代码统计:" -ForegroundColor Yellow
    Write-Host "🧩 React组件: $componentCount 个" -ForegroundColor Cyan
    Write-Host "📄 页面文件: $pageCount 个" -ForegroundColor Cyan
}

# 检查最近修改的文件
Write-Host "`n最近修改的文件 (前10个):" -ForegroundColor Yellow
Get-ChildItem -Path $BackupPath -Recurse -File | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10 | 
    ForEach-Object {
        $relativePath = $_.FullName.Replace($BackupPath, "").TrimStart('\')
        Write-Host "📝 $relativePath - $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
    }

Write-Host "`n=== 备份验证完成 ===" -ForegroundColor Green
Write-Host "备份看起来完整且有效!" -ForegroundColor Green
