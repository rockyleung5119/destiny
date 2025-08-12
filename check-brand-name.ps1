# 检查品牌名称修改完整性脚本
Write-Host "=== 检查 'Celestial Wisdom' 是否还有遗漏 ===" -ForegroundColor Green

# 检查源代码文件
$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts","*.js","*.jsx" -ErrorAction SilentlyContinue

Write-Host "`n检查源代码文件..." -ForegroundColor Yellow
$foundInSource = $false
foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content.Contains("Celestial Wisdom")) {
        Write-Host "❌ 发现遗漏: $($file.FullName)" -ForegroundColor Red
        $foundInSource = $true
    }
}

if (-not $foundInSource) {
    Write-Host "✅ 源代码文件检查完成，无遗漏" -ForegroundColor Green
}

# 检查配置文件
$configFiles = @("index.html", "package.json")
Write-Host "`n检查配置文件..." -ForegroundColor Yellow
$foundInConfig = $false
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -and $content.Contains("Celestial Wisdom")) {
            Write-Host "❌ 发现遗漏: $file" -ForegroundColor Red
            $foundInConfig = $true
        }
    }
}

if (-not $foundInConfig) {
    Write-Host "✅ 配置文件检查完成，无遗漏" -ForegroundColor Green
}

# 总结
Write-Host "`n=== 检查结果 ===" -ForegroundColor Green
if (-not $foundInSource -and -not $foundInConfig) {
    Write-Host "🎉 所有 'Celestial Wisdom' 已成功替换为 'indicate.top'!" -ForegroundColor Green
} else {
    Write-Host "⚠️ 发现遗漏，请检查上述文件" -ForegroundColor Yellow
}
