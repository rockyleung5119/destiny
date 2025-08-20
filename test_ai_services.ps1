# AI服务测试脚本 - 验证同步处理修复效果
# 测试4项AI服务是否能正常返回完整的AI分析结果

$baseUrl = "https://destiny-backend.jerryliang5119.workers.dev"
$demoEmail = "demo@example.com"
$demoPassword = "password123"

Write-Host "🔮 AI服务同步处理修复验证测试" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. 登录获取Token
Write-Host "🔑 正在登录demo用户..." -ForegroundColor Yellow
$loginBody = @{
    email = $demoEmail
    password = $demoPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        $token = $loginData.token
        Write-Host "✅ 登录成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 登录失败: $($loginData.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登录请求失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 测试4项AI服务
$services = @(
    @{ name = "八字精算"; endpoint = "/api/fortune/bazi"; body = @{ language = "zh" } },
    @{ name = "每日运势"; endpoint = "/api/fortune/daily"; body = @{ language = "zh" } },
    @{ name = "塔罗占卜"; endpoint = "/api/fortune/tarot"; body = @{ question = "我的事业运势如何？"; language = "zh" } },
    @{ name = "幸运物品"; endpoint = "/api/fortune/lucky"; body = @{ language = "zh" } }
)

$results = @()
$totalTime = 0

foreach ($service in $services) {
    Write-Host "`n🔮 测试 $($service.name)..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $requestBody = $service.body | ConvertTo-Json
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($service.endpoint)" -Method POST -Headers $headers -Body $requestBody -TimeoutSec 60
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        $totalTime += $duration
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            $analysis = $data.data.analysis
            $analysisLength = if ($analysis) { $analysis.Length } else { 0 }
            
            # 验证AI分析结果
            $isValidAnalysis = $analysis -and 
                              $analysisLength -gt 50 -and 
                              -not $analysis.ToLower().Contains("started") -and
                              -not $analysis.ToLower().Contains("processing") -and
                              -not $analysis.ToLower().Contains("please wait")
            
            if ($isValidAnalysis) {
                Write-Host "✅ $($service.name): 成功 ($([math]::Round($duration, 2))秒)" -ForegroundColor Green
                Write-Host "   📝 分析内容长度: $analysisLength 字符" -ForegroundColor Gray
                Write-Host "   📄 内容预览: $($analysis.Substring(0, [Math]::Min(100, $analysis.Length)))..." -ForegroundColor Gray
                
                $results += @{
                    service = $service.name
                    status = "成功"
                    duration = $duration
                    analysisLength = $analysisLength
                    valid = $true
                }
            } else {
                Write-Host "❌ $($service.name): AI结果不完整" -ForegroundColor Red
                Write-Host "   📝 返回内容: $analysis" -ForegroundColor Gray
                
                $results += @{
                    service = $service.name
                    status = "AI结果不完整"
                    duration = $duration
                    analysisLength = $analysisLength
                    valid = $false
                }
            }
        } else {
            Write-Host "❌ $($service.name): API失败 - $($data.message)" -ForegroundColor Red
            
            $results += @{
                service = $service.name
                status = "API失败: $($data.message)"
                duration = $duration
                analysisLength = 0
                valid = $false
            }
        }
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        $totalTime += $duration
        
        Write-Host "❌ $($service.name): 请求失败 - $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            service = $service.name
            status = "请求失败: $($_.Exception.Message)"
            duration = $duration
            analysisLength = 0
            valid = $false
        }
    }
}

# 3. 生成测试报告
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "📊 测试结果汇总" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.valid }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($successCount / $totalCount) * 100, 1)
$avgTime = [math]::Round($totalTime / $totalCount, 2)

foreach ($result in $results) {
    $statusColor = if ($result.valid) { "Green" } else { "Red" }
    $statusIcon = if ($result.valid) { "✅" } else { "❌" }
    
    Write-Host "$statusIcon $($result.service): $($result.status) ($([math]::Round($result.duration, 2))秒)" -ForegroundColor $statusColor
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "📈 成功率: $successCount/$totalCount ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
Write-Host "⏱️ 总耗时: $([math]::Round($totalTime, 2))秒" -ForegroundColor Gray
Write-Host "⚡ 平均响应时间: ${avgTime}秒" -ForegroundColor Gray

if ($successRate -eq 100) {
    Write-Host "`n🎉 所有AI服务测试通过！同步处理修复成功！" -ForegroundColor Green
} elseif ($successRate -gt 0) {
    Write-Host "`n⚠️ 部分AI服务测试失败，需要进一步检查。" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ 所有AI服务测试失败，需要检查配置和环境变量。" -ForegroundColor Red
}

Write-Host "`n🔧 修复说明:" -ForegroundColor Cyan
Write-Host "- 后端已从异步队列处理改为同步直接处理" -ForegroundColor Gray
Write-Host "- 前端验证逻辑已移除，直接接受API响应" -ForegroundColor Gray
Write-Host "- AI服务现在直接返回完整的分析结果" -ForegroundColor Gray
Write-Host "- 不再显示'started'或'processing'等初始状态消息" -ForegroundColor Gray
