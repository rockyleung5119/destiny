# 测试用户资料API
Write-Host "👤 测试用户资料API..." -ForegroundColor Cyan

$baseURL = "http://localhost:3001/api"

try {
    # 1. 登录获取token
    Write-Host "`n🔐 1. 用户登录..." -ForegroundColor Yellow
    $loginBody = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseURL/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    
    if ($loginResponse.success) {
        $token = $loginResponse.data.token
        Write-Host "✅ 登录成功" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        throw "登录失败"
    }

    # 2. 测试 /auth/profile
    Write-Host "`n👤 2. 测试基础用户资料 (/auth/profile)..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $authProfileResponse = Invoke-RestMethod -Uri "$baseURL/auth/profile" -Method GET -Headers $headers
        
        if ($authProfileResponse.success) {
            Write-Host "✅ 基础用户资料API正常" -ForegroundColor Green
            $user = $authProfileResponse.user
            Write-Host "📋 用户信息:" -ForegroundColor Cyan
            Write-Host "   ID: $($user.id)" -ForegroundColor White
            Write-Host "   姓名: $($user.name)" -ForegroundColor White
            Write-Host "   邮箱: $($user.email)" -ForegroundColor White
            Write-Host "   性别: $($user.gender)" -ForegroundColor White
            Write-Host "   出生: $($user.birth_year)-$($user.birth_month)-$($user.birth_day) $($user.birth_hour)时" -ForegroundColor White
            Write-Host "   邮箱验证: $(if($user.is_email_verified) {'已验证'} else {'未验证'})" -ForegroundColor White
        } else {
            Write-Host "⚠️ 基础用户资料API错误: $($authProfileResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ 基础用户资料API失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 3. 测试 /user/profile
    Write-Host "`n👤 3. 测试详细用户资料 (/user/profile)..." -ForegroundColor Yellow
    try {
        $userProfileResponse = Invoke-RestMethod -Uri "$baseURL/user/profile" -Method GET -Headers $headers
        
        if ($userProfileResponse.success) {
            Write-Host "✅ 详细用户资料API正常" -ForegroundColor Green
            $user = $userProfileResponse.user
            Write-Host "📋 详细用户信息:" -ForegroundColor Cyan
            Write-Host "   ID: $($user.id)" -ForegroundColor White
            Write-Host "   姓名: $($user.name)" -ForegroundColor White
            Write-Host "   邮箱: $($user.email)" -ForegroundColor White
            Write-Host "   性别: $($user.gender)" -ForegroundColor White
            Write-Host "   出生: $($user.birthYear)-$($user.birthMonth)-$($user.birthDay) $($user.birthHour)时" -ForegroundColor White
            Write-Host "   出生地: $(if($user.birthPlace) {$user.birthPlace} else {'未设置'})" -ForegroundColor White
            Write-Host "   时区: $(if($user.timezone) {$user.timezone} else {'未设置'})" -ForegroundColor White
            Write-Host "   邮箱验证: $(if($user.isEmailVerified) {'已验证'} else {'未验证'})" -ForegroundColor White
            Write-Host "   资料更新次数: $($user.profileUpdatedCount)" -ForegroundColor White
            
            if ($user.membership) {
                Write-Host "💎 会员信息:" -ForegroundColor Magenta
                Write-Host "   计划: $($user.membership.plan_id)" -ForegroundColor White
                Write-Host "   状态: $(if($user.membership.is_active) {'激活'} else {'未激活'})" -ForegroundColor White
                Write-Host "   剩余积分: $($user.membership.remaining_credits)" -ForegroundColor White
                Write-Host "   过期时间: $($user.membership.expires_at)" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️ 详细用户资料API错误: $($userProfileResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ 详细用户资料API失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n🎉 用户资料API测试完成！" -ForegroundColor Green

} catch {
    Write-Host "❌ 测试失败: $($_.Exception.Message)" -ForegroundColor Red
}
