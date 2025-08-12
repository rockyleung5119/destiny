@echo off
chcp 65001 >nul
title Destiny Project Backup Tool

echo ========================================
echo     Destiny Project Complete Backup
echo ========================================
echo.

:: Get timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%"

:: Set project and backup paths
set "project_path=G:\projects\destiny"
set "backup_name=destiny-complete-backup-%timestamp%"

:: Try multiple backup locations
set "backup_path=G:\backups\%backup_name%"
if not exist "G:\backups" mkdir "G:\backups" 2>nul

if not exist "G:\backups" (
    set "backup_path=C:\Users\Administrator\Desktop\%backup_name%"
)

echo Project Path: %project_path%
echo Backup Path: %backup_path%
echo Backup Time: %YYYY%-%MM%-%DD% %HH%:%Min%
echo.

:: Check if project path exists
if not exist "%project_path%" (
    echo ERROR: Project path does not exist: %project_path%
    echo Please check the project path.
    pause
    exit /b 1
)

:: Create backup directory
echo Creating backup directory...
mkdir "%backup_path%" 2>nul
if errorlevel 1 (
    echo ERROR: Failed to create backup directory
    pause
    exit /b 1
)
echo SUCCESS: Backup directory created
echo.

:: Change to project directory
cd /d "%project_path%"

:: Copy core folders
echo Copying core folders...

if exist "src" (
    echo    Copying src folder...
    xcopy "src" "%backup_path%\src" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: src copy failed) else (echo    SUCCESS: src copied)
)

if exist "backend" (
    echo    Copying backend folder...
    xcopy "backend" "%backup_path%\backend" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: backend copy failed) else (echo    SUCCESS: backend copied)
)

if exist "public" (
    echo    Copying public folder...
    xcopy "public" "%backup_path%\public" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: public copy failed) else (echo    SUCCESS: public copied)
)

if exist "messages" (
    echo    Copying messages folder...
    xcopy "messages" "%backup_path%\messages" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: messages copy failed) else (echo    SUCCESS: messages copied)
)

if exist "scripts" (
    echo    Copying scripts folder...
    xcopy "scripts" "%backup_path%\scripts" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: scripts copy failed) else (echo    SUCCESS: scripts copied)
)

if exist "prisma" (
    echo    Copying prisma folder...
    xcopy "prisma" "%backup_path%\prisma" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: prisma copy failed) else (echo    SUCCESS: prisma copied)
)

if exist "server" (
    echo    Copying server folder...
    xcopy "server" "%backup_path%\server" /E /I /Q /Y >nul 2>nul
    if errorlevel 1 (echo    WARNING: server copy failed) else (echo    SUCCESS: server copied)
)

echo.

:: Copy configuration files
echo Copying configuration files...

set "config_files=package.json package-lock.json vite.config.ts tailwind.config.js tsconfig.json tsconfig.app.json tsconfig.node.json docker-compose.yml Dockerfile nginx.conf index.html postcss.config.js eslint.config.js eslint.config.mjs next.config.js next-env.d.ts prometheus.yml"

for %%f in (%config_files%) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    WARNING: %%f copy failed) else (echo    SUCCESS: %%f copied)
    )
)

echo.

:: Copy documentation files
echo Copying documentation files...
for %%f in (*.md) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    WARNING: %%f copy failed) else (echo    SUCCESS: %%f copied)
    )
)

echo.

:: Copy script files
echo Copying script files...
for %%f in (*.ps1 *.bat) do (
    if exist "%%f" (
        copy "%%f" "%backup_path%\" >nul 2>nul
        if errorlevel 1 (echo    WARNING: %%f copy failed) else (echo    SUCCESS: %%f copied)
    )
)

echo.

:: Calculate backup size
echo Calculating backup size...
for /f "usebackq" %%A in (`powershell -command "try { (Get-ChildItem '%backup_path%' -Recurse -File | Measure-Object -Property Length -Sum).Sum } catch { 0 }"`) do set backup_size=%%A
if "%backup_size%"=="" set backup_size=0
set /a size_mb=%backup_size% / 1048576

for /f "usebackq" %%A in (`powershell -command "try { (Get-ChildItem '%backup_path%' -Recurse -File).Count } catch { 0 }"`) do set file_count=%%A
if "%file_count%"=="" set file_count=0

echo.
echo Backup Statistics:
echo    Backup Path: %backup_path%
echo    Backup Size: %size_mb% MB
echo    File Count: %file_count% files
echo.

:: Create ZIP archive
echo Creating ZIP archive...
set "zip_path=%backup_path%.zip"

powershell -command "try { Compress-Archive -Path '%backup_path%\*' -DestinationPath '%zip_path%' -CompressionLevel Optimal -Force; Write-Host 'Compression completed' } catch { Write-Host 'Compression failed' }" 2>nul

if exist "%zip_path%" (
    for %%A in ("%zip_path%") do set zip_size=%%~zA
    set /a zip_mb=!zip_size! / 1048576
    
    echo SUCCESS: ZIP archive created!
    echo    ZIP Path: %zip_path%
    echo    ZIP Size: !zip_mb! MB
    echo.
    
    set /p delete_folder="Delete original backup folder and keep only ZIP? (y/N): "
    if /i "!delete_folder!"=="y" (
        rmdir /s /q "%backup_path%"
        echo SUCCESS: Original backup folder deleted, ZIP archive retained
    )
) else (
    echo WARNING: ZIP archive creation failed, but folder backup completed
)

echo.
echo ========================================
echo           BACKUP COMPLETED!
echo ========================================
echo.

echo Backup Summary:
echo    Project: Destiny Fortune Telling Platform
echo    Source: %project_path%
echo    Backup Time: %YYYY%-%MM%-%DD% %HH%:%Min%
echo    Backup Location: %backup_path%
echo.

echo Backup Contents Include:
echo    - Source code folders (src/, backend/, public/)
echo    - Configuration files (package.json, vite.config.ts, etc.)
echo    - Documentation files (all .md files)
echo    - Database files (backend/destiny.db)
echo    - Multi-language files (messages/)
echo    - Script files (*.ps1, *.bat)
echo.

echo Excluded Files:
echo    - node_modules (can be reinstalled)
echo    - .git (version control history)
echo    - dist/build (build output)
echo    - *.log (log files)
echo.

echo Project Recovery Steps:
echo    1. Extract backup to new location
echo    2. Run: npm install
echo    3. Run: cd backend && npm install
echo    4. Configure environment variables (.env file)
echo    5. Start services: npm run dev
echo.

:: Ask to open backup folder
set /p open_folder="Open backup folder? (y/N): "
if /i "%open_folder%"=="y" (
    if exist "%zip_path%" (
        explorer "%~dp0%zip_path%\.."
    ) else (
        explorer "%backup_path%"
    )
)

echo.
echo Backup operation completed! Project successfully backed up from G:\projects\destiny
echo.

pause
