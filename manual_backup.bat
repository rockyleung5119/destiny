@echo off
echo ========================================
echo    Destiny Project Manual Backup
echo ========================================
echo.

:: 获取当前时间戳
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

:: 设置备份路径
set "backup_name=destiny-backup-%timestamp%"
set "backup_path=%USERPROFILE%\Desktop\%backup_name%"

echo 🚀 开始创建项目备份...
echo 📁 备份路径: %backup_path%
echo.

:: 创建备份目录
mkdir "%backup_path%" 2>nul
if errorlevel 1 (
    echo ❌ 创建备份目录失败
    pause
    exit /b 1
)

echo ✅ 备份目录创建成功
echo.

:: 复制源代码文件
echo 📋 复制源代码文件...
xcopy "src" "%backup_path%\src" /E /I /Q >nul
xcopy "backend" "%backup_path%\backend" /E /I /Q >nul
xcopy "public" "%backup_path%\public" /E /I /Q >nul
xcopy "messages" "%backup_path%\messages" /E /I /Q >nul

:: 复制配置文件
echo 📋 复制配置文件...
copy "package.json" "%backup_path%\" >nul
copy "vite.config.ts" "%backup_path%\" >nul
copy "tailwind.config.js" "%backup_path%\" >nul
copy "tsconfig.json" "%backup_path%\" >nul
copy "docker-compose.yml" "%backup_path%\" >nul
copy "nginx.conf" "%backup_path%\" >nul
copy "Dockerfile" "%backup_path%\" >nul

:: 复制文档文件
echo 📋 复制文档文件...
copy "*.md" "%backup_path%\" >nul 2>nul

:: 复制其他重要文件
copy "index.html" "%backup_path%\" >nul 2>nul
copy "postcss.config.js" "%backup_path%\" >nul 2>nul
copy "eslint.config.js" "%backup_path%\" >nul 2>nul

echo ✅ 文件复制完成
echo.

:: 计算备份大小
echo 📊 计算备份大小...
for /f "usebackq" %%A in (`powershell -command "(Get-ChildItem '%backup_path%' -Recurse | Measure-Object -Property Length -Sum).Sum"`) do set backup_size=%%A
set /a size_mb=%backup_size% / 1048576

echo.
echo ========================================
echo           备份完成！
echo ========================================
echo 📦 备份名称: %backup_name%
echo 📁 备份路径: %backup_path%
echo 📏 备份大小: %size_mb% MB
echo 📅 创建时间: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo.

:: 询问是否创建压缩包
set /p create_zip="是否创建ZIP压缩包? (y/N): "
if /i "%create_zip%"=="y" (
    echo.
    echo 🗜️ 创建压缩包...
    powershell -command "Compress-Archive -Path '%backup_path%\*' -DestinationPath '%backup_path%.zip' -CompressionLevel Optimal"
    if exist "%backup_path%.zip" (
        for %%A in ("%backup_path%.zip") do set zip_size=%%~zA
        set /a zip_mb=!zip_size! / 1048576
        echo ✅ 压缩包创建成功！
        echo 📦 压缩包: %backup_path%.zip
        echo 📏 压缩大小: !zip_mb! MB
        
        :: 询问是否删除原始文件夹
        set /p delete_folder="是否删除原始备份文件夹? (y/N): "
        if /i "!delete_folder!"=="y" (
            rmdir /s /q "%backup_path%"
            echo 🗑️ 原始备份文件夹已删除
        )
    ) else (
        echo ❌ 压缩包创建失败
    )
)

echo.
echo ========================================
echo         备份操作完成！
echo ========================================
echo.
echo 📋 备份内容包括:
echo    ✅ 源代码文件 (src/, backend/, public/)
echo    ✅ 配置文件 (package.json, vite.config.ts 等)
echo    ✅ 文档文件 (*.md)
echo    ✅ 数据库文件 (backend/destiny.db)
echo.
echo 📝 注意事项:
echo    ⚠️  node_modules 文件夹已排除 (可重新安装)
echo    ⚠️  .git 文件夹已排除 (版本控制历史)
echo    ⚠️  dist/build 文件夹已排除 (构建输出)
echo.
echo 🔄 恢复项目步骤:
echo    1. 解压备份文件到新位置
echo    2. 运行 npm install 安装依赖
echo    3. 运行 cd backend ^&^& npm install 安装后端依赖
echo    4. 配置环境变量 (.env 文件)
echo    5. 启动服务: npm run dev
echo.

pause
