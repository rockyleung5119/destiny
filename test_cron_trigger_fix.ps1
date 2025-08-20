# Cloudflare Cron Trigger AI Services Test
# Test the new async processing architecture with Cron triggers

$baseUrl = "https://destiny-backend.jerryliang5119.workers.dev"
$demoEmail = "demo@example.com"
$demoPassword = "password123"

Write-Host "Cloudflare Cron Trigger AI Services Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. Login to get token
Write-Host "Logging in demo user..." -ForegroundColor Yellow
$loginBody = @{
    email = $demoEmail
    password = $demoPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        $token = $loginData.token
        Write-Host "Login successful" -ForegroundColor Green
    } else {
        Write-Host "Login failed: $($loginData.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test Cron Trigger Async Processing
$services = @(
    @{ name = "BaZi Analysis"; endpoint = "/api/fortune/bazi"; body = @{ language = "zh" } },
    @{ name = "Daily Fortune"; endpoint = "/api/fortune/daily"; body = @{ language = "zh" } },
    @{ name = "Tarot Reading"; endpoint = "/api/fortune/tarot"; body = @{ question = "How is my career?"; language = "en" } },
    @{ name = "Lucky Items"; endpoint = "/api/fortune/lucky"; body = @{ language = "zh" } }
)

$results = @()
$totalTime = 0

foreach ($service in $services) {
    Write-Host ""
    Write-Host "Testing $($service.name) with Cron Trigger..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $requestBody = $service.body | ConvertTo-Json
    $startTime = Get-Date
    
    try {
        # Step 1: Create task
        Write-Host "  Step 1: Creating async task..." -ForegroundColor Gray
        $taskResponse = Invoke-WebRequest -Uri "$baseUrl$($service.endpoint)" -Method POST -Headers $headers -Body $requestBody -TimeoutSec 30
        $taskData = $taskResponse.Content | ConvertFrom-Json
        
        if (-not $taskData.success -or -not $taskData.data.taskId) {
            throw "Failed to create task: $($taskData.message)"
        }
        
        $taskId = $taskData.data.taskId
        Write-Host "  Task created: $taskId" -ForegroundColor Green
        
        # Step 2: Poll task status
        Write-Host "  Step 2: Polling task status (max 5 minutes)..." -ForegroundColor Gray
        $maxWaitTime = 300 # 5 minutes
        $pollInterval = 10 # 10 seconds
        $pollStartTime = Get-Date
        $completed = $false
        $finalResult = $null
        
        while (((Get-Date) - $pollStartTime).TotalSeconds -lt $maxWaitTime) {
            try {
                $statusResponse = Invoke-WebRequest -Uri "$baseUrl/api/fortune/task/$taskId" -Method GET -Headers $headers -TimeoutSec 30
                $statusData = $statusResponse.Content | ConvertFrom-Json
                
                if ($statusData.success) {
                    $status = $statusData.data.status
                    Write-Host "    Status: $status" -ForegroundColor Gray
                    
                    if ($status -eq "completed" -and $statusData.data.analysis) {
                        $finalResult = $statusData.data.analysis
                        $completed = $true
                        break
                    } elseif ($status -eq "failed") {
                        throw "Task failed: $($statusData.data.error)"
                    }
                    # Continue polling for pending/processing status
                } else {
                    Write-Host "    Status check failed: $($statusData.message)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "    Status check error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            Start-Sleep -Seconds $pollInterval
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        $totalTime += $duration
        
        if ($completed -and $finalResult) {
            $analysisLength = $finalResult.Length
            Write-Host "SUCCESS: $($service.name) ($([math]::Round($duration, 2))s)" -ForegroundColor Green
            Write-Host "  Analysis length: $analysisLength characters" -ForegroundColor Gray
            Write-Host "  Preview: $($finalResult.Substring(0, [Math]::Min(100, $finalResult.Length)))..." -ForegroundColor Gray
            
            $results += @{
                service = $service.name
                status = "SUCCESS"
                duration = $duration
                analysisLength = $analysisLength
                taskId = $taskId
                valid = $true
            }
        } else {
            Write-Host "TIMEOUT: $($service.name) - No result after $maxWaitTime seconds" -ForegroundColor Red
            
            $results += @{
                service = $service.name
                status = "TIMEOUT"
                duration = $duration
                analysisLength = 0
                taskId = $taskId
                valid = $false
            }
        }
        
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        $totalTime += $duration
        
        Write-Host "FAILED: $($service.name) - $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            service = $service.name
            status = "FAILED: $($_.Exception.Message)"
            duration = $duration
            analysisLength = 0
            taskId = "N/A"
            valid = $false
        }
    }
}

# 3. Generate test report
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Cron Trigger Test Results Summary" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.valid }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($successCount / $totalCount) * 100, 1)
$avgTime = [math]::Round($totalTime / $totalCount, 2)

foreach ($result in $results) {
    $statusColor = if ($result.valid) { "Green" } else { "Red" }
    $statusIcon = if ($result.valid) { "[OK]" } else { "[FAIL]" }
    
    Write-Host "$statusIcon $($result.service): $($result.status) ($([math]::Round($result.duration, 2))s)" -ForegroundColor $statusColor
    if ($result.taskId -ne "N/A") {
        Write-Host "    Task ID: $($result.taskId)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Success Rate: $successCount/$totalCount ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
Write-Host "Total Time: $([math]::Round($totalTime, 2))s" -ForegroundColor Gray
Write-Host "Average Response Time: ${avgTime}s" -ForegroundColor Gray

if ($successRate -eq 100) {
    Write-Host ""
    Write-Host "All AI services test PASSED! Cron Trigger solution successful!" -ForegroundColor Green
} elseif ($successRate -gt 0) {
    Write-Host ""
    Write-Host "Some AI services succeeded. Cron Trigger is working but may need optimization." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "All AI services failed. Check Cron Trigger configuration." -ForegroundColor Red
}

Write-Host ""
Write-Host "Cron Trigger Architecture:" -ForegroundColor Cyan
Write-Host "- HTTP API creates task and returns immediately (30s limit)" -ForegroundColor Gray
Write-Host "- Cron trigger processes AI tasks every 2 minutes (15min limit)" -ForegroundColor Gray
Write-Host "- Frontend polls task status until completion" -ForegroundColor Gray
Write-Host "- No more timeout issues with complex AI processing" -ForegroundColor Gray
