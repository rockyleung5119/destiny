@echo off
chcp 65001 >nul
title 🚀 Destiny项目一键备份

color 0A
echo.
echo  ██████╗ ███████╗███████╗████████╗██╗███╗   ██╗██╗   ██╗
echo  ██╔══██╗██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║╚██╗ ██╔╝
echo  ██║  ██║█████╗  ███████╗   ██║   ██║██╔██╗ ██║ ╚████╔╝ 
echo  ██║  ██║██╔══╝  ╚════██║   ██║   ██║██║╚██╗██║  ╚██╔╝  
echo  ██████╔╝███████╗███████║   ██║   ██║██║ ╚████║   ██║   
echo  ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝   ╚═╝   
echo.
echo                    🚀 一键备份工具
echo.

:: 获取时间戳
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%"

:: 设置备份路径
set "backup_name=destiny-backup-%timestamp%"
set "backup_path=%USERPROFILE%\Desktop\%backup_name%"

echo 🎯 开始自动备份...
echo 📅 时间: %YYYY%-%MM%-%DD% %HH%:%Min%
echo 📁 位置: %USERPROFILE%\Desktop\%backup_name%
echo.

:: 创建备份目录
mkdir "%backup_path%" 2>nul

:: 快速复制核心文件
echo 📂 复制核心文件...
if exist "src" xcopy "src" "%backup_path%\src" /E /I /Q /Y >nul 2>nul && echo ✅ src
if exist "backend" xcopy "backend" "%backup_path%\backend" /E /I /Q /Y >nul 2>nul && echo ✅ backend  
if exist "public" xcopy "public" "%backup_path%\public" /E /I /Q /Y >nul 2>nul && echo ✅ public
if exist "messages" xcopy "messages" "%backup_path%\messages" /E /I /Q /Y >nul 2>nul && echo ✅ messages

:: 复制重要配置文件
echo.
echo ⚙️ 复制配置文件...
if exist "package.json" copy "package.json" "%backup_path%\" >nul 2>nul && echo ✅ package.json
if exist "vite.config.ts" copy "vite.config.ts" "%backup_path%\" >nul 2>nul && echo ✅ vite.config.ts
if exist "tailwind.config.js" copy "tailwind.config.js" "%backup_path%\" >nul 2>nul && echo ✅ tailwind.config.js
if exist "tsconfig.json" copy "tsconfig.json" "%backup_path%\" >nul 2>nul && echo ✅ tsconfig.json
if exist "docker-compose.yml" copy "docker-compose.yml" "%backup_path%\" >nul 2>nul && echo ✅ docker-compose.yml

:: 复制文档
echo.
echo 📚 复制文档...
for %%f in (*.md) do (
    if exist "%%f" copy "%%f" "%backup_path%\" >nul 2>nul && echo ✅ %%f
)

:: 自动创建压缩包
echo.
echo 🗜️ 创建压缩包...
powershell -command "Compress-Archive -Path '%backup_path%\*' -DestinationPath '%backup_path%.zip' -CompressionLevel Optimal -Force" 2>nul

if exist "%backup_path%.zip" (
    :: 删除原始文件夹，只保留压缩包
    rmdir /s /q "%backup_path%" 2>nul
    
    :: 获取压缩包大小
    for %%A in ("%backup_path%.zip") do set zip_size=%%~zA
    set /a zip_mb=!zip_size! / 1048576
    
    echo.
    echo ========================================
    echo            ✅ 备份成功！
    echo ========================================
    echo.
    echo 📦 备份文件: %backup_name%.zip
    echo 📁 保存位置: %USERPROFILE%\Desktop
    echo 📏 文件大小: !zip_mb! MB
    echo 📅 备份时间: %YYYY%-%MM%-%DD% %HH%:%Min%
    echo.
    echo 🎉 备份已完成并保存到桌面！
    echo.
    
    :: 询问是否打开文件夹
    set /p open_folder="📂 是否打开备份文件夹? (y/N): "
    if /i "!open_folder!"=="y" (
        explorer "%USERPROFILE%\Desktop"
    )
    
) else (
    echo ❌ 压缩包创建失败，但文件夹备份已完成
    echo 📁 备份位置: %backup_path%
)

echo.
echo 💡 恢复项目提示:
echo    1. 解压 %backup_name%.zip
echo    2. 在项目目录运行: npm install
echo    3. 在backend目录运行: npm install  
echo    4. 启动项目: npm run dev
echo.

timeout /t 5 /nobreak >nul
echo 🚀 备份完成，5秒后自动关闭...
timeout /t 5 >nul
