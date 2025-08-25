@echo off
echo 🔍 GitHub Actions部署修复验证开始...

echo.
echo 📋 检查前端配置...
if exist "package.json" (
    echo ✅ package.json存在
) else (
    echo ❌ package.json缺失
    goto :error
)

if exist "src\components\StripePaymentModal.tsx" (
    echo ✅ StripePaymentModal.tsx存在
) else (
    echo ❌ StripePaymentModal.tsx缺失
    goto :error
)

if exist "src\components\StripeEnvironmentFix.tsx" (
    echo ✅ StripeEnvironmentFix.tsx存在
) else (
    echo ❌ StripeEnvironmentFix.tsx缺失
    goto :error
)

echo.
echo 🔨 测试前端构建...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    goto :error
)

if exist "dist\index.html" (
    echo ✅ 前端构建成功，dist\index.html生成
) else (
    echo ❌ 前端构建失败，dist\index.html未生成
    goto :error
)

echo.
echo 📋 检查后端配置...
if exist "backend\package.json" (
    echo ✅ backend\package.json存在
) else (
    echo ❌ backend\package.json缺失
    goto :error
)

if exist "backend\worker.ts" (
    echo ✅ backend\worker.ts存在
) else (
    echo ❌ backend\worker.ts缺失
    goto :error
)

if exist "backend\wrangler.toml" (
    echo ✅ backend\wrangler.toml存在
) else (
    echo ❌ backend\wrangler.toml缺失
    goto :error
)

echo.
echo 🧪 测试后端部署配置...
cd backend
call wrangler deploy --dry-run
if %errorlevel% neq 0 (
    echo ❌ 后端干运行测试失败
    cd ..
    goto :error
)
cd ..
echo ✅ 后端干运行测试成功

echo.
echo 📋 检查GitHub Actions配置...
if exist ".github\workflows\deploy-frontend.yml" (
    echo ✅ 前端工作流配置存在
) else (
    echo ❌ 前端工作流配置缺失
    goto :error
)

if exist ".github\workflows\deploy-backend.yml" (
    echo ✅ 后端工作流配置存在
) else (
    echo ❌ 后端工作流配置缺失
    goto :error
)

echo.
echo 🎉 所有检查都通过了！
echo.
echo 📝 GitHub Actions优化说明:
echo 1. ✅ 简化了前端部署流程
echo 2. ✅ 优化了后端部署配置  
echo 3. ✅ 移除了复杂的预检查逻辑
echo 4. ✅ 使用标准的wrangler部署命令
echo 5. ✅ 减少了超时时间到10分钟
echo.
echo 🚀 现在可以推送到GitHub进行自动部署！
echo.
echo 📋 推送前最后检查:
echo - 确保所有文件都已保存
echo - 确保没有未提交的更改
echo - 推送后观察GitHub Actions日志
echo.
goto :end

:error
echo.
echo ❌ 发现问题，请先修复后再推送
echo.
exit /b 1

:end
echo 🎯 验证完成！
pause
