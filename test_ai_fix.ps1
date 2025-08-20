# AI Services Fix Verification Test
# Test if 4 AI services now return complete AI analysis results

$baseUrl = "https://destiny-backend.jerryliang5119.workers.dev"
$demoEmail = "demo@example.com"
$demoPassword = "password123"

Write-Host "AI Services Sync Processing Fix Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

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

# 2. Test 4 AI services
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
    Write-Host "Testing $($service.name)..." -ForegroundColor Yellow
    
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
            
            # Validate AI analysis result
            $isValidAnalysis = $analysis -and 
                              $analysisLength -gt 50 -and 
                              -not $analysis.ToLower().Contains("started") -and
                              -not $analysis.ToLower().Contains("processing") -and
                              -not $analysis.ToLower().Contains("please wait")
            
            if ($isValidAnalysis) {
                Write-Host "SUCCESS: $($service.name) ($([math]::Round($duration, 2))s)" -ForegroundColor Green
                Write-Host "  Analysis length: $analysisLength characters" -ForegroundColor Gray
                Write-Host "  Preview: $($analysis.Substring(0, [Math]::Min(100, $analysis.Length)))..." -ForegroundColor Gray
                
                $results += @{
                    service = $service.name
                    status = "SUCCESS"
                    duration = $duration
                    analysisLength = $analysisLength
                    valid = $true
                }
            } else {
                Write-Host "FAILED: $($service.name) - Incomplete AI result" -ForegroundColor Red
                Write-Host "  Content: $analysis" -ForegroundColor Gray
                
                $results += @{
                    service = $service.name
                    status = "Incomplete AI result"
                    duration = $duration
                    analysisLength = $analysisLength
                    valid = $false
                }
            }
        } else {
            Write-Host "FAILED: $($service.name) - API error: $($data.message)" -ForegroundColor Red
            
            $results += @{
                service = $service.name
                status = "API error: $($data.message)"
                duration = $duration
                analysisLength = 0
                valid = $false
            }
        }
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        $totalTime += $duration
        
        Write-Host "FAILED: $($service.name) - Request failed: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            service = $service.name
            status = "Request failed: $($_.Exception.Message)"
            duration = $duration
            analysisLength = 0
            valid = $false
        }
    }
}

# 3. Generate test report
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.valid }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($successCount / $totalCount) * 100, 1)
$avgTime = [math]::Round($totalTime / $totalCount, 2)

foreach ($result in $results) {
    $statusColor = if ($result.valid) { "Green" } else { "Red" }
    $statusIcon = if ($result.valid) { "[OK]" } else { "[FAIL]" }
    
    Write-Host "$statusIcon $($result.service): $($result.status) ($([math]::Round($result.duration, 2))s)" -ForegroundColor $statusColor
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Success Rate: $successCount/$totalCount ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
Write-Host "Total Time: $([math]::Round($totalTime, 2))s" -ForegroundColor Gray
Write-Host "Average Response Time: ${avgTime}s" -ForegroundColor Gray

if ($successRate -eq 100) {
    Write-Host ""
    Write-Host "All AI services test PASSED! Sync processing fix successful!" -ForegroundColor Green
} elseif ($successRate -gt 0) {
    Write-Host ""
    Write-Host "Some AI services failed, need further investigation." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "All AI services failed, check configuration and environment variables." -ForegroundColor Red
}

Write-Host ""
Write-Host "Fix Summary:" -ForegroundColor Cyan
Write-Host "- Backend changed from async queue to sync direct processing" -ForegroundColor Gray
Write-Host "- Frontend validation logic removed, accepts API response directly" -ForegroundColor Gray
Write-Host "- AI services now return complete analysis results immediately" -ForegroundColor Gray
Write-Host "- No more 'started' or 'processing' initial status messages" -ForegroundColor Gray
