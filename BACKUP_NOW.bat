@echo off
chcp 65001 >nul
title 🚀 Destiny项目完整备份

echo ========================================
echo     🚀 Destiny项目完整备份工具
echo ========================================
echo.

:: 获取时间戳
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%"

:: 设置备份路径
set "backup_name=destiny-complete-backup-%timestamp%"
set "backup_path=%USERPROFILE%\Desktop\%backup_name%"

echo 📋 备份信息:
echo    项目名称: Destiny Fortune Telling Platform
echo    备份时间: %YYYY%-%MM%-%DD% %HH%:%Min%
echo    备份路径: %backup_path%
echo.

:: 创建备份目录
echo 📁 创建备份目录...
mkdir "%backup_path%" 2>nul
if errorlevel 1 (
    echo ❌ 创建备份目录失败
    pause
    exit /b 1
)
echo ✅ 备份目录创建成功
echo.

:: 复制核心文件夹
echo 📂 复制核心文件夹...

if exist "src" (
    echo    复制 src 文件夹...
    xcopy "src" "%backup_path%\src" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ src 复制失败) else (echo    ✅ src 复制成功)
)

if exist "backend" (
    echo    复制 backend 文件夹...
    xcopy "backend" "%backup_path%\backend" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ backend 复制失败) else (echo    ✅ backend 复制成功)
)

if exist "public" (
    echo    复制 public 文件夹...
    xcopy "public" "%backup_path%\public" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ public 复制失败) else (echo    ✅ public 复制成功)
)

if exist "messages" (
    echo    复制 messages 文件夹...
    xcopy "messages" "%backup_path%\messages" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ messages 复制失败) else (echo    ✅ messages 复制成功)
)

if exist "scripts" (
    echo    复制 scripts 文件夹...
    xcopy "scripts" "%backup_path%\scripts" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ scripts 复制失败) else (echo    ✅ scripts 复制成功)
)

if exist "prisma" (
    echo    复制 prisma 文件夹...
    xcopy "prisma" "%backup_path%\prisma" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ prisma 复制失败) else (echo    ✅ prisma 复制成功)
)

if exist "server" (
    echo    复制 server 文件夹...
    xcopy "server" "%backup_path%\server" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    ⚠️ server 复制失败) else (echo    ✅ server 复制成功)
)

echo.

:: 复制配置文件
echo ⚙️ 复制配置文件...

set "config_files=package.json package-lock.json vite.config.ts tailwind.config.js tsconfig.json tsconfig.app.json tsconfig.node.json docker-compose.yml Dockerfile nginx.conf index.html postcss.config.js eslint.config.js eslint.config.mjs next.config.js next-env.d.ts prometheus.yml"

for %%f in (%config_files%) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    ⚠️ %%f 复制失败) else (echo    ✅ %%f 复制成功)
    )
)

echo.

:: 复制文档文件
echo 📚 复制文档文件...
for %%f in (*.md) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    ⚠️ %%f 复制失败) else (echo    ✅ %%f 复制成功)
    )
)

echo.

:: 复制其他重要文件
echo 📄 复制其他重要文件...
for %%f in (*.ps1 *.bat *.js *.html *.yml *.json) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    ⚠️ %%f 复制失败) else (echo    ✅ %%f 复制成功)
    )
)

echo.

:: 计算备份大小
echo 📊 计算备份大小...
for /f "usebackq" %%A in (`powershell -command "try { (Get-ChildItem '%backup_path%' -Recurse -File | Measure-Object -Property Length -Sum).Sum } catch { 0 }"`) do set backup_size=%%A
if "%backup_size%"=="" set backup_size=0
set /a size_mb=%backup_size% / 1048576

for /f "usebackq" %%A in (`powershell -command "try { (Get-ChildItem '%backup_path%' -Recurse -File).Count } catch { 0 }"`) do set file_count=%%A
if "%file_count%"=="" set file_count=0

echo.
echo 📈 备份统计:
echo    📁 备份路径: %backup_path%
echo    📏 备份大小: %size_mb% MB
echo    📄 文件数量: %file_count% 个
echo.

:: 创建压缩包
echo 🗜️ 创建ZIP压缩包...
set "zip_path=%backup_path%.zip"

powershell -command "try { Compress-Archive -Path '%backup_path%\*' -DestinationPath '%zip_path%' -CompressionLevel Optimal -Force; Write-Host '压缩完成' } catch { Write-Host '压缩失败' }" 2>nul

if exist "%zip_path%" (
    for %%A in ("%zip_path%") do set zip_size=%%~zA
    set /a zip_mb=!zip_size! / 1048576
    
    echo ✅ 压缩包创建成功！
    echo    📦 压缩包: %zip_path%
    echo    📏 压缩大小: !zip_mb! MB
    echo.
    
    set /p delete_folder="🗑️ 是否删除原始备份文件夹，只保留ZIP? (y/N): "
    if /i "!delete_folder!"=="y" (
        rmdir /s /q "%backup_path%"
        echo ✅ 原始备份文件夹已删除，仅保留ZIP压缩包
    )
) else (
    echo ⚠️ 压缩包创建失败，但文件夹备份已完成
)

echo.
echo ========================================
echo           🎉 备份完成！
echo ========================================
echo.

echo 📋 备份摘要:
echo    🎯 项目: Destiny Fortune Telling Platform
echo    📅 备份时间: %YYYY%-%MM%-%DD% %HH%:%Min%
echo    📁 备份位置: %USERPROFILE%\Desktop
echo    📦 备份名称: %backup_name%
echo.

echo ✅ 备份内容包括:
echo    📂 源代码文件夹 (src/, backend/, public/)
echo    ⚙️ 配置文件 (package.json, vite.config.ts 等)
echo    📚 文档文件 (所有 .md 文件)
echo    🗄️ 数据库文件 (backend/destiny.db)
echo    🌐 多语言文件 (messages/)
echo    🔧 脚本文件 (scripts/, *.ps1, *.bat)
echo.

echo ⚠️ 已排除的文件:
echo    📦 node_modules (可重新安装)
echo    🔄 .git (版本控制历史)
echo    🏗️ dist/build (构建输出)
echo    📝 *.log (日志文件)
echo.

echo 🔄 项目恢复步骤:
echo    1️⃣ 解压备份到新位置
echo    2️⃣ 运行: npm install
echo    3️⃣ 运行: cd backend ^&^& npm install
echo    4️⃣ 配置环境变量 (.env 文件)
echo    5️⃣ 启动服务: npm run dev
echo.

:: 询问是否打开备份文件夹
set /p open_folder="📂 是否打开备份文件夹? (y/N): "
if /i "%open_folder%"=="y" (
    explorer "%USERPROFILE%\Desktop"
)

echo.
echo 🎊 备份操作已完成！项目已成功备份到桌面。
echo.

pause
