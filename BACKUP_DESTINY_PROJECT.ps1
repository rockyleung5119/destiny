# Destiny项目完整备份脚本 - 正确路径版本
# 项目路径: G:\projects\destiny

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    🚀 Destiny项目完整备份工具" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目路径
$projectPath = "G:\projects\destiny"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "destiny-complete-backup-$timestamp"

# 检查项目路径是否存在
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ 错误: 项目路径不存在: $projectPath" -ForegroundColor Red
    Write-Host "请确认项目路径是否正确。" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "✅ 项目路径确认: $projectPath" -ForegroundColor Green

# 设置备份位置（多个选项）
$backupLocations = @(
    "G:\backups\$backupName",
    "C:\Users\Administrator\Desktop\$backupName",
    "C:\Temp\$backupName"
)

$backupPath = $null
foreach ($location in $backupLocations) {
    try {
        $parentDir = Split-Path $location -Parent
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        New-Item -ItemType Directory -Path $location -Force | Out-Null
        $backupPath = $location
        Write-Host "✅ 备份目录创建成功: $backupPath" -ForegroundColor Green
        break
    } catch {
        Write-Host "⚠️  尝试位置失败: $location" -ForegroundColor Yellow
        continue
    }
}

if (-not $backupPath) {
    Write-Host "❌ 无法创建备份目录" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "📋 备份信息:" -ForegroundColor Yellow
Write-Host "   项目名称: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   项目路径: $projectPath" -ForegroundColor White
Write-Host "   备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   备份路径: $backupPath" -ForegroundColor White
Write-Host ""

# 切换到项目目录
Set-Location $projectPath

# 定义要备份的文件夹
$foldersToBackup = @(
    @{Name="src"; Description="前端源代码"},
    @{Name="backend"; Description="后端源代码"},
    @{Name="public"; Description="静态资源"},
    @{Name="messages"; Description="多语言文件"},
    @{Name="scripts"; Description="脚本文件"},
    @{Name="prisma"; Description="数据库模式"},
    @{Name="server"; Description="服务器文件"}
)

# 定义要备份的配置文件
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
    "next.config.js",
    "next-env.d.ts",
    "prometheus.yml"
)

Write-Host "📂 开始复制文件夹..." -ForegroundColor Yellow

# 复制文件夹
foreach ($folder in $foldersToBackup) {
    if (Test-Path $folder.Name) {
        try {
            $destPath = Join-Path $backupPath $folder.Name
            Copy-Item -Path $folder.Name -Destination $destPath -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ $($folder.Name) - $($folder.Description)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  $($folder.Name) 复制失败: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  $($folder.Name) 不存在" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📄 开始复制配置文件..." -ForegroundColor Yellow

# 复制配置文件
foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        try {
            Copy-Item -Path $file -Destination $backupPath -Force -ErrorAction Stop
            Write-Host "   ✅ $file" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  $file 复制失败: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "📚 复制文档文件..." -ForegroundColor Yellow

# 复制所有Markdown文档
try {
    $mdFiles = Get-ChildItem -Path "." -Filter "*.md" -File -ErrorAction SilentlyContinue
    foreach ($mdFile in $mdFiles) {
        Copy-Item -Path $mdFile.FullName -Destination $backupPath -Force
        Write-Host "   ✅ $($mdFile.Name)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  文档复制失败" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 复制脚本文件..." -ForegroundColor Yellow

# 复制脚本文件
try {
    $scriptFiles = Get-ChildItem -Path "." -Filter "*.ps1" -File -ErrorAction SilentlyContinue
    foreach ($scriptFile in $scriptFiles) {
        Copy-Item -Path $scriptFile.FullName -Destination $backupPath -Force
        Write-Host "   ✅ $($scriptFile.Name)" -ForegroundColor Green
    }
    
    $batFiles = Get-ChildItem -Path "." -Filter "*.bat" -File -ErrorAction SilentlyContinue
    foreach ($batFile in $batFiles) {
        Copy-Item -Path $batFile.FullName -Destination $backupPath -Force
        Write-Host "   ✅ $($batFile.Name)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  脚本文件复制失败" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 计算备份大小..." -ForegroundColor Yellow

# 计算备份大小
try {
    $backupSize = (Get-ChildItem $backupPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($backupSize / 1MB, 2)
    $fileCount = (Get-ChildItem $backupPath -Recurse -File -ErrorAction SilentlyContinue).Count
    
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
    # 使用.NET压缩
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($backupPath, $zipPath)
    
    if (Test-Path $zipPath) {
        $zipFile = Get-Item $zipPath
        $zipSizeMB = [math]::Round($zipFile.Length / 1MB, 2)
        
        if ($backupSize -gt 0) {
            $compressionRatio = [math]::Round((1 - $zipFile.Length / $backupSize) * 100, 1)
        } else {
            $compressionRatio = 0
        }
        
        Write-Host "✅ 压缩包创建成功！" -ForegroundColor Green
        Write-Host "   📦 压缩包路径: $zipPath" -ForegroundColor White
        Write-Host "   📏 压缩包大小: $zipSizeMB MB" -ForegroundColor White
        Write-Host "   🗜️  压缩率: $compressionRatio%" -ForegroundColor White
        
        # 询问是否删除原始文件夹
        Write-Host ""
        $deleteOriginal = Read-Host "🗑️  是否删除原始备份文件夹，只保留ZIP? (y/N)"
        
        if ($deleteOriginal -eq "y" -or $deleteOriginal -eq "Y") {
            try {
                Remove-Item -Path $backupPath -Recurse -Force
                Write-Host "✅ 原始备份文件夹已删除" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  删除原始文件夹失败" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "❌ 压缩包创建失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "但文件夹备份已完成" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           🎉 备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 备份摘要:" -ForegroundColor Yellow
Write-Host "   🎯 项目: Destiny Fortune Telling Platform" -ForegroundColor White
Write-Host "   📁 项目路径: $projectPath" -ForegroundColor White
Write-Host "   📅 备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "   💾 备份位置: $(Split-Path $backupPath -Parent)" -ForegroundColor White
Write-Host "   📦 备份名称: $backupName" -ForegroundColor White
Write-Host ""

Write-Host "✅ 备份内容包括:" -ForegroundColor Green
Write-Host "   📂 源代码文件夹 (src/, backend/, public/)" -ForegroundColor White
Write-Host "   ⚙️  配置文件 (package.json, vite.config.ts 等)" -ForegroundColor White
Write-Host "   📚 文档文件 (所有 .md 文件)" -ForegroundColor White
Write-Host "   🗄️  数据库文件 (backend/destiny.db)" -ForegroundColor White
Write-Host "   🌐 多语言文件 (messages/)" -ForegroundColor White
Write-Host "   🔧 脚本文件 (*.ps1, *.bat)" -ForegroundColor White
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

# 询问是否打开备份文件夹
$openFolder = Read-Host "📂 是否打开备份文件夹? (y/N)"
if ($openFolder -eq "y" -or $openFolder -eq "Y") {
    try {
        $folderToOpen = if (Test-Path $zipPath) { Split-Path $zipPath -Parent } else { Split-Path $backupPath -Parent }
        Start-Process explorer.exe -ArgumentList $folderToOpen
    } catch {
        Write-Host "⚠️  无法打开文件夹" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎊 备份操作已完成！项目已成功从 G:\projects\destiny 备份。" -ForegroundColor Green
Write-Host ""

Read-Host "按回车键退出"
