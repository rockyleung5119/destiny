# 项目备份脚本
param(
    [string]$BackupPath = "G:\backups"
)

# 获取时间戳
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "destiny-project-backup-$timestamp"
$fullBackupPath = Join-Path $BackupPath $backupName

Write-Host "🚀 开始创建项目备份..." -ForegroundColor Green
Write-Host "📁 源路径: $(Get-Location)" -ForegroundColor Yellow
Write-Host "📦 备份路径: $fullBackupPath" -ForegroundColor Cyan

# 创建备份目录
try {
    New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
    New-Item -ItemType Directory -Force -Path $fullBackupPath | Out-Null
    Write-Host "✅ 备份目录创建成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 创建备份目录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 定义要排除的文件夹和文件
$excludeDirs = @("node_modules", ".git", "dist", "build", ".vscode", ".idea", "coverage", ".next", "tmp", "temp")
$excludeFiles = @("*.log", "*.tmp", "*.cache", "*.lock", "desktop.ini", "Thumbs.db")

Write-Host "📋 开始复制文件..." -ForegroundColor Yellow

# 复制文件
try {
    # 获取所有文件和文件夹
    $items = Get-ChildItem -Path "." -Recurse | Where-Object {
        $item = $_
        $shouldExclude = $false
        
        # 检查是否在排除的目录中
        foreach ($excludeDir in $excludeDirs) {
            if ($item.FullName -like "*\$excludeDir\*" -or $item.Name -eq $excludeDir) {
                $shouldExclude = $true
                break
            }
        }
        
        # 检查是否是排除的文件类型
        if (-not $shouldExclude -and -not $item.PSIsContainer) {
            foreach ($excludeFile in $excludeFiles) {
                if ($item.Name -like $excludeFile) {
                    $shouldExclude = $true
                    break
                }
            }
        }
        
        return -not $shouldExclude
    }
    
    $totalItems = $items.Count
    $currentItem = 0
    
    foreach ($item in $items) {
        $currentItem++
        $relativePath = $item.FullName.Substring((Get-Location).Path.Length + 1)
        $destinationPath = Join-Path $fullBackupPath $relativePath
        
        # 显示进度
        if ($currentItem % 100 -eq 0 -or $currentItem -eq $totalItems) {
            $percent = [math]::Round(($currentItem / $totalItems) * 100, 1)
            Write-Host "📄 进度: $percent% ($currentItem/$totalItems)" -ForegroundColor Cyan
        }
        
        if ($item.PSIsContainer) {
            # 创建目录
            New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null
        } else {
            # 复制文件
            $destinationDir = Split-Path $destinationPath -Parent
            if (-not (Test-Path $destinationDir)) {
                New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
            }
            Copy-Item -Path $item.FullName -Destination $destinationPath -Force
        }
    }
    
    Write-Host "✅ 文件复制完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 文件复制失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 计算备份大小
try {
    $backupSize = (Get-ChildItem $fullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($backupSize / 1MB, 2)
    $sizeGB = [math]::Round($backupSize / 1GB, 3)
    
    Write-Host "📊 备份统计:" -ForegroundColor Yellow
    Write-Host "   📁 备份路径: $fullBackupPath" -ForegroundColor White
    Write-Host "   📏 备份大小: $sizeMB MB ($sizeGB GB)" -ForegroundColor White
    Write-Host "   📅 创建时间: $(Get-Date)" -ForegroundColor White
    Write-Host "   📄 文件数量: $totalItems" -ForegroundColor White
} catch {
    Write-Host "⚠️ 无法计算备份大小" -ForegroundColor Yellow
}

# 创建压缩包
$zipPath = "$fullBackupPath.zip"
Write-Host "🗜️ 开始创建压缩包..." -ForegroundColor Yellow

try {
    Compress-Archive -Path "$fullBackupPath\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
    
    if (Test-Path $zipPath) {
        $zipFile = Get-Item $zipPath
        $zipSizeMB = [math]::Round($zipFile.Length / 1MB, 2)
        $compressionRatio = [math]::Round((1 - $zipFile.Length / $backupSize) * 100, 1)
        
        Write-Host "✅ 压缩包创建成功!" -ForegroundColor Green
        Write-Host "📦 压缩包路径: $zipPath" -ForegroundColor Cyan
        Write-Host "📏 压缩包大小: $zipSizeMB MB" -ForegroundColor Cyan
        Write-Host "🗜️ 压缩率: $compressionRatio%" -ForegroundColor Cyan
        
        # 询问是否删除原始备份文件夹
        $deleteOriginal = Read-Host "是否删除原始备份文件夹? (y/N)"
        if ($deleteOriginal -eq "y" -or $deleteOriginal -eq "Y") {
            Remove-Item -Path $fullBackupPath -Recurse -Force
            Write-Host "🗑️ 原始备份文件夹已删除" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 压缩包创建失败" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 压缩失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 备份完成!" -ForegroundColor Green
Write-Host "📋 备份摘要:" -ForegroundColor Yellow
Write-Host "   🎯 项目: Destiny Fortune Telling" -ForegroundColor White
Write-Host "   📅 备份时间: $(Get-Date)" -ForegroundColor White
Write-Host "   📦 备份位置: $BackupPath" -ForegroundColor White
Write-Host "   📄 备份文件: $backupName" -ForegroundColor White

# 显示最近的备份文件
Write-Host "`n📚 最近的备份文件:" -ForegroundColor Yellow
Get-ChildItem $BackupPath -Filter "*destiny*" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    Format-Table Name, @{Name="Size(MB)";Expression={if($_.PSIsContainer){0}else{[math]::Round($_.Length/1MB,2)}}}, LastWriteTime -AutoSize
