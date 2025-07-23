# Destiny Fortune Telling App - Project Backup Script
# Created: 2025-07-22

Write-Host "🔮 Starting Destiny Fortune Telling App Backup..." -ForegroundColor Cyan

# Get current date for backup folder name
$backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = "destiny_backup_$backupDate"
$backupPath = "G:\backups\$backupFolder"

# Create backup directory
Write-Host "📁 Creating backup directory: $backupPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Create subdirectories
New-Item -ItemType Directory -Path "$backupPath\frontend" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupPath\backend" -Force | Out-Null

Write-Host "📦 Copying project files..." -ForegroundColor Yellow

# Copy frontend files
$frontendSource = "G:\projects\destiny"
$frontendDest = "$backupPath\frontend"

# Frontend files to copy
$frontendItems = @(
    "src",
    "public", 
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js",
    "index.html",
    "README.md"
)

foreach ($item in $frontendItems) {
    $sourcePath = Join-Path $frontendSource $item
    if (Test-Path $sourcePath) {
        Write-Host "  ✅ Copying $item" -ForegroundColor Green
        Copy-Item -Path $sourcePath -Destination $frontendDest -Recurse -Force
    } else {
        Write-Host "  ⚠️  $item not found, skipping" -ForegroundColor Yellow
    }
}

# Copy backend files
$backendSource = "G:\projects\destiny\backend"
$backendDest = "$backupPath\backend"

if (Test-Path $backendSource) {
    Write-Host "  ✅ Copying backend directory" -ForegroundColor Green
    Copy-Item -Path "$backendSource\*" -Destination $backendDest -Recurse -Force
} else {
    Write-Host "  ❌ Backend directory not found!" -ForegroundColor Red
}

# Create backup info file
$backupInfo = @"
# Destiny Fortune Telling App - Backup Information

**Backup Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Backup Location:** $backupPath
**Original Project:** G:\projects\destiny

## Project Structure

### Frontend (React + TypeScript + Vite)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Features:** 
  - User Authentication
  - Email Verification
  - Membership System
  - Fortune Telling Services
  - Responsive Design

### Backend (Node.js + Express)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite
- **Features:**
  - JWT Authentication
  - Email SMTP (QQ Mail)
  - Rate Limiting
  - Security Middleware
  - RESTful API

## Configuration

### Email Settings (QQ Mail SMTP)
- **Service:** QQ Mail
- **Host:** smtp.qq.com
- **Port:** 587
- **Email:** indicate.top@foxmail.com
- **Auth Code:** oidulwiygxccbjbe

### Database
- **Type:** SQLite
- **Location:** backend/database/destiny.db
- **Tables:** users, memberships, email_verifications, user_sessions, fortune_readings

## Restore Instructions

### 1. Restore Frontend
```bash
cd frontend
npm install
npm run dev
```

### 2. Restore Backend
```bash
cd backend
npm install
npm start
```

### 3. Environment Setup
- Copy backend/.env file
- Ensure email credentials are configured
- Database will auto-initialize on first run

## URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

---
**Backup completed successfully!** ✅
"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.md" -Encoding UTF8

# Create restore script
$restoreScript = @"
# Destiny Fortune Telling App - Restore Script

Write-Host "🔮 Restoring Destiny Fortune Telling App..." -ForegroundColor Cyan

# Set paths
`$projectPath = "G:\projects\destiny_restored"
`$backupPath = "$backupPath"

# Create project directory
Write-Host "📁 Creating project directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path `$projectPath -Force | Out-Null

# Copy files back
Write-Host "📦 Copying files..." -ForegroundColor Yellow
Copy-Item -Path "`$backupPath\frontend\*" -Destination `$projectPath -Recurse -Force
Copy-Item -Path "`$backupPath\backend" -Destination `$projectPath -Recurse -Force

Write-Host "✅ Project restored to: `$projectPath" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd `$projectPath && npm install" -ForegroundColor White
Write-Host "  2. cd backend && npm install" -ForegroundColor White
Write-Host "  3. npm run dev (frontend)" -ForegroundColor White
Write-Host "  4. npm start (backend)" -ForegroundColor White
"@

$restoreScript | Out-File -FilePath "$backupPath\restore.ps1" -Encoding UTF8

# Calculate backup size
$backupSize = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📊 Backup Statistics:" -ForegroundColor Cyan
Write-Host "  📁 Location: $backupPath" -ForegroundColor White
Write-Host "  📏 Size: $backupSizeMB MB" -ForegroundColor White
Write-Host "  📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

Write-Host "🎉 Your Destiny Fortune Telling App has been safely backed up!" -ForegroundColor Magenta
